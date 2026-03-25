from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, get_current_user
from app.db import get_db
from app.models import User
from app.schemas import TokenResponse, UserLogin, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Login or register by name. Creates user if not exists."""
    normalized_name = body.name.strip().lower()

    result = await db.execute(select(User).where(User.name == normalized_name))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(name=normalized_name)
        db.add(user)
        await db.flush()

    token = create_access_token(user.id, user.name)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)) -> UserResponse:
    """Get current authenticated user."""
    return UserResponse.model_validate(user)
