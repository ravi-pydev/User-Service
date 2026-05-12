"""
Property-based tests for cross-cutting authentication properties.

Feature: user-auth
"""

import json
import os
import time

import jwt
import pytest
from django.conf import settings
from django.test import Client
from hypothesis import given, settings as h_settings
from hypothesis import strategies as st

from apps.registration.models import User


# ── Strategies ────────────────────────────────────────────────────────────────

# Usernames: alphanumeric characters only, 1–20 chars
username_strategy = st.text(
    alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd")),
    min_size=1,
    max_size=20,
)

# Emails: Hypothesis built-in email strategy
email_strategy = st.emails()

# Passwords: printable ASCII text, 8–20 chars
password_strategy = st.text(
    alphabet=st.characters(
        whitelist_categories=("Lu", "Ll", "Nd", "Po", "Pd", "Pc"),
        whitelist_characters="!@#$%^&*()_+-=[]{}|;:,.<>?/~`",
    ),
    min_size=8,
    max_size=20,
)


# ── Helper ────────────────────────────────────────────────────────────────────

def has_password_hash(data) -> bool:
    """
    Recursively check whether `data` contains a key named 'password_hash'
    at any nesting level.

    Works on dicts (JSON objects) and lists (JSON arrays).
    Returns True if the key is found anywhere in the structure, False otherwise.
    """
    if isinstance(data, dict):
        if "password_hash" in data:
            return True
        return any(has_password_hash(v) for v in data.values())
    if isinstance(data, list):
        return any(has_password_hash(item) for item in data)
    return False


# ── Property 7: Password hash never appears in API responses ─────────────────

