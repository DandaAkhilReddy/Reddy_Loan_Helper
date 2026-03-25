from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from jose import jwt
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.deps import CurrentUser, get_db
from app.models import User
from app.schemas import LoginRequest, LoginResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> LoginResponse:
    name = body.name.strip()

    result = await db.execute(select(User).where(func.lower(User.name) == name.lower()))
    user = result.scalar_one_or_none()

    if not user:
        user = User(name=name)
        db.add(user)

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expire_days)
    token = jwt.encode(
        {"user_id": user.id, "name": user.name, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )

    return LoginResponse(token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def me(user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(user)


@router.post("/logout")
async def logout() -> dict[str, bool]:
    return {"ok": True}
