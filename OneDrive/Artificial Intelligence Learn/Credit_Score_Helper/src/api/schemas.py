from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


# ─── Score models ────────────────────────────────────────────────────────────

class BureauScore(BaseModel):
    score: int
    model: str
    as_of: str


class ScoresSummary(BaseModel):
    equifax: BureauScore
    transunion: BureauScore
    average: int


# ─── Credit factor models ─────────────────────────────────────────────────────

class CreditFactor(BaseModel):
    name: str
    value: str
    rating: str
    impact: str
    severity: int  # 1=low … 3=high, derived from rating


class ScoreFactorsResponse(BaseModel):
    factors: list[CreditFactor]
    critical_count: int
    warning_count: int


# ─── Report summary ───────────────────────────────────────────────────────────

class AccountCounts(BaseModel):
    total: int
    open: int
    closed: int
    delinquent: int
    collections: int
    charge_offs: int


class ReportResponse(BaseModel):
    report_date: str
    name: str
    scores: ScoresSummary
    account_counts: AccountCounts
    total_debt: float
    monthly_obligations: float
    overall_health: str  # "poor" | "fair" | "good"


# ─── Payoff plan models ───────────────────────────────────────────────────────

class PayoffItem(BaseModel):
    priority: int
    action: str
    timeline: str
    cost: float
    estimated_score_impact: str
    reason: str
    target_balance: Optional[float] = None
    negotiation_range: Optional[str] = None


class AutomaticImprovement(BaseModel):
    event: str
    when: str
    estimated_score_impact: str
    notes: str


class MonthlyObligations(BaseModel):
    onemain: float
    leap_finance: float
    credit_one: float
    total: float


class PayoffPlanResponse(BaseModel):
    goal: str
    current_avg_score: int
    target_score: int
    gap: int
    total_one_time_cost: float
    monthly_obligations: MonthlyObligations
    priorities: list[PayoffItem]
    automatic_improvements: list[AutomaticImprovement]


# ─── Projection models ────────────────────────────────────────────────────────

class ProjectionPoint(BaseModel):
    month: int
    action: str
    projected_score_low: int
    projected_score_high: int
    projected_score_mid: int


class ProjectionResponse(BaseModel):
    current_score: int
    target_score: int
    months_to_target: int
    timeline: list[ProjectionPoint]


# ─── Account models ───────────────────────────────────────────────────────────

class AccountDetail(BaseModel):
    name: str
    account_type: str  # "credit_card" | "loan" | "utility" | "collection"
    balance: float
    account_status: str
    payment_status: str
    on_time_pct: Optional[float] = None
    utilization_pct: Optional[float] = None
    credit_limit: Optional[float] = None
    monthly_payment: Optional[float] = None
    opened: Optional[str] = None
    times_late_30_60_90: Optional[list[int]] = None
    notes: Optional[str] = None
    priority_action: Optional[str] = None


class AccountsResponse(BaseModel):
    accounts: list[AccountDetail]
    total_open: int
    total_closed: int
    total_balance: float