# Feature: user-auth, Property 7: Password hash never appears in API responses
@pytest.mark.django_db(transaction=True)
@given(
    username=username_strategy,
    email=email_strategy,
    password=password_strategy,
)
@h_settings(max_examples=20, deadline=None)
def test_password_hash_never_appears_in_api_responses(username, email, password):
    """
    **Validates: Requirements 7.4**

    For any API endpoint response (signup, login, /api/user/), the JSON
    payload SHALL NOT contain a key named `password_hash` at any nesting level.

    Steps:
    1. POST /api/auth/signup/ — check signup response body.
    2. POST /api/auth/login/ — check login response body.
    3. GET  /api/user/       — check user profile response body.
    """
    client = Client()

    # ── Step 1: Signup ────────────────────────────────────────────────────────
    signup_response = client.post(
        "/api/auth/signup/",
        data=json.dumps({"username": username, "email": email, "password": password}),
        content_type="application/json",
    )

    # Skip if signup fails (e.g. duplicate username/email across Hypothesis examples)
    if signup_response.status_code != 201:
        return

    signup_body = signup_response.json()
    assert not has_password_hash(signup_body), (
        f"'password_hash' found in signup response body: {signup_body!r}"
    )

    # ── Step 2: Login ─────────────────────────────────────────────────────────
    login_response = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": email, "password": password}),
        content_type="application/json",
    )

    assert login_response.status_code == 200, (
        f"Expected HTTP 200 for valid login, got {login_response.status_code}. "
        f"Response: {login_response.json()}"
    )

    login_body = login_response.json()
    assert not has_password_hash(login_body), (
        f"'password_hash' found in login response body: {login_body!r}"
    )

    # Extract the JWT token for authenticated requests
    token = login_body["token"]

    # ── Step 3: GET /api/user/ ────────────────────────────────────────────────
    user_response = client.get(
        "/api/user/",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert user_response.status_code == 200, (
        f"Expected HTTP 200 for /api/user/, got {user_response.status_code}. "
        f"Response: {user_response.json()}"
    )

    user_body = user_response.json()
    assert not has_password_hash(user_body), (
        f"'password_hash' found in /api/user/ response body: {user_body!r}"
    )


# ── Property 11: Valid JWT grants access and resolves the correct user ────────

# Feature: user-auth, Property 11: Valid JWT grants access and resolves the correct user
@pytest.mark.django_db(transaction=True)
@given(
    username=username_strategy,
    email=email_strategy,
    password=password_strategy,
)
@h_settings(max_examples=20, deadline=None)
def test_valid_jwt_grants_access_and_resolves_correct_user(username, email, password):
    """
    **Validates: Requirements 3.1**

    For any registered user, after a successful login, using the returned JWT
    as Authorization: Bearer <token> on a call to /api/user/ SHALL return
    HTTP 200 with username and email matching that user's record.
    """
    client = Client()

    # Step 1: Create the user via signup
    signup_response = client.post(
        "/api/auth/signup/",
        data=json.dumps({"username": username, "email": email, "password": password}),
        content_type="application/json",
    )

    # Skip if signup fails (e.g. duplicate username/email across Hypothesis examples)
    if signup_response.status_code != 201:
        return

    signup_data = signup_response.json()
    expected_username = signup_data["username"]
    expected_email = signup_data["email"]

    # Step 2: Login to obtain a JWT
    login_response = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": email, "password": password}),
        content_type="application/json",
    )

    assert login_response.status_code == 200, (
        f"Expected HTTP 200 for valid login, got {login_response.status_code}. "
        f"Response: {login_response.json()}"
    )

    token = login_response.json()["token"]
    assert isinstance(token, str) and len(token) > 0, (
        f"Expected a non-empty token string, got: {token!r}"
    )

    # Step 3: Make a request to /api/user/ with the Bearer token
    user_response = client.get(
        "/api/user/",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert user_response.status_code == 200, (
        f"Expected HTTP 200 from /api/user/ with valid JWT, "
        f"got {user_response.status_code}. "
        f"Response: {user_response.json()}"
    )

    user_data = user_response.json()

    # Step 4: Verify username and email match the registered user's record
    assert "username" in user_data, (
        f"Expected 'username' key in /api/user/ response, "
        f"got keys: {list(user_data.keys())}"
    )
    assert "email" in user_data, (
        f"Expected 'email' key in /api/user/ response, "
        f"got keys: {list(user_data.keys())}"
    )

    assert user_data["username"] == expected_username, (
        f"Username mismatch: response returned {user_data['username']!r}, "
        f"expected {expected_username!r}"
    )
    assert user_data["email"] == expected_email, (
        f"Email mismatch: response returned {user_data['email']!r}, "
        f"expected {expected_email!r}"
    )


# ── Property 12: Invalid or expired tokens are rejected ──────────────────────

# Feature: user-auth, Property 12: Invalid or expired tokens are rejected
@pytest.mark.django_db(transaction=True)
@given(
    invalid_token=st.text(
        # Restrict to printable ASCII (codepoints 0x20–0x7E) so the token can be
        # encoded in HTTP headers (latin-1 encoding; non-ASCII chars cause a
        # UnicodeEncodeError in Django's test client).
        alphabet=st.characters(min_codepoint=0x20, max_codepoint=0x7E),
        min_size=1,
        max_size=100,
    )
)
@h_settings(max_examples=20, deadline=None)
def test_invalid_token_rejected(invalid_token):
    """
    **Validates: Requirements 3.2**

    For any string that is not a currently-valid JWT (random strings, tampered
    tokens, expired tokens), a request to a protected endpoint with
    ``Authorization: Bearer <string>`` SHALL be rejected (HTTP 401 or 403).

    Random printable-ASCII strings are not valid JWTs, so they should all be
    rejected. DRF returns HTTP 403 (rather than 401) when no DRF authentication
    class is configured and ``AuthenticationFailed`` is raised — both status
    codes indicate that access was denied.
    """
    client = Client()

    response = client.get(
        "/api/user/",
        HTTP_AUTHORIZATION=f"Bearer {invalid_token}",
    )

    assert response.status_code in (401, 403), (
        f"Expected HTTP 401 or 403 for invalid token {invalid_token!r}, "
        f"got {response.status_code}. Response body: {response.content!r}"
    )


@pytest.mark.django_db(transaction=True)
def test_expired_token_rejected():
    """
    **Validates: Requirements 3.2**

    A token with ``exp = iat - 1`` (already expired at issuance) SHALL be
    rejected on any protected endpoint (HTTP 401 or 403).

    DRF returns HTTP 403 when no DRF authentication class is configured and
    ``AuthenticationFailed`` is raised — both 401 and 403 indicate access denied.
    """
    secret = os.environ.get("JWT_SECRET", settings.SECRET_KEY)

    iat = int(time.time())
    expired_payload = {
        "user_id": 999999,
        "iat": iat,
        "exp": iat - 1,  # expired before it was even issued
    }
    expired_token = jwt.encode(expired_payload, secret, algorithm="HS256")

    client = Client()
    response = client.get(
        "/api/user/",
        HTTP_AUTHORIZATION=f"Bearer {expired_token}",
    )

    assert response.status_code in (401, 403), (
        f"Expected HTTP 401 or 403 for expired token, "
        f"got {response.status_code}. Response body: {response.content!r}"
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


@pytest.mark.django_db(transaction=True)
def test_tampered_token_rejected():
    """
    **Validates: Requirements 3.2**

    A structurally valid JWT whose signature has been tampered with SHALL be
    rejected on any protected endpoint (HTTP 401 or 403).

    DRF returns HTTP 403 when no DRF authentication class is configured and
    ``AuthenticationFailed`` is raised — both 401 and 403 indicate access denied.
    """
    # Sign with a different secret so the signature is invalid against the app's secret
    wrong_secret = "this-is-not-the-real-secret-key-xyzzy"
    iat = int(time.time())
    tampered_payload = {
        "user_id": 1,
        "iat": iat,
        "exp": iat + 86400,
    }
    tampered_token = jwt.encode(tampered_payload, wrong_secret, algorithm="HS256")

    client = Client()
    response = client.get(
        "/api/user/",
        HTTP_AUTHORIZATION=f"Bearer {tampered_token}",
    )

    assert response.status_code in (401, 403), (
        f"Expected HTTP 401 or 403 for tampered token, "
        f"got {response.status_code}. Response body: {response.content!r}"
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
