"""
Analyze credit score factors using VantageScore 3.0 weightings.

VantageScore 3.0 factor weights:
  Payment history      : 40%
  Credit utilization   : 20%
  Credit age           : 21%
  Account mix          : 11%
  Hard inquiries       : 5%
  Derogatory marks     : high cross-cutting impact
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Literal


class Severity(str, Enum):
    CRITICAL = "critical"   # >30 point drag
    HIGH = "high"           # 15-30 point drag
    MEDIUM = "medium"       # 5-15 point drag
    LOW = "low"             # <5 point drag
    POSITIVE = "positive"   # helping the score


@dataclass
class ScoreFactor:
    name: str
    category: str
    severity: Severity
    current_value: str
    ideal_value: str
    score_impact_low: int          # negative = hurting, positive = helping
    score_impact_high: int
    vantagescore_weight_pct: float
    description: str
    action: str
    is_fixable: bool
    details: list[str] = field(default_factory=list)


def _parse_utilization(value: str) -> float:
    """Parse '104%' → 104.0"""
    return float(value.rstrip("%"))


def _count_derogatory(report: dict) -> dict[str, int]:
    collections = len(report.get("accounts", {}).get("collections", []))
    charge_offs = 0
    for loan in report["accounts"]["loans"].get("closed", []):
        if loan.get("payment_status") == "charge_off":
            charge_offs += 1
    for util in report["accounts"].get("utilities", []):
        if util.get("payment_status") == "charge_off":
            charge_offs += 1
    return {"collections": collections, "charge_offs": charge_offs}


def _active_delinquencies(report: dict) -> list[dict]:
    result: list[dict] = []
    for loan in report["accounts"]["loans"].get("open", []):
        status = loan.get("payment_status", "")
        if "late" in status or "past_due" in status or "delinquent" in status:
            result.append(loan)
    return result


def _compute_utilization_factor(report: dict) -> ScoreFactor:
    raw = report["credit_factors"]["credit_card_use"]["value"]
    overall_util = _parse_utilization(raw)

    card_details: list[str] = []
    for card in report["accounts"]["credit_cards"].get("open", []):
        card_details.append(
            f"{card['name']}: {card['utilization_pct']}% "
            f"(${card['balance']} / ${card['credit_limit']})"
        )

    if overall_util > 100:
        severity = Severity.CRITICAL
        impact_low, impact_high = -40, -55
    elif overall_util > 50:
        severity = Severity.HIGH
        impact_low, impact_high = -20, -35
    elif overall_util > 30:
        severity = Severity.MEDIUM
        impact_low, impact_high = -10, -20
    else:
        severity = Severity.POSITIVE
        impact_low, impact_high = 5, 15

    return ScoreFactor(
        name="Credit Card Utilization",
        category="utilization",
        severity=severity,
        current_value=raw,
        ideal_value="<30% (target: <10% for max impact)",
        score_impact_low=impact_low,
        score_impact_high=impact_high,
        vantagescore_weight_pct=20.0,
        description=(
            f"Overall credit utilization is {raw}, far above the 30% threshold. "
            "Bank of America is at 145% (over limit) and Zolve is at 101%. "
            "Over-limit balances are penalized more severely than high utilization."
        ),
        action=(
            "Pay BofA from $1,451 to $300 (30% of $1,000 limit) — costs $1,151. "
            "Pay Zolve from $4,038 to $1,200 (30% of $4,000 limit) — costs $2,838."
        ),
        is_fixable=True,
        details=card_details,
    )


def _compute_payment_history_factor(report: dict) -> ScoreFactor:
    raw = report["credit_factors"]["payment_history"]["value"]
    on_time_pct = float(raw.rstrip("%"))
    delinquent = _active_delinquencies(report)

    if delinquent:
        severity = Severity.CRITICAL
        impact_low, impact_high = -50, -70
        description = (
            f"Payment history is {raw} overall, but OneMain Financial has an ACTIVE "
            "120+ day delinquency (150 days past due as of Jan 2026). An open "
            "delinquency is reported every month and compounds damage continuously."
        )
        action = (
            "Bring OneMain Financial current immediately. Back-pay ~$1,800 covering "
            "missed months at $314/month. This stops the active monthly damage."
        )
    elif on_time_pct >= 95:
        severity = Severity.POSITIVE
        impact_low, impact_high = 10, 20
        description = f"Strong payment history at {raw}."
        action = "Maintain perfect payments going forward."
    else:
        severity = Severity.HIGH
        impact_low, impact_high = -20, -35
        description = f"Payment history at {raw} is below ideal (99%+)."
        action = "Maintain on-time payments for 12+ consecutive months."

    details: list[str] = []
    for loan in report["accounts"]["loans"].get("open", []) + report["accounts"]["loans"].get("closed", []):
        late = loan.get("times_late_30_60_90", [0, 0, 0])
        if any(v > 0 for v in late):
            details.append(
                f"{loan['name']}: {late[0]}×30d, {late[1]}×60d, {late[2]}×90d late"
            )

    return ScoreFactor(
        name="Payment History",
        category="payment_history",
        severity=severity,
        current_value=raw,
        ideal_value="100% with zero active delinquencies",
        score_impact_low=impact_low,
        score_impact_high=impact_high,
        vantagescore_weight_pct=40.0,
        description=description,
        action=action,
        is_fixable=True,
        details=details,
    )


def _compute_derogatory_factor(report: dict) -> ScoreFactor:
    counts = _count_derogatory(report)
    total = counts["collections"] + counts["charge_offs"]

    if total >= 3:
        severity = Severity.CRITICAL
        impact_low, impact_high = -60, -80
    elif total == 2:
        severity = Severity.HIGH
        impact_low, impact_high = -35, -55
    elif total == 1:
        severity = Severity.HIGH
        impact_low, impact_high = -20, -35
    else:
        severity = Severity.POSITIVE
        impact_low, impact_high = 5, 10

    details = [
        f"Collections: {counts['collections']} open (NCB Management, $4,470)",
        f"Charge-offs: {counts['charge_offs']} "
        f"(Upstart Loan ~2030, TXU Energy $1,284)",
    ]

    return ScoreFactor(
        name="Derogatory Marks",
        category="derogatory",
        severity=severity,
        current_value=f"{total} marks ({counts['collections']} collection, {counts['charge_offs']} charge-offs)",
        ideal_value="0 derogatory marks",
        score_impact_low=impact_low,
        score_impact_high=impact_high,
        vantagescore_weight_pct=0.0,  # cross-cutting, not a standalone weight
        description=(
            f"{total} derogatory marks: 1 active collection (NCB, $4,470) and "
            "2 charge-offs (Upstart Loan transferred ~2030, TXU Energy $1,284). "
            "The Upstart charge-off cannot be removed — it ages off around 2030."
        ),
        action=(
            "Negotiate NCB pay-for-delete at 40-50% (~$1,800-$2,200). "
            "Attempt pay-for-delete on TXU Energy ($1,284). "
            "Upstart: no action — it will age off naturally."
        ),
        is_fixable=True,
        details=details,
    )


def _compute_credit_age_factor(report: dict) -> ScoreFactor:
    raw = report["credit_factors"]["credit_age"]["value"]

    return ScoreFactor(
        name="Credit Age",
        category="credit_age",
        severity=Severity.MEDIUM,
        current_value=raw,
        ideal_value="7+ years average age",
        score_impact_low=-15,
        score_impact_high=-25,
        vantagescore_weight_pct=21.0,
        description=(
            f"Average credit age is {raw}. Shortest account is Zolve (2.5 yrs). "
            "Oldest is Bank of America at 6 years. Short average age limits maximum "
            "achievable score; this improves passively over time."
        ),
        action=(
            "Do not close any existing accounts. "
            "Do not open new accounts unless necessary (each new account lowers average age). "
            "Bank of America at 6 years is a valuable aged anchor — keep it open."
        ),
        is_fixable=False,
        details=[
            "Bank of America: 6 years (oldest — anchor account)",
            "Credit One Bank: 3 years 8 months",
            "Leap Finance: ~3 years",
            "Zolve/Continental: 2 years 6 months (newest open)",
        ],
    )


def _compute_hard_inquiries_factor(report: dict) -> ScoreFactor:
    inquiries = report.get("hard_inquiries", [])
    count = len(inquiries)
    names = [inq["name"] for inq in inquiries]

    if count >= 5:
        severity = Severity.MEDIUM
        impact_low, impact_high = -8, -15
    elif count >= 3:
        severity = Severity.LOW
        impact_low, impact_high = -5, -10
    else:
        severity = Severity.LOW
        impact_low, impact_high = -2, -5

    return ScoreFactor(
        name="Hard Inquiries",
        category="hard_inquiries",
        severity=severity,
        current_value=f"{count} inquiries",
        ideal_value="0-2 inquiries",
        score_impact_low=impact_low,
        score_impact_high=impact_high,
        vantagescore_weight_pct=5.0,
        description=(
            f"{count} hard inquiries, all from auto-financing applications in "
            "April-May 2024. VantageScore 3.0 treats same-type inquiries within "
            "14 days as one inquiry for rate-shopping. These fall off May 2026 "
            "(~1 month away from report date)."
        ),
        action=(
            "No action needed. All 6 inquiries age off May 2026. "
            "Do not apply for new credit until after May 2026."
        ),
        is_fixable=False,
        details=names,
    )


def _compute_account_mix_factor(report: dict) -> ScoreFactor:
    total = report["credit_factors"]["total_accounts"]["value"]

    return ScoreFactor(
        name="Account Mix",
        category="account_mix",
        severity=Severity.LOW,
        current_value=f"{total} accounts",
        ideal_value="Mix of revolving + installment + mortgage",
        score_impact_low=-5,
        score_impact_high=-10,
        vantagescore_weight_pct=11.0,
        description=(
            f"{total} total accounts: 3 open credit cards, 2 open loans, "
            "1 collection, plus closed accounts. Mix is acceptable (revolving + "
            "installment present). No mortgage is the main gap, but that is expected "
            "at this credit age."
        ),
        action=(
            "No immediate action needed. "
            "A secured credit card or credit-builder loan could improve mix "
            "once derogatory items are resolved."
        ),
        is_fixable=False,
        details=[
            "Revolving: Credit One Bank, Bank of America, Zolve (3 open)",
            "Installment: OneMain Financial, Leap Finance (2 open)",
            "Collection: NCB Management Services (1 open)",
            "Mortgage: none",
        ],
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_SEVERITY_ORDER: dict[Severity, int] = {
    Severity.CRITICAL: 0,
    Severity.HIGH: 1,
    Severity.MEDIUM: 2,
    Severity.LOW: 3,
    Severity.POSITIVE: 4,
}


def analyze_score_factors(report: dict) -> list[ScoreFactor]:
    """
    Analyze all credit score factors from a credit report.

    Parameters
    ----------
    report : dict
        Parsed credit_report.json document.

    Returns
    -------
    list[ScoreFactor]
        Factors sorted by severity (CRITICAL first, POSITIVE last).
        Each factor includes current value, ideal target, estimated score
        impact range, and a recommended action.
    """
    factors: list[ScoreFactor] = [
        _compute_payment_history_factor(report),
        _compute_derogatory_factor(report),
        _compute_utilization_factor(report),
        _compute_credit_age_factor(report),
        _compute_hard_inquiries_factor(report),
        _compute_account_mix_factor(report),
    ]

    factors.sort(key=lambda f: (_SEVERITY_ORDER[f.severity], -f.vantagescore_weight_pct))
    return factors
