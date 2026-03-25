from __future__ import annotations

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def login_and_get_token(client, name: str = "TestUser") -> str:
    """POST /api/auth/login and return the bearer token string."""
    response = await client.post("/api/auth/login", json={"name": name})
    assert response.status_code == 200, response.text
    return response.json()["token"]


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# Minimal valid loan-data payload — field names match LoanDataRequest schema
VALID_PAYLOAD: dict = {
    "principal": 500_000,
    "annual_rate": 8.5,
    "tenure_months": 240,
    "currency": "INR",
}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_loan_data_no_data_returns_204(client):
    """GET /api/loan-data when user has no saved data → 204 No Content."""
    token = await login_and_get_token(client, "UserNoData")
    resp = await client.get("/api/loan-data", headers=auth_header(token))
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_put_loan_data_creates_record(client):
    """PUT /api/loan-data creates a new record and echoes it back."""
    token = await login_and_get_token(client, "UserCreate")
    resp = await client.put(
        "/api/loan-data",
        json=VALID_PAYLOAD,
        headers=auth_header(token),
    )
    assert resp.status_code == 200

    body = resp.json()
    assert body["principal"] == VALID_PAYLOAD["principal"]
    assert body["annual_rate"] == VALID_PAYLOAD["annual_rate"]
    assert body["tenure_months"] == VALID_PAYLOAD["tenure_months"]
    assert body["currency"] == VALID_PAYLOAD["currency"]


@pytest.mark.asyncio
async def test_get_loan_data_after_put_returns_data(client):
    """GET /api/loan-data after a PUT returns the previously saved record."""
    token = await login_and_get_token(client, "UserGet")
    await client.put(
        "/api/loan-data", json=VALID_PAYLOAD, headers=auth_header(token)
    )

    resp = await client.get("/api/loan-data", headers=auth_header(token))
    assert resp.status_code == 200

    body = resp.json()
    assert body["principal"] == VALID_PAYLOAD["principal"]
    assert body["currency"] == VALID_PAYLOAD["currency"]


@pytest.mark.asyncio
async def test_put_loan_data_updates_existing(client):
    """A second PUT overwrites the first record and returns updated values."""
    token = await login_and_get_token(client, "UserUpdate")
    await client.put(
        "/api/loan-data", json=VALID_PAYLOAD, headers=auth_header(token)
    )

    updated_payload = {**VALID_PAYLOAD, "principal": 1_000_000, "tenure_months": 360}
    resp = await client.put(
        "/api/loan-data", json=updated_payload, headers=auth_header(token)
    )
    assert resp.status_code == 200

    body = resp.json()
    assert body["principal"] == 1_000_000
    assert body["tenure_months"] == 360

    # GET also reflects the update
    get_resp = await client.get("/api/loan-data", headers=auth_header(token))
    assert get_resp.status_code == 200
    assert get_resp.json()["principal"] == 1_000_000


@pytest.mark.asyncio
async def test_put_loan_data_invalid_principal_zero_is_422(client):
    """PUT /api/loan-data with principal=0 is rejected as invalid input."""
    token = await login_and_get_token(client, "UserBadPrincipal")
    bad_payload = {**VALID_PAYLOAD, "principal": 0}
    resp = await client.put(
        "/api/loan-data", json=bad_payload, headers=auth_header(token)
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_put_loan_data_invalid_currency_is_422(client):
    """PUT /api/loan-data with an unrecognised currency is rejected."""
    token = await login_and_get_token(client, "UserBadCurrency")
    bad_payload = {**VALID_PAYLOAD, "currency": "FAKE"}
    resp = await client.put(
        "/api/loan-data", json=bad_payload, headers=auth_header(token)
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_loan_data_without_auth_is_422(client):
    """GET /api/loan-data with no Authorization header returns 422."""
    resp = await client.get("/api/loan-data")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_put_loan_data_without_auth_is_422(client):
    """PUT /api/loan-data with no Authorization header returns 422."""
    resp = await client.put("/api/loan-data", json=VALID_PAYLOAD)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_different_users_have_different_loan_data(client):
    """Two distinct users each see only their own saved loan data."""
    token_a = await login_and_get_token(client, "UserAlpha")
    token_b = await login_and_get_token(client, "UserBeta")

    payload_a = {**VALID_PAYLOAD, "principal": 300_000}
    payload_b = {**VALID_PAYLOAD, "principal": 800_000}

    await client.put(
        "/api/loan-data", json=payload_a, headers=auth_header(token_a)
    )
    await client.put(
        "/api/loan-data", json=payload_b, headers=auth_header(token_b)
    )

    resp_a = await client.get("/api/loan-data", headers=auth_header(token_a))
    resp_b = await client.get("/api/loan-data", headers=auth_header(token_b))

    assert resp_a.status_code == 200
    assert resp_b.status_code == 200
    assert resp_a.json()["principal"] == 300_000
    assert resp_b.json()["principal"] == 800_000
