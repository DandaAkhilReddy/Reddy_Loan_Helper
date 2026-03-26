from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.api.data_loader import load_report
from src.api.schemas import CreditFactor, ScoreFactorsResponse

router = APIRouter()

_RATING_SEVERITY: dict[str, int] = {
    "exceptional": 0,
    "very_good": 0,
    "good": 1,
    "fair": 2,
    "needs_work": 3,
    "poor": 3,
}

_FACTOR_LABELS: dict[str, str] = {
    "payment_history": "Payment History",
    "credit_card_use": "Credit Card Utilization",
    "derogatory_marks": "Derogatory Marks",
    "credit_age": "Credit Age",
    "total_accounts": "Total Accounts",
    "hard_inquiries": "Hard Inquiries",
}


@router.get("/score-factors", response_model=ScoreFactorsResponse, summary="Score factors with severity")
def get_score_factors() -> ScoreFactorsResponse:
    """Return all credit score factors with derived severity ratings."""
    try:
        data = load_report()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="Credit report data unavailable") from exc

    raw_factors = data["credit_factors"]
    factors: list[CreditFactor] = []

    for key, factor_data in raw_factors.items():
        rating = factor_data.get("rating", "fair")
        severity = _RATING_SEVERITY.get(rating, 2)
        factors.append(
            CreditFactor(
                name=_FACTOR_LABELS.get(key, key.replace("_", " ").title()),
                value=str(factor_data.get("value", "")),
                rating=rating,
                impact=factor_data.get("impact", "medium"),
                severity=severity,
            )
        )

    # Sort: highest severity first, then by impact weight
    _impact_order = {"high": 3, "medium": 2, "low": 1}
    factors.sort(key=lambda f: (_impact_order.get(f.impact, 2), f.severity), reverse=True)

    critical_count = sum(1 for f in factors if f.severity == 3)
    warning_count = sum(1 for f in factors if f.severity == 2)

    return ScoreFactorsResponse(
        factors=factors,
        critical_count=critical_count,
        warning_count=warning_count,
    )
