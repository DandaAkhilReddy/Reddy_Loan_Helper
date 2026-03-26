from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.api.data_loader import load_report
from src.api.schemas import (
    AutomaticImprovement,
    MonthlyObligations,
    PayoffItem,
    PayoffPlanResponse,
)

router = APIRouter()


@router.get("/payoff-plan", response_model=PayoffPlanResponse, summary="Prioritized payoff plan")
def get_payoff_plan() -> PayoffPlanResponse:
    """Return prioritized payoff plan with costs, timeline, and score impact estimates."""
    try:
        data = load_report()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="Credit report data unavailable") from exc

    strategy = data.get("payoff_strategy", {})

    priorities: list[PayoffItem] = [
        PayoffItem(
            priority=item["priority"],
            action=item["action"],
            timeline=item["timeline"],
            cost=float(item.get("cost", 0)),
            estimated_score_impact=item.get("estimated_score_impact", ""),
            reason=item.get("reason", ""),
            target_balance=float(item["target_balance"]) if item.get("target_balance") is not None else None,
            negotiation_range=item.get("negotiation_range"),
        )
        for item in strategy.get("priorities", [])
    ]

    auto_improvements: list[AutomaticImprovement] = [
        AutomaticImprovement(
            event=item["event"],
            when=item["when"],
            estimated_score_impact=item.get("estimated_score_impact", ""),
            notes=item.get("notes", ""),
        )
        for item in strategy.get("automatic_improvements", [])
    ]

    obligations_raw = strategy.get("monthly_fixed_obligations", {})
    monthly_obligations = MonthlyObligations(
        onemain=float(obligations_raw.get("onemain", 0)),
        leap_finance=float(obligations_raw.get("leap_finance", 0)),
        credit_one=float(obligations_raw.get("credit_one", 0)),
        total=float(obligations_raw.get("total", 0)),
    )

    return PayoffPlanResponse(
        goal=strategy.get("goal", ""),
        current_avg_score=strategy.get("current_avg_score", 0),
        target_score=strategy.get("target_score", 0),
        gap=strategy.get("gap", 0),
        total_one_time_cost=float(strategy.get("total_one_time_cost", 0)),
        monthly_obligations=monthly_obligations,
        priorities=priorities,
        automatic_improvements=auto_improvements,
    )
