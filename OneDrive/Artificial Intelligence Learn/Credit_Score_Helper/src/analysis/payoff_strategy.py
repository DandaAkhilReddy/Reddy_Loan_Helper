"""
Score-optimized payoff strategy engine.

This is NOT standard avalanche (highest APR first) or snowball (smallest balance first).
The ordering maximizes VantageScore 3.0 point recovery per dollar spent:

  Priority 1 — Stop active delinquency bleeding (OneMain current)
  Priority 2 — Eliminate over-limit revolving damage (BofA to 30%)
  Priority 3 — Drop overall utilization below 30% (Zolve to 30%)
  Priority 4 — Remove active collection via pay-for-delete (NCB)
  Priority 5 — Resolve remaining charge-off (TXU Energy)
  Priority 6 — Build payment-history runway (12 months on-time)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


@dataclass
class PayoffStep:
    priority: int
    account_name: str
    action: str
    timeline: str
    cost_usd: int
    cost_note: str
    target_balance: int | None
    score_impact_low: int
    score_impact_high: int
    cumulative_score_low: int
    cumulative_score_high: int
    reason: str
    is_negotiable: bool
    negotiation_note: str | None = None


@dataclass
class MonthlyObligations:
    onemain_usd: int
    leap_finance_usd: int
    credit_one_usd: int
    total_usd: int


@dataclass
class AutomaticImprovement:
    event: str
    when: str
    score_impact_low: int
    score_impact_high: int
    notes: str


@dataclass
class PayoffPlan:
    goal: str
    current_avg_score: int
    target_score: int
    score_gap: int
    steps: list[PayoffStep]
    automatic_improvements: list[AutomaticImprovement]
    monthly_obligations: MonthlyObligations
    total_one_time_cost_usd: int
    expected_final_score_low: int
    expected_final_score_high: int
    timeline_months: int


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _current_avg_score(report: dict) -> int:
    scores = report["scores"]
    values = [v["score"] for v in scores.values()]
    return round(sum(values) / len(values))


def _build_steps(report: dict, base_low: int, base_high: int) -> list[PayoffStep]:
    strategy = report["payoff_strategy"]
    priorities_raw = strategy["priorities"]

    # Map priority → step using data from report, enriched with score-optimization logic
    cumulative_low = base_low
    cumulative_high = base_high

    steps: list[PayoffStep] = []

    for p in priorities_raw:
        pri = p["priority"]
        impact_str: str = p["estimated_score_impact"]  # e.g. "+15 to +25"
        parts = impact_str.replace("+", "").split(" to ")
        impact_low = int(parts[0])
        impact_high = int(parts[1])

        cumulative_low += impact_low
        cumulative_high += impact_high

        is_negotiable = pri in (4, 5)
        negotiation_note: str | None = None
        if pri == 4:
            negotiation_note = (
                "Contact NCB Management at (215) 244-4200. "
                "Request pay-for-delete in writing before sending any payment. "
                "Offer 40% (~$1,788). Max 50% (~$2,235). "
                "Do not acknowledge the debt verbally — send a written offer."
            )
        elif pri == 5:
            negotiation_note = (
                "Contact TXU Energy or its collection servicer. "
                "Request pay-for-delete at full balance ($1,284) or negotiate lower. "
                "Utility charge-offs are sometimes easier to delete."
            )

        steps.append(
            PayoffStep(
                priority=pri,
                account_name=_account_name_for_priority(pri),
                action=p["action"],
                timeline=p["timeline"],
                cost_usd=p["cost"],
                cost_note=_cost_note_for_priority(pri, p),
                target_balance=p.get("target_balance"),
                score_impact_low=impact_low,
                score_impact_high=impact_high,
                cumulative_score_low=cumulative_low,
                cumulative_score_high=cumulative_high,
                reason=p["reason"],
                is_negotiable=is_negotiable,
                negotiation_note=negotiation_note,
            )
        )

    return steps


def _account_name_for_priority(priority: int) -> str:
    mapping: dict[int, str] = {
        1: "OneMain Financial",
        2: "Bank of America",
        3: "Zolve/Continental Bank",
        4: "NCB Management Services",
        5: "TXU Energy",
        6: "All accounts",
    }
    return mapping.get(priority, "Unknown")


def _cost_note_for_priority(priority: int, raw: dict) -> str:
    notes: dict[int, str] = {
        1: "Approx. 5-6 missed payments × $314/mo to bring current",
        2: "Pay down from $1,451 to $300 target (30% of $1,000 limit)",
        3: "Pay down from $4,038 to $1,200 target (30% of $4,000 limit)",
        4: f"Negotiated settlement at ~45% of ${raw.get('cost', 2000)} face value",
        5: "Full payoff or negotiated pay-for-delete",
        6: "No one-time cost — ongoing monthly payment discipline",
    }
    return notes.get(priority, "")


def _build_automatic_improvements(report: dict) -> list[AutomaticImprovement]:
    raw_items = report["payoff_strategy"].get("automatic_improvements", [])
    result: list[AutomaticImprovement] = []
    for item in raw_items:
        parts = item["estimated_score_impact"].replace("+", "").split(" to ")
        result.append(
            AutomaticImprovement(
                event=item["event"],
                when=item["when"],
                score_impact_low=int(parts[0]),
                score_impact_high=int(parts[1]),
                notes=item["notes"],
            )
        )
    return result


def _build_monthly_obligations(report: dict) -> MonthlyObligations:
    mo = report["payoff_strategy"]["monthly_fixed_obligations"]
    return MonthlyObligations(
        onemain_usd=mo["onemain"],
        leap_finance_usd=mo["leap_finance"],
        credit_one_usd=mo["credit_one"],
        total_usd=mo["total"],
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_payoff_plan(report: dict) -> PayoffPlan:
    """
    Compute the score-optimized debt payoff plan from a credit report.

    Ordering logic (maximizes VantageScore recovery per dollar):
      1. Stop active delinquency — prevents ongoing compounding damage.
      2. Fix over-limit revolving utilization — largest single-factor lever.
      3. Reduce overall utilization below 30% — utilization is 20% of VantageScore.
      4. Remove collection via pay-for-delete — derogatory removal has outsized impact.
      5. Resolve charge-off — smaller but meaningful improvement.
      6. Sustain perfect payments — time-based recovery builds toward 700+.

    Parameters
    ----------
    report : dict
        Parsed credit_report.json document.

    Returns
    -------
    PayoffPlan
        Full structured plan with per-step costs, score impact estimates,
        cumulative projected scores, negotiation notes, and monthly obligations.
    """
    avg_score = _current_avg_score(report)
    strategy = report["payoff_strategy"]
    base_low = report["scores"]["transunion"]["score"]
    base_high = report["scores"]["equifax"]["score"]

    steps = _build_steps(report, base_low, base_high)
    auto_improvements = _build_automatic_improvements(report)
    monthly_obligations = _build_monthly_obligations(report)

    # Final cumulative score is after all steps
    final_step = steps[-1] if steps else None
    expected_final_low = final_step.cumulative_score_low if final_step else avg_score
    expected_final_high = final_step.cumulative_score_high if final_step else avg_score

    # Add automatic improvement gains on top
    for improvement in auto_improvements:
        expected_final_low += improvement.score_impact_low
        expected_final_high += improvement.score_impact_high

    return PayoffPlan(
        goal=strategy["goal"],
        current_avg_score=avg_score,
        target_score=strategy["target_score"],
        score_gap=strategy["gap"],
        steps=steps,
        automatic_improvements=auto_improvements,
        monthly_obligations=monthly_obligations,
        total_one_time_cost_usd=strategy["total_one_time_cost"],
        expected_final_score_low=expected_final_low,
        expected_final_score_high=expected_final_high,
        timeline_months=12,
    )
