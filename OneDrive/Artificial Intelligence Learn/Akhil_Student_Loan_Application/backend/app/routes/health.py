from __future__ import annotations

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}


@router.get("/health/ready")
async def readiness(db: AsyncSession = Depends(get_db)) -> JSONResponse:
    try:
        await db.execute(text("SELECT 1"))
        return JSONResponse(
            content={"status": "ready", "database": "connected"},
            status_code=status.HTTP_200_OK,
        )
    except Exception:
        return JSONResponse(
            content={"status": "unavailable", "database": "disconnected"},
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
