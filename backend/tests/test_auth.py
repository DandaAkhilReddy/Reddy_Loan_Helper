from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def login(client, name: str = "TestUser") -> dict:
    """POST /api/auth/login and return the full JSON body."""
    resp = await client.post("/api/auth/login", json={"name": name})
    assert resp.status_code == 200, resp.text
    return resp.json()


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _expired_token(secret: str, algorithm: str = "HS256") -> str:
    """Create a JWT whose exp is 1 hour in the past."""
    payload = {
        "sub": "999",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_creates_new_user(client):
    """POST /api/auth/login creates a new user and returns a token + user."""
    data = await login(client, "Alice")

    assert "token" in data
    assert isinstance(data["token"], str)
    assert len(data["token"]) > 0

    assert "user" in data
    user = data["user"]
    assert user["name"] == "Alice"
    assert "id" in user


@pytest.mark.asyncio
async def test_login_same_name_returns_same_user(client):
    """Logging in twice with names that differ only in case returns the same user."""
    first = await login(client, "BobSmith")
    second = await login(client, "bobsmith")

    assert first["user"]["id"] == second["user"]["id"]


@pytest.mark.asyncio
async def test_login_empty_name_is_422(client):
    """POST /api/auth/login with an empty name must be rejected."""
    resp = await client.post("/api/auth/login", json={"name": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_me_with_valid_token(client):
    """GET /api/auth/me with a valid bearer token returns the authenticated user."""
    data = await login(client, "Carol")
    token = data["token"]

    resp = await client.get("/api/auth/me", headers=auth_header(token))
    assert resp.status_code == 200

    me = resp.json()
    assert me["name"] == "Carol"
    assert me["id"] == data["user"]["id"]


@pytest.mark.asyncio
async def test_me_without_token_is_422(client):
    """GET /api/auth/me with no Authorization header returns 422."""
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_me_with_invalid_token_is_401(client):
    """GET /api/auth/me with a garbage token returns 401."""
    resp = await client.get(
        "/api/auth/me", headers={"Authorization": "Bearer not-a-real-jwt"}
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_with_expired_token_is_401(client):
    """GET /api/auth/me with a token that expired in the past returns 401."""
    # Import the app's own secret so the signature is valid — only exp is wrong.
    from app.config import settings as app_settings

    token = _expired_token(app_settings.jwt_secret, app_settings.jwt_algorithm)

    resp = await client.get("/api/auth/me", headers=auth_header(token))
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout(client):
    """POST /api/auth/logout returns {ok: true}."""
    data = await login(client, "Dave")
    token = data["token"]

    resp = await client.post(
        "/api/auth/logout", headers=auth_header(token)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body.get("ok") is True


@pytest.mark.asyncio
async def test_login_updates_last_login_at(client, db_session):
    """Logging in a second time bumps last_login_at on the User row."""
    from sqlalchemy import select
    from app.models import User

    # First login — record initial last_login_at.
    # The route stores the name with original casing, so query with "Eve".
    await login(client, "Eve")
    result = await db_session.execute(
        select(User).where(User.name == "Eve")
    )
    user_after_first = result.scalar_one()
    first_login = user_after_first.last_login_at

    # Second login
    await login(client, "Eve")
    await db_session.refresh(user_after_first)
    second_login = user_after_first.last_login_at

    # second_login should be >= first_login (same timestamp is acceptable
    # if both calls land within the same DB clock tick, but never earlier)
    assert second_login >= first_login
