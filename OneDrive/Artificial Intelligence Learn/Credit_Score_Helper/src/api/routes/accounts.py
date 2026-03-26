from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.api.data_loader import load_report
from src.api.schemas import AccountDetail, AccountsResponse

router = APIRouter()

_PRIORITY_ACTIONS: dict[str, str] = {
    "120_plus_days_late": "URGENT: Bring account current immediately",
    "charge_off": "Negotiate pay-for-delete or settle",
    "90_days_late": "URGENT: Bring account current",
    "60_days_late": "Bring account current ASAP",
    "30_days_late": "Make payment to prevent further damage",
}


def _credit_card_to_detail(acc: dict, status: str) -> AccountDetail:
    return AccountDetail(
        name=acc["name"],
        account_type="credit_card",
        balance=float(acc.get("balance") or 0),
        account_status=acc.get("account_status", status),
        payment_status=acc.get("payment_status", "unknown"),
        on_time_pct=acc.get("on_time_pct"),
        utilization_pct=acc.get("utilization_pct"),
        credit_limit=float(acc["credit_limit"]) if acc.get("credit_limit") is not None else None,
        monthly_payment=float(acc["monthly_payment"]) if acc.get("monthly_payment") is not None else None,
        opened=acc.get("opened"),
        times_late_30_60_90=acc.get("times_late_30_60_90"),
        notes=acc.get("notes"),
        priority_action=_PRIORITY_ACTIONS.get(acc.get("payment_status", "")),
    )


def _loan_to_detail(acc: dict, status: str) -> AccountDetail:
    return AccountDetail(
        name=acc["name"],
        account_type="loan",
        balance=float(acc.get("balance") or 0),
        account_status=acc.get("account_status", status),
        payment_status=acc.get("payment_status", "unknown"),
        on_time_pct=acc.get("on_time_pct"),
        monthly_payment=float(acc["monthly_payment"]) if acc.get("monthly_payment") is not None else None,
        opened=acc.get("opened"),
        times_late_30_60_90=acc.get("times_late_30_60_90"),
        notes=acc.get("notes"),
        priority_action=_PRIORITY_ACTIONS.get(acc.get("payment_status", "")),
    )


def _utility_to_detail(acc: dict) -> AccountDetail:
    return AccountDetail(
        name=acc["name"],
        account_type="utility",
        balance=float(acc.get("balance") or 0),
        account_status=acc.get("account_status", "closed"),
        payment_status=acc.get("payment_status", "unknown"),
        opened=acc.get("opened"),
        times_late_30_60_90=acc.get("times_late_30_60_90"),
        notes=acc.get("notes"),
        priority_action=_PRIORITY_ACTIONS.get(acc.get("payment_status", "")),
    )


def _collection_to_detail(acc: dict) -> AccountDetail:
    return AccountDetail(
        name=acc["name"],
        account_type="collection",
        balance=float(acc.get("balance") or 0),
        account_status=acc.get("account_status", "open"),
        payment_status="collection",
        notes=acc.get("notes"),
        priority_action="Negotiate pay-for-delete at 40-50%. Get agreement in writing before paying.",
    )


@router.get("/accounts", response_model=AccountsResponse, summary="All accounts with status and details")
def get_accounts() -> AccountsResponse:
    """Return all accounts (credit cards, loans, utilities, collections) with status and action hints."""
    try:
        data = load_report()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="Credit report data unavailable") from exc

    raw = data["accounts"]
    all_accounts: list[AccountDetail] = []

    for acc in raw["credit_cards"]["open"]:
        all_accounts.append(_credit_card_to_detail(acc, "open"))
    for acc in raw["credit_cards"]["closed"]:
        all_accounts.append(_credit_card_to_detail(acc, "closed"))

    for acc in raw["loans"]["open"]:
        all_accounts.append(_loan_to_detail(acc, "open"))
    for acc in raw["loans"]["closed"]:
        all_accounts.append(_loan_to_detail(acc, "closed"))

    for acc in raw.get("utilities", []):
        all_accounts.append(_utility_to_detail(acc))

    for acc in raw.get("collections", []):
        all_accounts.append(_collection_to_detail(acc))

    open_accounts = [a for a in all_accounts if a.account_status in ("open",)]
    closed_accounts = [a for a in all_accounts if a.account_status not in ("open",)]
    total_balance = sum(a.balance for a in all_accounts)

    return AccountsResponse(
        accounts=all_accounts,
        total_open=len(open_accounts),
        total_closed=len(closed_accounts),
        total_balance=total_balance,
    )
