from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class UserLogin(BaseModel):
    name: str = Field(min_length=1, max_length=50, description="Display name for login")


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoanCalculationCreate(BaseModel):
    principal: float = Field(gt=0, description="Remaining principal in currency units")
    annual_rate: float = Field(ge=0, le=50, description="Annual interest rate as percentage")
    emi: float | None = Field(default=None, ge=0, description="Current EMI amount")
    tenure_months: int | None = Field(default=None, ge=1, description="Remaining tenure in months")
    extra_monthly: float = Field(default=0, ge=0, description="Extra monthly payment")
    currency: str = Field(default="INR", pattern=r"^[A-Z]{3}$")
    name: str = Field(default="Default", min_length=1, max_length=100)


class LoanCalculationUpdate(BaseModel):
    principal: float | None = Field(default=None, gt=0)
    annual_rate: float | None = Field(default=None, ge=0, le=50)
    emi: float | None = None
    tenure_months: int | None = None
    extra_monthly: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
    name: str | None = Field(default=None, min_length=1, max_length=100)


class LoanCalculationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    principal: float
    annual_rate: float
    emi: float | None
    tenure_months: int | None
    extra_monthly: float
    currency: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
