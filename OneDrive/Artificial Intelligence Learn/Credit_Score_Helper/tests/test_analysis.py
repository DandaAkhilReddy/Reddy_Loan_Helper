"""Tests for the credit analysis engine (score_factors, payoff_strategy, score_projector)."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from src.analysis.score_factors import (
    Severity,
    ScoreFactor,
    analyze_score_factors,
    _parse_utilization,
    _count_derogatory,
    _active_delinquencies,
)
from src.analysis.payoff_strategy import (
    PayoffPlan,
    PayoffStep,
    compute_payoff_plan,
    _current_avg_score,
)
from src.analysis.score_projector import (
    MonthProjection,
    project_scores,
    _interpolate_months,
)


# ---------------------------------------------------------------------------
# Shared fixture — load the real credit report once per session
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def report() -> dict[str, Any]:
    path = Path(__file__).parent.parent / "data" / "credit_report.json"
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


@pytest.fixture(scope="session")
def factors(report: dict[str, Any]) -> list[ScoreFactor]:
    return analyze_score_factors(report)


@pytest.fixture(scope="session")
def payoff_plan(report: dict[str, Any]) -> PayoffPlan:
    return compute_payoff_plan(report)


@pytest.fixture(scope="session")
def projections(report: dict[str, Any], payoff_plan: PayoffPlan) -> list[MonthProjection]:
    return project_scores(report, payoff_plan)


# ---------------------------------------------------------------------------
# TestAnalyzeScoreFactors
# ---------------------------------------------------------------------------

class TestAnalyzeScoreFactors:
    def test_returns_non_empty_list(self, factors: list[ScoreFactor]) -> None:
        assert len(factors) > 0

    def test_returns_all_six_factors(self, factors: list[ScoreFactor]) -> None:
        # The engine computes exactly 6 factors (one per category)
        assert len(factors) == 6

    def test_sorted_critical_first(self, factors: list[ScoreFactor]) -> None:
        """Severity ordering must be CRITICAL → HIGH → MEDIUM → LOW → POSITIVE."""
        severity_order = {
            Severity.CRITICAL: 0,
            Severity.HIGH: 1,
            Severity.MEDIUM: 2,
            Severity.LOW: 3,
            Severity.POSITIVE: 4,
        }
        ranks = [severity_order[f.severity] for f in factors]
        assert ranks == sorted(ranks), "Factors must be sorted by severity ascending (critical=0 first)"

    def test_first_factor_is_critical(self, factors: list[ScoreFactor]) -> None:
        assert factors[0].severity == Severity.CRITICAL

    def test_first_factor_is_payment_or_derogatory(self, factors: list[ScoreFactor]) -> None:
        """The highest-severity factor must be either Payment History or Derogatory Marks.
        Both are CRITICAL given the active OneMain delinquency in the report."""
        critical_categories = {"payment_history", "derogatory"}
        assert factors[0].category in critical_categories

    def test_all_factors_have_required_fields(self, factors: list[ScoreFactor]) -> None:
        for f in factors:
            assert f.name, f"Factor {f.category!r} missing name"
            assert f.category, "category must not be empty"
            assert f.current_value, f"Factor {f.name!r} missing current_value"
            assert f.ideal_value, f"Factor {f.name!r} missing ideal_value"
            assert f.description, f"Factor {f.name!r} missing description"
            assert f.action, f"Factor {f.name!r} missing action"

    def test_score_impact_range_consistent(self, factors: list[ScoreFactor]) -> None:
        """For hurting factors, both bounds are negative and |low| <= |high|
        (i.e. score_impact_low is the pessimistic / smaller magnitude bound).
        For POSITIVE factors both bounds are non-negative and low <= high."""
        for f in factors:
            if f.severity == Severity.POSITIVE:
                assert f.score_impact_low >= 0, f"{f.name}: positive factor has negative low"
                assert f.score_impact_low <= f.score_impact_high, (
                    f"{f.name}: positive factor low > high"
                )
            else:
                # Both negative: the more-negative value is score_impact_high
                assert f.score_impact_high <= f.score_impact_low, (
                    f"{f.name}: for a hurting factor, score_impact_high ({f.score_impact_high}) "
                    f"should be <= score_impact_low ({f.score_impact_low}) "
                    f"(high = worst-case / most negative)"
                )

    def test_payment_history_factor_exists(self, factors: list[ScoreFactor]) -> None:
        categories = [f.category for f in factors]
        assert "payment_history" in categories

    def test_utilization_factor_exists(self, factors: list[ScoreFactor]) -> None:
        categories = [f.category for f in factors]
        assert "utilization" in categories

    def test_derogatory_factor_exists(self, factors: list[ScoreFactor]) -> None:
        categories = [f.category for f in factors]
        assert "derogatory" in categories

    def test_payment_history_is_critical_due_to_delinquency(
        self, factors: list[ScoreFactor]
    ) -> None:
        """OneMain has an active 120+ day delinquency — payment_history must be CRITICAL."""
        ph = next(f for f in factors if f.category == "payment_history")
        assert ph.severity == Severity.CRITICAL

    def test_utilization_is_critical_over_100_pct(self, factors: list[ScoreFactor]) -> None:
        """Overall utilization is 104% — must be CRITICAL."""
        util = next(f for f in factors if f.category == "utilization")
        assert util.severity == Severity.CRITICAL

    def test_credit_age_is_medium(self, factors: list[ScoreFactor]) -> None:
        age = next(f for f in factors if f.category == "credit_age")
        assert age.severity == Severity.MEDIUM

    def test_fixable_factors_include_payment_history(self, factors: list[ScoreFactor]) -> None:
        ph = next(f for f in factors if f.category == "payment_history")
        assert ph.is_fixable is True

    def test_credit_age_is_not_fixable(self, factors: list[ScoreFactor]) -> None:
        age = next(f for f in factors if f.category == "credit_age")
        assert age.is_fixable is False

    def test_hard_inquiries_count_in_current_value(self, factors: list[ScoreFactor]) -> None:
        inq = next(f for f in factors if f.category == "hard_inquiries")
        # Report has 6 hard inquiries
        assert "6" in inq.current_value

    def test_payment_history_details_include_late_accounts(
        self, factors: list[ScoreFactor]
    ) -> None:
        ph = next(f for f in factors if f.category == "payment_history")
        # At least OneMain and Upstart/Zolve should appear in late-payment details
        assert len(ph.details) > 0

    def test_derogatory_details_list_collections_and_chargeoffs(
        self, factors: list[ScoreFactor]
    ) -> None:
        derog = next(f for f in factors if f.category == "derogatory")
        combined = " ".join(derog.details).lower()
        assert "collection" in combined
        assert "charge" in combined


# ---------------------------------------------------------------------------
# TestParseUtilization (private helper — boundary cases)
# ---------------------------------------------------------------------------

class TestParseUtilization:
    def test_integer_percent(self) -> None:
        assert _parse_utilization("104%") == 104.0

    def test_decimal_percent(self) -> None:
        assert _parse_utilization("30.5%") == 30.5

    def test_zero_percent(self) -> None:
        assert _parse_utilization("0%") == 0.0

    def test_hundred_percent(self) -> None:
        assert _parse_utilization("100%") == 100.0


# ---------------------------------------------------------------------------
# TestCountDerogatory
# ---------------------------------------------------------------------------

class TestCountDerogatory:
    def test_real_report_counts(self, report: dict[str, Any]) -> None:
        counts = _count_derogatory(report)
        # 1 open collection (NCB), 2 charge-offs (Upstart + TXU)
        assert counts["collections"] == 1
        assert counts["charge_offs"] == 2

    def test_empty_report_returns_zeros(self) -> None:
        empty_report: dict[str, Any] = {
            "accounts": {
                "loans": {"open": [], "closed": []},
                "utilities": [],
                "collections": [],
            }
        }
        counts = _count_derogatory(empty_report)
        assert counts["collections"] == 0
        assert counts["charge_offs"] == 0

    def test_only_collections(self) -> None:
        report: dict[str, Any] = {
            "accounts": {
                "loans": {"open": [], "closed": []},
                "utilities": [],
                "collections": [{"balance": 500}, {"balance": 300}],
            }
        }
        counts = _count_derogatory(report)
        assert counts["collections"] == 2
        assert counts["charge_offs"] == 0

    def test_utility_chargeoff_counted(self) -> None:
        report: dict[str, Any] = {
            "accounts": {
                "loans": {"open": [], "closed": []},
                "utilities": [{"payment_status": "charge_off", "name": "TXU"}],
                "collections": [],
            }
        }
        counts = _count_derogatory(report)
        assert counts["charge_offs"] == 1

    def test_loan_chargeoff_counted(self) -> None:
        report: dict[str, Any] = {
            "accounts": {
                "loans": {
                    "open": [],
                    "closed": [
                        {"name": "Upstart", "payment_status": "charge_off"},
                    ],
                },
                "utilities": [],
                "collections": [],
            }
        }
        counts = _count_derogatory(report)
        assert counts["charge_offs"] == 1


# ---------------------------------------------------------------------------
# TestActiveDelinquencies
# ---------------------------------------------------------------------------

class TestActiveDelinquencies:
    def test_real_report_returns_onemain(self, report: dict[str, Any]) -> None:
        delinquent = _active_delinquencies(report)
        names = [acc["name"] for acc in delinquent]
        assert "OneMain Financial" in names

    def test_no_delinquencies_returns_empty_list(self) -> None:
        report: dict[str, Any] = {
            "accounts": {
                "loans": {
                    "open": [{"name": "Good Loan", "payment_status": "current"}],
                }
            }
        }
        assert _active_delinquencies(report) == []

    def test_90_day_late_detected(self) -> None:
        report: dict[str, Any] = {
            "accounts": {
                "loans": {
                    "open": [{"name": "Loan A", "payment_status": "90_days_late"}],
                }
            }
        }
        result = _active_delinquencies(report)
        assert len(result) == 1
        assert result[0]["name"] == "Loan A"

    def test_current_loans_excluded(self) -> None:
        report: dict[str, Any] = {
            "accounts": {
                "loans": {
                    "open": [
                        {"name": "Current Loan", "payment_status": "current"},
                        {"name": "Paid Loan", "payment_status": "paid"},
                    ],
                }
            }
        }
        assert _active_delinquencies(report) == []


# ---------------------------------------------------------------------------
# TestComputePayoffPlan
# ---------------------------------------------------------------------------

class TestComputePayoffPlan:
    def test_returns_payoff_plan_instance(self, payoff_plan: PayoffPlan) -> None:
        assert isinstance(payoff_plan, PayoffPlan)

    def test_has_six_steps(self, payoff_plan: PayoffPlan) -> None:
        assert len(payoff_plan.steps) == 6

    def test_first_priority_is_onemain(self, payoff_plan: PayoffPlan) -> None:
        assert payoff_plan.steps[0].priority == 1
        assert "OneMain" in payoff_plan.steps[0].account_name

    def test_steps_ordered_by_priority(self, payoff_plan: PayoffPlan) -> None:
        priorities = [s.priority for s in payoff_plan.steps]
        assert priorities == sorted(priorities)

    def test_total_one_time_cost_in_range(self, payoff_plan: PayoffPlan) -> None:
        # 1800 + 1151 + 2838 + 2000 + 1284 = 9073; report says 8773 (slight variant)
        assert 5_000 <= payoff_plan.total_one_time_cost_usd <= 15_000

    def test_current_avg_score_matches_report(
        self, report: dict[str, Any], payoff_plan: PayoffPlan
    ) -> None:
        expected = (
            report["scores"]["equifax"]["score"] + report["scores"]["transunion"]["score"]
        ) // 2
        # round() vs // can differ by 1
        assert abs(payoff_plan.current_avg_score - expected) <= 1

    def test_target_score_is_700(self, payoff_plan: PayoffPlan) -> None:
        assert payoff_plan.target_score == 700

    def test_score_gap_positive(self, payoff_plan: PayoffPlan) -> None:
        assert payoff_plan.score_gap > 0

    def test_monthly_obligations_total_nonzero(self, payoff_plan: PayoffPlan) -> None:
        assert payoff_plan.monthly_obligations.total_usd > 0

    def test_monthly_onemain_314(self, payoff_plan: PayoffPlan) -> None:
        assert payoff_plan.monthly_obligations.onemain_usd == 314

    def test_monthly_leap_finance_787(self, payoff_plan: PayoffPlan) -> None:
        assert payoff_plan.monthly_obligations.leap_finance_usd == 787

    def test_step_cumulative_scores_increasing(self, payoff_plan: PayoffPlan) -> None:
        """Each step must cumulatively project higher scores than the previous."""
        lows = [s.cumulative_score_low for s in payoff_plan.steps]
        highs = [s.cumulative_score_high for s in payoff_plan.steps]
        assert lows == sorted(lows), "Cumulative low scores must be non-decreasing"
        assert highs == sorted(highs), "Cumulative high scores must be non-decreasing"

    def test_negotiable_steps_are_4_and_5(self, payoff_plan: PayoffPlan) -> None:
        negotiable = {s.priority for s in payoff_plan.steps if s.is_negotiable}
        assert negotiable == {4, 5}

    def test_ncb_step_has_negotiation_note(self, payoff_plan: PayoffPlan) -> None:
        ncb = next(s for s in payoff_plan.steps if s.priority == 4)
        assert ncb.negotiation_note is not None
        assert "NCB" in ncb.negotiation_note or "215" in ncb.negotiation_note

    def test_txu_step_has_negotiation_note(self, payoff_plan: PayoffPlan) -> None:
        txu = next(s for s in payoff_plan.steps if s.priority == 5)
        assert txu.negotiation_note is not None

    def test_non_negotiable_steps_have_no_note(self, payoff_plan: PayoffPlan) -> None:
        for step in payoff_plan.steps:
            if not step.is_negotiable:
                assert step.negotiation_note is None

    def test_automatic_improvements_present(self, payoff_plan: PayoffPlan) -> None:
        assert len(payoff_plan.automatic_improvements) >= 1

    def test_automatic_improvement_mentions_inquiries(self, payoff_plan: PayoffPlan) -> None:
        events = [a.event.lower() for a in payoff_plan.automatic_improvements]
        assert any("inquir" in ev for ev in events)

    def test_expected_final_score_above_600(self, payoff_plan: PayoffPlan) -> None:
        """After all steps plus automatic improvements, the low-end projected score
        must exceed 600. (Low is computed from the TransUnion base of 489, so the
        cumulative floor lands around 620-630 after all 6 steps + inquiry falloff.
        The high-end comfortably clears 700.)</p>
        """
        assert payoff_plan.expected_final_score_low > 600
        assert payoff_plan.expected_final_score_high > 700

    def test_timeline_is_12_months(self, payoff_plan: PayoffPlan) -> None:
        assert payoff_plan.timeline_months == 12

    def test_step_score_impact_values_positive(self, payoff_plan: PayoffPlan) -> None:
        """Every step must contribute a positive score impact (all actions help)."""
        for step in payoff_plan.steps:
            assert step.score_impact_low >= 0, (
                f"Step {step.priority} ({step.account_name}) has negative impact_low"
            )
            assert step.score_impact_high >= 0


# ---------------------------------------------------------------------------
# TestCurrentAvgScore (helper)
# ---------------------------------------------------------------------------

class TestCurrentAvgScore:
    def test_real_report(self, report: dict[str, Any]) -> None:
        avg = _current_avg_score(report)
        # (522 + 489) / 2 rounded = 505 or 506
        assert 505 <= avg <= 506

    def test_single_bureau(self) -> None:
        r = {"scores": {"equifax": {"score": 600}}}
        assert _current_avg_score(r) == 600

    def test_symmetric_scores(self) -> None:
        r = {"scores": {"a": {"score": 500}, "b": {"score": 500}}}
        assert _current_avg_score(r) == 500


# ---------------------------------------------------------------------------
# TestProjectScores
# ---------------------------------------------------------------------------

class TestProjectScores:
    def test_returns_list(self, projections: list[MonthProjection]) -> None:
        assert isinstance(projections, list)

    def test_exactly_13_entries(self, projections: list[MonthProjection]) -> None:
        """Months 0–12 inclusive = 13 entries."""
        assert len(projections) == 13

    def test_months_zero_through_twelve(self, projections: list[MonthProjection]) -> None:
        months = [p.month for p in projections]
        assert months == list(range(13))

    def test_month_zero_score_low_is_489(self, projections: list[MonthProjection]) -> None:
        month0 = next(p for p in projections if p.month == 0)
        assert month0.score_low == 489

    def test_month_zero_score_high_is_522(self, projections: list[MonthProjection]) -> None:
        month0 = next(p for p in projections if p.month == 0)
        assert month0.score_high == 522

    def test_month_zero_score_in_current_range(self, projections: list[MonthProjection]) -> None:
        """Month 0 midpoint must match the report's starting scores (489-522)."""
        month0 = next(p for p in projections if p.month == 0)
        assert 489 <= month0.score_midpoint <= 522

    def test_month_12_score_above_650(self, projections: list[MonthProjection]) -> None:
        month12 = next(p for p in projections if p.month == 12)
        assert month12.score_low > 650

    def test_month_12_score_low_is_680(self, projections: list[MonthProjection]) -> None:
        month12 = next(p for p in projections if p.month == 12)
        assert month12.score_low == 680

    def test_month_12_score_high_is_710(self, projections: list[MonthProjection]) -> None:
        month12 = next(p for p in projections if p.month == 12)
        assert month12.score_high == 710

    def test_monotonically_increasing_score_low(self, projections: list[MonthProjection]) -> None:
        lows = [p.score_low for p in sorted(projections, key=lambda x: x.month)]
        assert lows == sorted(lows), "score_low must be non-decreasing month over month"

    def test_monotonically_increasing_score_high(self, projections: list[MonthProjection]) -> None:
        highs = [p.score_high for p in sorted(projections, key=lambda x: x.month)]
        assert highs == sorted(highs), "score_high must be non-decreasing month over month"

    def test_milestone_months_marked(self, projections: list[MonthProjection]) -> None:
        """Months 0, 1, 2, 3, 5, 6, 12 are defined milestones in the report."""
        milestone_months = {0, 1, 2, 3, 5, 6, 12}
        for p in projections:
            if p.month in milestone_months:
                assert p.milestone is True, f"Month {p.month} should be a milestone"

    def test_non_milestone_months_not_marked(self, projections: list[MonthProjection]) -> None:
        milestone_months = {0, 1, 2, 3, 5, 6, 12}
        for p in projections:
            if p.month not in milestone_months:
                assert p.milestone is False, f"Month {p.month} should NOT be a milestone"

    def test_score_midpoint_is_average_of_low_high(
        self, projections: list[MonthProjection]
    ) -> None:
        for p in projections:
            expected_mid = round((p.score_low + p.score_high) / 2)
            assert p.score_midpoint == expected_mid, (
                f"Month {p.month}: midpoint {p.score_midpoint} != expected {expected_mid}"
            )

    def test_cumulative_cost_non_decreasing(self, projections: list[MonthProjection]) -> None:
        costs = [p.cumulative_cost_usd for p in sorted(projections, key=lambda x: x.month)]
        assert costs == sorted(costs), "Cumulative cost must never decrease"

    def test_month_0_cost_is_zero(self, projections: list[MonthProjection]) -> None:
        month0 = next(p for p in projections if p.month == 0)
        assert month0.cumulative_cost_usd == 0

    def test_sorted_ascending_by_month(self, projections: list[MonthProjection]) -> None:
        months = [p.month for p in projections]
        assert months == sorted(months)


