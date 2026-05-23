"""
Property-based tests for the login endpoint.

Feature: user-auth
"""

import json

import jwt
import pytest
from django.test import Client
from hypothesis import given, settings
from hypothesis import strategies as st


# ── Strategies ────────────────────────────────────────────────────────────────

# Usernames: alphanumeric characters only, 1–20 chars
username_strategy = st.text(
    alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd")),
    min_size=1,
    max_size=20,
)

# Emails: Hypothesis built-in email strategy
email_strategy = st.emails()

# Passwords: printable ASCII text, 8–20 chars (excludes null and control characters
# that Django's CharField validator rejects with HTTP 400 before auth is attempted)
password_strategy = st.text(
    alphabet=st.characters(
        whitelist_categories=("Lu", "Ll", "Nd", "Po", "Pd", "Pc"),
        whitelist_characters="!@#$%^&*()_+-=[]{}|;:,.<>?/~`",
    ),
    min_size=8,
    max_size=20,
)


# ── Property 8: Valid login returns a JWT with correct claims ─────────────────

# Feature: user-auth, Property 8: Valid login returns a JWT with correct claims
@pytest.mark.django_db(transaction=True)
@given(
    username=username_strategy,
    email=email_strategy,
    password=password_strategy,
)
@settings(max_examples=20, deadline=None)
def test_valid_login_returns_jwt_with_correct_claims(username, email, password):
    """
    **Validates: Requirements 2.1, 2.5**

    For any registered user, a POST to /api/auth/login/ with their correct
    email and password SHALL return HTTP 200 with a JWT whose decoded payload
    contains user_id equal to the user's database PK, and whose exp - iat
    equals exactly 86400 seconds.
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

    signup_payload = signup_response.json()
    user_id = signup_payload["id"]

    # Step 2: Login with correct credentials
    login_response = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": email, "password": password}),
        content_type="application/json",
    )

    assert login_response.status_code == 200, (
        f"Expected HTTP 200 for valid login, got {login_response.status_code}. "
        f"Response: {login_response.json()}"
    )

    login_data = login_response.json()

    # Step 3: Verify the response contains a token
    assert "token" in login_data, (
        f"Expected 'token' key in login response, got keys: {list(login_data.keys())}"
    )

    token = login_data["token"]
    assert isinstance(token, str) and len(token) > 0, (
        f"Expected a non-empty token string, got: {token!r}"
    )

    # Step 4: Decode JWT payload without signature verification
    decoded = jwt.decode(token, options={"verify_signature": False})

    # Step 5: Verify user_id matches the user's database PK
    assert "user_id" in decoded, (
        f"Expected 'user_id' claim in JWT payload, got keys: {list(decoded.keys())}"
    )
    assert decoded["user_id"] == user_id, (
        f"JWT user_id {decoded['user_id']} does not match database PK {user_id}"
    )

    # Step 6: Verify exp - iat == 86400 (24 hours)
    assert "iat" in decoded, (
        f"Expected 'iat' claim in JWT payload, got keys: {list(decoded.keys())}"
    )
    assert "exp" in decoded, (
        f"Expected 'exp' claim in JWT payload, got keys: {list(decoded.keys())}"
    )
    assert decoded["exp"] - decoded["iat"] == 86400, (
        f"Expected exp - iat == 86400, got {decoded['exp'] - decoded['iat']}"
    )


# ── Property 9: Invalid credentials always return the same generic 401 ────────

# Feature: user-auth, Property 9: Invalid credentials always return the same generic 401
@pytest.mark.django_db(transaction=True)
@given(password=password_strategy, wrong_password=password_strategy)
@settings(max_examples=20, deadline=None)
def test_invalid_credentials_always_return_generic_401(password, wrong_password):
    """
    **Validates: Requirements 2.2, 2.3**

    For any email/password pair where either the email does not exist in the
    database OR the password does not match the stored hash, a POST to
    /api/auth/login/ SHALL return HTTP 401 with the same generic error message
    body, regardless of which condition caused the failure.

    This test:
    1. Attempts login with a non-existent email — captures the error message.
    2. Creates a real user, then attempts login with the correct email but a
       wrong password — captures the error message.
    3. Verifies both responses are HTTP 401 with identical error message bodies.
    """
    # Ensure wrong_password is actually different from the correct password
    # so that the wrong-password branch is genuinely exercised.
    if wrong_password == password:
        return

    client = Client()

    # ── Case 1: non-existent email ────────────────────────────────────────────
    nonexistent_email = "no_such_user_prop9@example.com"
    # Make sure this user does not exist
    from apps.registration.models import User as _User
    _User.objects.filter(email=nonexistent_email).delete()

    response_nonexistent = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": nonexistent_email, "password": password}),
        content_type="application/json",
    )

    assert response_nonexistent.status_code == 401, (
        f"Expected HTTP 401 for non-existent email, "
        f"got {response_nonexistent.status_code}. "
        f"Response: {response_nonexistent.json()}"
    )
    error_nonexistent = response_nonexistent.json()

    # ── Case 2: existing email, wrong password ────────────────────────────────
    username = "prop9_testuser"
    email = "prop9_testuser@example.com"
    # Clean up any leftover user from a previous Hypothesis example
    _User.objects.filter(username=username).delete()

    signup_response = client.post(
        "/api/auth/signup/",
        data=json.dumps({"username": username, "email": email, "password": password}),
        content_type="application/json",
    )
    assert signup_response.status_code == 201, (
        f"Setup failed: expected HTTP 201 for signup, "
        f"got {signup_response.status_code}. Response: {signup_response.json()}"
    )

    response_wrong_pw = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": email, "password": wrong_password}),
        content_type="application/json",
    )

    assert response_wrong_pw.status_code == 401, (
        f"Expected HTTP 401 for wrong password, "
        f"got {response_wrong_pw.status_code}. "
        f"Response: {response_wrong_pw.json()}"
    )
    error_wrong_pw = response_wrong_pw.json()

    # ── Both error bodies must be identical ───────────────────────────────────
    assert error_nonexistent == error_wrong_pw, (
        f"Error bodies differ between non-existent email and wrong password cases. "
        f"Non-existent email response: {error_nonexistent!r}. "
        f"Wrong password response: {error_wrong_pw!r}. "
        f"This leaks information about which condition caused the failure "
        f"(user enumeration vulnerability)."
    )


# ── Property 10: Oversized email is rejected at login ────────────────────────

# Feature: user-auth, Property 10: Oversized email is rejected at login
@pytest.mark.django_db(transaction=True)
@given(
    oversized_email=st.text(min_size=255, max_size=300),
    password=st.text(min_size=8, max_size=20),
)
@settings(max_examples=20)
def test_oversized_email_rejected_at_login(oversized_email, password):
    """
    **Validates: Requirements 2.6**

    For any email string of length 255 or greater, a POST to
    /api/auth/login/ SHALL return HTTP 400 with a validation error
    on the `email` field.
    """
    client = Client()

    response = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": oversized_email, "password": password}),
        content_type="application/json",
    )

    assert response.status_code == 400, (
        f"Expected HTTP 400 for email of length {len(oversized_email)}, "
        f"got {response.status_code}. Response: {response.json()}"
    )

    data = response.json()
    assert "email" in data, (
        f"Expected 'email' key in error response, got keys: {list(data.keys())}. "
        f"Email length was {len(oversized_email)}."
    )
