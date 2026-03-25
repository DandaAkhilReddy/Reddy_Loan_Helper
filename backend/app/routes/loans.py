from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db import get_db
from app.models import LoanCalculation, User
from app.schemas import (
    LoanCalculationCreate,
    LoanCalculationResponse,
    LoanCalculationUpdate,
)

router = APIRouter(prefix="/api/loans", tags=["loans"])


@router.get("/", response_model=list[LoanCalculationResponse])
async def list_loans(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[LoanCalculationResponse]:
    """List all active loan calculations for the current user."""
    result = await db.execute(
        select(LoanCalculation)
        .where(LoanCalculation.user_id == user.id, LoanCalculation.is_active.is_(True))
        .order_by(LoanCalculation.updated_at.desc())
    )
    loans = result.scalars().all()
    return [LoanCalculationResponse.model_validate(loan) for loan in loans]


@router.post("/", response_model=LoanCalculationResponse, status_code=status.HTTP_201_CREATED)
async def create_loan(
    body: LoanCalculationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LoanCalculationResponse:
    """Create a new loan calculation."""
    loan = LoanCalculation(user_id=user.id, **body.model_dump())
    db.add(loan)
    await db.flush()
    await db.refresh(loan)
    return LoanCalculationResponse.model_validate(loan)


@router.put("/{loan_id}", response_model=LoanCalculationResponse)
async def update_loan(
    loan_id: uuid.UUID,
    body: LoanCalculationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LoanCalculationResponse:
    """Update a loan calculation owned by the current user."""
    result = await db.execute(
        select(LoanCalculation).where(
            LoanCalculation.id == loan_id,
            LoanCalculation.user_id == user.id,
            LoanCalculation.is_active.is_(True),
        )
    )
    loan = result.scalar_one_or_none()
    if loan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "LOAN_NOT_FOUND", "message": "Loan calculation not found"},
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(loan, field, value)

    await db.flush()
    await db.refresh(loan)
    return LoanCalculationResponse.model_validate(loan)


@router.delete("/{loan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_loan(
    loan_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete a loan calculation."""
    result = await db.execute(
        select(LoanCalculation).where(
            LoanCalculation.id == loan_id,
            LoanCalculation.user_id == user.id,
            LoanCalculation.is_active.is_(True),
        )
    )
    loan = result.scalar_one_or_none()
    if loan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "LOAN_NOT_FOUND", "message": "Loan calculation not found"},
        )
    loan.is_active = False