# ---------------------------------------------------------------------------
# TestInterpolateMonths
# ---------------------------------------------------------------------------

class TestInterpolateMonths:
    def _make_prev(self, month: int, low: int, high: int) -> MonthProjection:
        return MonthProjection(
            month=month,
            action="Start",
            score_low=low,
            score_high=high,
            score_midpoint=(low + high) // 2,
            delta_low=0,
            delta_high=0,
            milestone=True,
            cumulative_cost_usd=0,
        )

    def test_gap_of_one_returns_empty(self) -> None:
        prev = self._make_prev(month=1, low=500, high=530)
        result = _interpolate_months(prev, 2, 540, 570, "Next action", 1000)
        assert result == []

    def test_gap_of_two_returns_one_intermediate(self) -> None:
        prev = self._make_prev(month=0, low=500, high=520)
        result = _interpolate_months(prev, 2, 600, 620, "Next", 0)
        assert len(result) == 1
        assert result[0].month == 1

    def test_interpolated_values_between_bounds(self) -> None:
        prev = self._make_prev(month=0, low=400, high=450)
        result = _interpolate_months(prev, 4, 600, 650, "Next", 0)
        assert len(result) == 3  # months 1, 2, 3
        for p in result:
            assert 400 <= p.score_low <= 600
            assert 450 <= p.score_high <= 650

    def test_intermediate_months_not_milestones(self) -> None:
        prev = self._make_prev(month=0, low=490, high=522)
        result = _interpolate_months(prev, 3, 595, 610, "Next", 0)
        for p in result:
            assert p.milestone is False

    def test_intermediate_delta_is_zero(self) -> None:
        prev = self._make_prev(month=0, low=490, high=522)
        result = _interpolate_months(prev, 3, 595, 610, "Next", 0)
        for p in result:
            assert p.delta_low == 0
            assert p.delta_high == 0

    def test_action_label_is_building_payment_history(self) -> None:
        prev = self._make_prev(month=0, low=490, high=522)
        result = _interpolate_months(prev, 2, 550, 580, "Next", 0)
        assert result[0].action == "Building payment history"
