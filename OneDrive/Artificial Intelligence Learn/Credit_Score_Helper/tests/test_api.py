"""Tests for the FastAPI endpoints via TestClient."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from src.api.main import app


# ---------------------------------------------------------------------------
# Shared client fixture
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


# ---------------------------------------------------------------------------
# TestHealthEndpoint
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    def test_returns_200(self, client: TestClient) -> None:
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_returns_ok_status(self, client: TestClient) -> None:
        body = client.get("/health").json()
        assert body["status"] == "ok"

    def test_response_is_json(self, client: TestClient) -> None:
        resp = client.get("/health")
        assert resp.headers["content-type"].startswith("application/json")


# ---------------------------------------------------------------------------
# TestReportEndpoint
# ---------------------------------------------------------------------------

class TestReportEndpoint:
    def test_returns_200(self, client: TestClient) -> None:
        assert client.get("/api/report").status_code == 200

    def test_response_contains_scores(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert "scores" in body

    def test_contains_equifax_score(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert "equifax" in body["scores"]
        assert isinstance(body["scores"]["equifax"]["score"], int)

    def test_contains_transunion_score(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert "transunion" in body["scores"]
        assert isinstance(body["scores"]["transunion"]["score"], int)

    def test_equifax_score_matches_report(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert body["scores"]["equifax"]["score"] == 522

    def test_transunion_score_matches_report(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert body["scores"]["transunion"]["score"] == 489

    def test_average_score_is_between_both_bureaus(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        avg = body["scores"]["average"]
        eq = body["scores"]["equifax"]["score"]
        tu = body["scores"]["transunion"]["score"]
        assert min(eq, tu) <= avg <= max(eq, tu)

    def test_contains_report_date(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert "report_date" in body
        assert body["report_date"] == "2026-02-28"

    def test_contains_name(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert "name" in body
        assert "Akhil" in body["name"]

    def test_account_counts_present(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        counts = body["account_counts"]
        assert "total" in counts
        assert "open" in counts
        assert "closed" in counts
        assert "delinquent" in counts
        assert "collections" in counts
        assert "charge_offs" in counts

    def test_has_at_least_one_delinquent_account(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert body["account_counts"]["delinquent"] >= 1

    def test_has_at_least_one_collection(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert body["account_counts"]["collections"] >= 1

    def test_has_charge_offs(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert body["account_counts"]["charge_offs"] >= 1

    def test_total_debt_is_positive(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert body["total_debt"] > 0

    def test_overall_health_is_poor(self, client: TestClient) -> None:
        """Average score of ~505 must produce 'poor' health rating."""
        body = client.get("/api/report").json()
        assert body["overall_health"] == "poor"

    def test_monthly_obligations_nonzero(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert body["monthly_obligations"] > 0

    def test_vantagescore_model_label(self, client: TestClient) -> None:
        body = client.get("/api/report").json()
        assert "VantageScore" in body["scores"]["equifax"]["model"]


# ---------------------------------------------------------------------------
# TestScoreFactorsEndpoint
# ---------------------------------------------------------------------------

class TestScoreFactorsEndpoint:
    def test_returns_200(self, client: TestClient) -> None:
        assert client.get("/api/score-factors").status_code == 200

    def test_returns_factors_list(self, client: TestClient) -> None:
        body = client.get("/api/score-factors").json()
        assert "factors" in body
        assert isinstance(body["factors"], list)

    def test_factors_list_non_empty(self, client: TestClient) -> None:
        body = client.get("/api/score-factors").json()
        assert len(body["factors"]) > 0

    def test_has_six_factors(self, client: TestClient) -> None:
        body = client.get("/api/score-factors").json()
        # 6 entries in credit_factors section of the report
        assert len(body["factors"]) == 6

    def test_each_factor_has_required_keys(self, client: TestClient) -> None:
        body = client.get("/api/score-factors").json()
        for factor in body["factors"]:
            assert "name" in factor
            assert "value" in factor
            assert "rating" in factor
            assert "impact" in factor
            assert "severity" in factor

    def test_critical_count_present_and_positive(self, client: TestClient) -> None:
        body = client.get("/api/score-factors").json()
        assert "critical_count" in body
        assert body["critical_count"] > 0

    def test_warning_count_present(self, client: TestClient) -> None:
        body = client.get("/api/score-factors").json()
        assert "warning_count" in body
        assert isinstance(body["warning_count"], int)

    def test_payment_history_factor_present(self, client: TestClient) -> None:
        body = client.get("/api/score-factors").json()
        names = [f["name"] for f in body["factors"]]
        assert "Payment History" in names

    def test_utilization_factor_present(self, client: TestClient) -> None:
        body = client.get("/api/score-factors").json()
        names = [f["name"] for f in body["factors"]]
        assert "Credit Card Utilization" in names

    def test_first_factor_has_highest_severity(self, client: TestClient) -> None:
        """Factors must be sorted: highest severity (3) first."""
        body = client.get("/api/score-factors").json()
        factors = body["factors"]
        severities = [f["severity"] for f in factors]
        assert severities[0] >= severities[-1]

    def test_severity_values_within_range(self, client: TestClient) -> None:
        body = client.get("/api/score-factors").json()
        for f in body["factors"]:
            assert 0 <= f["severity"] <= 3, f"Severity out of range: {f}"


# ---------------------------------------------------------------------------
# TestPayoffPlanEndpoint
# ---------------------------------------------------------------------------

class TestPayoffPlanEndpoint:
    def test_returns_200(self, client: TestClient) -> None:
        assert client.get("/api/payoff-plan").status_code == 200

    def test_returns_priorities_list(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        assert "priorities" in body
        assert isinstance(body["priorities"], list)

    def test_has_at_least_five_priorities(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        assert len(body["priorities"]) >= 5

    def test_has_six_priorities(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        assert len(body["priorities"]) == 6

    def test_first_priority_is_onemain(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        first = body["priorities"][0]
        assert first["priority"] == 1
        assert "OneMain" in first["action"]

    def test_each_priority_has_required_fields(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        for item in body["priorities"]:
            assert "priority" in item
            assert "action" in item
            assert "timeline" in item
            assert "cost" in item
            assert "estimated_score_impact" in item
            assert "reason" in item

    def test_goal_mentions_700_score(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        assert "700" in body["goal"]

    def test_target_score_is_700(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        assert body["target_score"] == 700

    def test_gap_is_positive(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        assert body["gap"] > 0

    def test_total_one_time_cost_in_range(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        cost = body["total_one_time_cost"]
        assert 5_000 <= cost <= 15_000

    def test_monthly_obligations_present(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        mo = body["monthly_obligations"]
        assert "onemain" in mo
        assert "leap_finance" in mo
        assert "credit_one" in mo
        assert "total" in mo

    def test_monthly_onemain_is_314(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        assert body["monthly_obligations"]["onemain"] == 314.0

    def test_monthly_total_is_1109(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        assert body["monthly_obligations"]["total"] == 1109.0

    def test_automatic_improvements_present(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        assert "automatic_improvements" in body
        assert len(body["automatic_improvements"]) >= 1

    def test_score_impact_strings_contain_plus(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        for item in body["priorities"]:
            assert "+" in item["estimated_score_impact"], (
                f"Missing '+' in score impact: {item['estimated_score_impact']}"
            )

    def test_priorities_ordered_by_priority_number(self, client: TestClient) -> None:
        body = client.get("/api/payoff-plan").json()
        nums = [item["priority"] for item in body["priorities"]]
        assert nums == sorted(nums)


# ---------------------------------------------------------------------------
# TestProjectionEndpoint
# ---------------------------------------------------------------------------

class TestProjectionEndpoint:
    def test_returns_200(self, client: TestClient) -> None:
        assert client.get("/api/projection").status_code == 200

    def test_returns_timeline(self, client: TestClient) -> None:
        body = client.get("/api/projection").json()
        assert "timeline" in body
        assert isinstance(body["timeline"], list)

    def test_timeline_non_empty(self, client: TestClient) -> None:
        body = client.get("/api/projection").json()
        assert len(body["timeline"]) > 0

    def test_timeline_has_seven_milestone_entries(self, client: TestClient) -> None:
        """The report defines 7 projected_timeline entries (months 0,1,2,3,5,6,12)."""
        body = client.get("/api/projection").json()
        assert len(body["timeline"]) == 7

    def test_current_score_is_midpoint_of_month0(self, client: TestClient) -> None:
        body = client.get("/api/projection").json()
        # Month 0: low=489, high=522 → mid = (489+522)//2 = 505
        assert body["current_score"] == 505

    def test_target_score_is_700(self, client: TestClient) -> None:
        body = client.get("/api/projection").json()
        assert body["target_score"] == 700

    def test_months_to_target_is_12(self, client: TestClient) -> None:
        body = client.get("/api/projection").json()
        assert body["months_to_target"] == 12

    def test_each_timeline_point_has_required_fields(self, client: TestClient) -> None:
        body = client.get("/api/projection").json()
        for point in body["timeline"]:
            assert "month" in point
            assert "action" in point
            assert "projected_score_low" in point
            assert "projected_score_high" in point
            assert "projected_score_mid" in point

    def test_first_timeline_point_is_month_zero(self, client: TestClient) -> None:
        body = client.get("/api/projection").json()
        assert body["timeline"][0]["month"] == 0

    def test_last_timeline_point_is_month_12(self, client: TestClient) -> None:
        body = client.get("/api/projection").json()
        assert body["timeline"][-1]["month"] == 12

    def test_month_12_score_low_above_650(self, client: TestClient) -> None:
        body = client.get("/api/projection").json()
        last = body["timeline"][-1]
        assert last["projected_score_low"] > 650

    def test_scores_monotonically_increasing(self, client: TestClient) -> None:
        body = client.get("/api/projection").json()
        timeline = sorted(body["timeline"], key=lambda x: x["month"])
        lows = [p["projected_score_low"] for p in timeline]
        highs = [p["projected_score_high"] for p in timeline]
        assert lows == sorted(lows), "projected_score_low must be non-decreasing"
        assert highs == sorted(highs), "projected_score_high must be non-decreasing"


# ---------------------------------------------------------------------------
# TestAccountsEndpoint
# ---------------------------------------------------------------------------

class TestAccountsEndpoint:
    def test_returns_200(self, client: TestClient) -> None:
        assert client.get("/api/accounts").status_code == 200

    def test_returns_accounts_list(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        assert "accounts" in body
        assert isinstance(body["accounts"], list)

    def test_accounts_list_has_more_than_five_entries(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        assert len(body["accounts"]) > 5

    def test_total_account_count(self, client: TestClient) -> None:
        """3 open cards + 1 closed card + 2 open loans + 2 closed loans + 1 utility + 1 collection = 10."""
        body = client.get("/api/accounts").json()
        assert len(body["accounts"]) == 10

    def test_each_account_has_required_fields(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        for acc in body["accounts"]:
            assert "name" in acc
            assert "account_type" in acc
            assert "balance" in acc
            assert "account_status" in acc
            assert "payment_status" in acc

    def test_account_types_are_valid(self, client: TestClient) -> None:
        valid_types = {"credit_card", "loan", "utility", "collection"}
        body = client.get("/api/accounts").json()
        for acc in body["accounts"]:
            assert acc["account_type"] in valid_types, (
                f"Unexpected account_type: {acc['account_type']}"
            )

    def test_onemain_account_present(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        names = [acc["name"] for acc in body["accounts"]]
        assert "OneMain Financial" in names

    def test_ncb_collection_present(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        names = [acc["name"] for acc in body["accounts"]]
        assert "NCB Management Services" in names

    def test_onemain_has_urgent_priority_action(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        onemain = next(
            acc for acc in body["accounts"] if acc["name"] == "OneMain Financial"
        )
        assert onemain["priority_action"] is not None
        assert "URGENT" in onemain["priority_action"].upper()

    def test_ncb_has_pay_for_delete_action(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        ncb = next(
            acc for acc in body["accounts"] if acc["name"] == "NCB Management Services"
        )
        assert ncb["priority_action"] is not None
        assert "pay-for-delete" in ncb["priority_action"].lower()

    def test_total_open_present_and_positive(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        assert "total_open" in body
        assert body["total_open"] > 0

    def test_total_closed_present_and_positive(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        assert "total_closed" in body
        assert body["total_closed"] > 0

    def test_total_balance_present_and_positive(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        assert "total_balance" in body
        assert body["total_balance"] > 0

    def test_total_open_plus_closed_equals_account_count(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        assert body["total_open"] + body["total_closed"] == len(body["accounts"])

    def test_credit_cards_have_utilization(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        cards = [acc for acc in body["accounts"] if acc["account_type"] == "credit_card"
                 and acc["account_status"] == "open"]
        for card in cards:
            assert card["utilization_pct"] is not None

    def test_bank_of_america_over_limit(self, client: TestClient) -> None:
        """BofA is at 145% utilization — over limit."""
        body = client.get("/api/accounts").json()
        bofа = next(
            acc for acc in body["accounts"] if acc["name"] == "Bank of America"
        )
        assert bofа["utilization_pct"] == 145

    def test_leap_finance_is_loan_type(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        leap = next(
            acc for acc in body["accounts"] if acc["name"] == "Leap Finance Inc"
        )
        assert leap["account_type"] == "loan"

    def test_txu_is_utility_type(self, client: TestClient) -> None:
        body = client.get("/api/accounts").json()
        txu = next(acc for acc in body["accounts"] if acc["name"] == "TXU Energy")
        assert txu["account_type"] == "utility"
