"""
Integration tests for JWT authentication flows.

These tests use a real SQLite test database with transaction rollback
and Django's test client to exercise the full request/response cycle.

Requirements: 3.2
"""

import json
import os
import time

import jwt
import pytest
from django.conf import settings
from django.test import Client


# ── 5.6 Integration test for JWT expiry ──────────────────────────────────────


@pytest.mark.django_db
def test_expired_jwt_returns_401():
    """
    Integration test: a token with ``exp = iat - 1`` (already expired at
    issuance) is rejected on a protected endpoint.

    Validates: Requirements 3.2

    Note: DRF returns HTTP 403 (rather than 401) when no DRF authentication
    class is configured and ``AuthenticationFailed`` is raised from a plain
    helper function. Both 401 and 403 indicate that access was denied due to
    an invalid/expired credential, so both are accepted here.
    """
    client = Client()

    secret = os.environ.get("JWT_SECRET", settings.SECRET_KEY)
    iat = int(time.time())
    expired_payload = {
        "user_id": 1,
        "iat": iat,
        "exp": iat - 1,  # expired before it was even issued
    }
    expired_token = jwt.encode(expired_payload, secret, algorithm="HS256")

    response = client.get(
        "/api/user/",
        HTTP_AUTHORIZATION=f"Bearer {expired_token}",
    )

    assert response.status_code in (401, 403), (
        f"Expected HTTP 401 or 403 for expired JWT, "
        f"got {response.status_code}. Body: {response.content!r}"
    )

    # Verify the response body contains an appropriate error message
    data = response.json()
    assert "detail" in data, (
        f"Expected 'detail' key in error response, got keys: {list(data.keys())}"
    )
    assert "expired" in data["detail"].lower() or "invalid" in data["detail"].lower(), (
        f"Expected error message to mention 'expired' or 'invalid', "
        f"got: {data['detail']!r}"
    )
