from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.api.data_loader import load_report
from src.api.schemas import ProjectionPoint, ProjectionResponse

router = APIRouter()


@router.get("/projection", response_model=ProjectionResponse, summary="Month-by-month score projection")
def get_projection() -> ProjectionResponse:
    """Return month-by-month score projection array from the payoff strategy timeline."""
    try:
        data = load_report()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="Credit report data unavailable") from exc

    strategy = data.get("payoff_strategy", {})
    raw_timeline = strategy.get("projected_timeline", [])

    timeline: list[ProjectionPoint] = [
        ProjectionPoint(
            month=point["month"],
            action=point["action"],
            projected_score_low=point["projected_score_low"],
            projected_score_high=point["projected_score_high"],
            projected_score_mid=(point["projected_score_low"] + point["projected_score_high"]) // 2,
        )
        for point in raw_timeline
    ]

    current = timeline[0] if timeline else None
    last = timeline[-1] if timeline else None

    return ProjectionResponse(
        current_score=current.projected_score_mid if current else 0,
        target_score=strategy.get("target_score", 700),
        months_to_target=last.month if last else 0,
        timeline=timeline,
    )
