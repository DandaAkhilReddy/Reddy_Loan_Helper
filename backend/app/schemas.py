from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class UserResponse(BaseModel):
    id: str
    name: str

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    token: str
    user: UserResponse


class LoanDataRequest(BaseModel):
    principal: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    annual_rate: Decimal = Field(ge=0, le=50, max_digits=5, decimal_places=2)
    emi: Decimal | None = Field(None, ge=0, max_digits=12, decimal_places=2)
    tenure_months: int | None = Field(None, ge=1, le=600)
    extra_monthly: Decimal = Field(default=0, ge=0, max_digits=12, decimal_places=2)
    currency: Literal["INR", "USD"] = "INR"


class LoanDataResponse(BaseModel):
    principal: float
    annual_rate: float
    emi: float | None
    tenure_months: int | None
    extra_monthly: float
    currency: str

    model_config = {"from_attributes": True}
