from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import CurrentUser, get_db
from app.models import LoanData
from app.schemas import LoanDataRequest, LoanDataResponse

router = APIRouter(prefix="/api/loan-data", tags=["loans"])


@router.get("")
async def get_loan_data(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> LoanDataResponse | None:
    result = await db.execute(select(LoanData).where(LoanData.user_id == user.id))
    loan = result.scalar_one_or_none()
    if not loan:
        return Response(status_code=204)
    return LoanDataResponse.model_validate(loan)


@router.put("", response_model=LoanDataResponse)
async def upsert_loan_data(
    body: LoanDataRequest,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> LoanDataResponse:
    result = await db.execute(select(LoanData).where(LoanData.user_id == user.id))
    loan = result.scalar_one_or_none()

    if loan:
        loan.principal = body.principal
        loan.annual_rate = body.annual_rate
        loan.emi = body.emi
        loan.tenure_months = body.tenure_months
        loan.extra_monthly = body.extra_monthly
        loan.currency = body.currency
        loan.updated_at = datetime.now(timezone.utc)
    else:
        loan = LoanData(
            user_id=user.id,
            principal=body.principal,
            annual_rate=body.annual_rate,
            emi=body.emi,
            tenure_months=body.tenure_months,
            extra_monthly=body.extra_monthly,
            currency=body.currency,
        )
        db.add(loan)

    await db.commit()
    await db.refresh(loan)
    return LoanDataResponse.model_validate(loan)
