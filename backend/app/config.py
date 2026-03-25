from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/reddy_loan"
    JWT_SECRET: str = "dev-secret-change-me"
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    PORT: int = 8000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
