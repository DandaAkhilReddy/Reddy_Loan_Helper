"""
Credit score analysis engine.

Public API:
  analyze_score_factors(report)  → list[ScoreFactor]
  compute_payoff_plan(report)    → PayoffPlan
  project_scores(report, plan)   → list[MonthProjection]
"""
from .score_factors import ScoreFactor, Severity, analyze_score_factors
from .payoff_strategy import (
    AutomaticImprovement,
    MonthlyObligations,
    PayoffPlan,
    PayoffStep,
    compute_payoff_plan,
)
from .score_projector import MonthProjection, project_scores

__all__ = [
    # score_factors
    "ScoreFactor",
    "Severity",
    "analyze_score_factors",
    # payoff_strategy
    "AutomaticImprovement",
    "MonthlyObligations",
    "PayoffPlan",
    "PayoffStep",
    "compute_payoff_plan",
    # score_projector
    "MonthProjection",
    "project_scores",
]
