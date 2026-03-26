from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.api.data_loader import load_report
from src.api.schemas import (
    AccountCounts,
    BureauScore,
    ReportResponse,
    ScoresSummary,
)

router = APIRouter()


@router.get("/report", response_model=ReportResponse, summary="Full credit report summary")
def get_report() -> ReportResponse:
    """Return high-level credit report: scores, account counts, total debt."""
    try:
        data = load_report()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="Credit report data unavailable") from exc

    scores_raw = data["scores"]
    eq_score = scores_raw["equifax"]["score"]
    tu_score = scores_raw["transunion"]["score"]

    scores = ScoresSummary(
        equifax=BureauScore(**scores_raw["equifax"]),
        transunion=BureauScore(**scores_raw["transunion"]),
        average=(eq_score + tu_score) // 2,
    )

    accounts = data["accounts"]
    cc_open = accounts["credit_cards"]["open"]
    cc_closed = accounts["credit_cards"]["closed"]
    loans_open = accounts["loans"]["open"]
    loans_closed = accounts["loans"]["closed"]
    utilities = accounts.get("utilities", [])
    collections = accounts.get("collections", [])

    all_open = cc_open + loans_open
    all_closed = cc_closed + loans_closed + utilities + collections

    delinquent_statuses = {"120_plus_days_late", "90_days_late", "60_days_late", "30_days_late"}
    delinquent = sum(
        1 for acc in all_open
        if acc.get("payment_status") in delinquent_statuses
    )
    charge_offs = sum(
        1 for acc in all_closed + utilities
        if acc.get("payment_status") == "charge_off"
    )
    active_collections = sum(
        1 for acc in collections
        if acc.get("account_status") == "open"
    )

    total_open = len(all_open)
    total_closed = len(all_closed)

    def _balance(acc: dict) -> float:
        return float(acc.get("balance") or 0)

    total_debt = sum(_balance(a) for a in all_open + collections)

    avg = scores.average
    if avg < 580:
        health = "poor"
    elif avg < 670:
        health = "fair"
    else:
        health = "good"

    return ReportResponse(
        report_date=data["report_date"],
        name=data["personal_info"]["name"],
        scores=scores,
        account_counts=AccountCounts(
            total=total_open + total_closed,
            open=total_open,
            closed=total_closed,
            delinquent=delinquent,
            collections=active_collections,
            charge_offs=charge_offs,
        ),
        total_debt=total_debt,
        monthly_obligations=float(
            data.get("payoff_strategy", {})
            .get("monthly_fixed_obligations", {})
            .get("total", 0)
        ),
        overall_health=health,
    )
