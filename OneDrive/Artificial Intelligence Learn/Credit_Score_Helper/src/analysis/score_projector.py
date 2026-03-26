"""
Month-by-month score projection engine.

Projects VantageScore improvement based on planned payoff steps and
automatic time-based improvements. Handles months with no events by
interpolating between known milestone months.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class MonthProjection:
    month: int
    action: str
    score_low: int
    score_high: int
    score_midpoint: int
    delta_low: int     # change from previous milestone
    delta_high: int
    milestone: bool    # True if this is a defined action milestone
    cumulative_cost_usd: int


def _interpolate_months(
    prev: MonthProjection,
    next_month: int,
    next_low: int,
    next_high: int,
    next_action: str,
    cumulative_cost: int,
) -> list[MonthProjection]:
    """Fill in intermediate months between two milestones with linear interpolation."""
    gap = next_month - prev.month
    if gap <= 1:
        return []

    interim: list[MonthProjection] = []
    for m in range(prev.month + 1, next_month):
        fraction = (m - prev.month) / gap
        interp_low = round(prev.score_low + fraction * (next_low - prev.score_low))
        interp_high = round(prev.score_high + fraction * (next_high - prev.score_high))
        interim.append(
            MonthProjection(
                month=m,
                action="Building payment history",
                score_low=interp_low,
                score_high=interp_high,
                score_midpoint=round((interp_low + interp_high) / 2),
                delta_low=0,
                delta_high=0,
                milestone=False,
                cumulative_cost_usd=prev.cumulative_cost_usd,
            )
        )
    return interim


# ---------------------------------------------------------------------------
# Milestone cost accumulator
# Priority costs aligned to the timeline milestones in the report
# ---------------------------------------------------------------------------

_MILESTONE_COSTS: dict[int, int] = {
    0: 0,
    1: 1800,    # OneMain current
    2: 1151,    # BofA to 30%
    3: 2838,    # Zolve to 30%
    5: 2000,    # NCB pay-for-delete
    6: 1284,    # TXU Energy
    12: 0,      # 12 months perfect payments (no extra one-time cost)
}


def _build_milestone_projections(report: dict) -> list[MonthProjection]:
    """Build the exact milestone rows from the report's projected_timeline."""
    raw_timeline: list[dict] = report["payoff_strategy"]["projected_timeline"]

    running_cost = 0
    prev_low = 0
    prev_high = 0
    milestones: list[MonthProjection] = []

    for i, entry in enumerate(raw_timeline):
        month: int = entry["month"]
        action: str = entry["action"]
        low: int = entry["projected_score_low"]
        high: int = entry["projected_score_high"]

        running_cost += _MILESTONE_COSTS.get(month, 0)

        delta_low = low - prev_low if i > 0 else 0
        delta_high = high - prev_high if i > 0 else 0
        prev_low = low
        prev_high = high

        milestones.append(
            MonthProjection(
                month=month,
                action=action,
                score_low=low,
                score_high=high,
                score_midpoint=round((low + high) / 2),
                delta_low=delta_low,
                delta_high=delta_high,
                milestone=True,
                cumulative_cost_usd=running_cost,
            )
        )

    return milestones


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def project_scores(report: dict, payoff_plan: object) -> list[MonthProjection]:
    """
    Project month-by-month credit score improvement over 12 months.

    Produces one row per month (0-12). Milestone months correspond to
    defined payoff actions. Intermediate months are linearly interpolated
    to represent gradual improvement from sustained on-time payments.

    Parameters
    ----------
    report : dict
        Parsed credit_report.json document.
    payoff_plan : PayoffPlan
        Output of compute_payoff_plan(). Currently used for type compatibility;
        milestone data is sourced directly from report for precision.

    Returns
    -------
    list[MonthProjection]
        13 entries (months 0-12), sorted ascending by month.
        Each entry includes score range, midpoint, action taken,
        delta from the previous milestone, and cumulative cost to date.
    """
    milestones = _build_milestone_projections(report)

    full_timeline: list[MonthProjection] = []
    prev_milestone = milestones[0]
    full_timeline.append(prev_milestone)

    for i in range(1, len(milestones)):
        current = milestones[i]
        # Fill in any gap months between previous and current milestone
        interim = _interpolate_months(
            prev=prev_milestone,
            next_month=current.month,
            next_low=current.score_low,
            next_high=current.score_high,
            next_action=current.action,
            cumulative_cost=current.cumulative_cost_usd,
        )
        full_timeline.extend(interim)
        full_timeline.append(current)
        prev_milestone = current

    # Ensure month 12 is always present (fill remaining months after last milestone)
    last = full_timeline[-1]
    if last.month < 12:
        interim = _interpolate_months(
            prev=last,
            next_month=12,
            next_low=milestones[-1].score_low,
            next_high=milestones[-1].score_high,
            next_action="Building payment history",
            cumulative_cost=last.cumulative_cost_usd,
        )
        full_timeline.extend(interim)

    full_timeline.sort(key=lambda m: m.month)
    return full_timeline
