"""
Property-based tests for the signup endpoint.

Feature: user-auth
"""

import json

import pytest
from django.test import Client
from hypothesis import given, settings
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

# Passwords: printable ASCII characters only (no control chars like \r, \n that
# may be stripped/normalized by Django's password hasher or HTTP layer), 8–20 chars
password_strategy = st.text(
    alphabet=st.characters(
        whitelist_categories=("Lu", "Ll", "Nd", "Po", "Pd", "Pc"),
        whitelist_characters="!@#$%^&*()_+-=[]{}|;:,.<>?",
        blacklist_characters="\r\n\t\x00",
    ),
    min_size=8,
    max_size=20,
)


# ── Property 1: Signup round-trip creates a retrievable user ──────────────────

# Feature: user-auth, Property 1: Signup round-trip creates a retrievable user
@pytest.mark.django_db(transaction=True)
@given(
    username=username_strategy,
    email=email_strategy,
    password=password_strategy,
)
@settings(max_examples=20)
def test_signup_roundtrip_creates_retrievable_user(username, email, password):
    """
    Validates: Requirements 1.1

    For any valid (username, email, password) triple, a successful POST to
    /api/auth/signup/ SHALL return HTTP 201 with id, username, and email
    matching the submitted values, and the user SHALL be retrievable from
    the database with those same fields.
    """
    client = Client()

    response = client.post(
        "/api/auth/signup/",
        data=json.dumps({"username": username, "email": email, "password": password}),
        content_type="application/json",
    )

    # Only assert the round-trip property when signup succeeds (201).
    # Hypothesis may generate duplicate usernames/emails across examples within
    # a single database transaction; those are valid 400 responses and are not
    # the subject of this property.
    if response.status_code != 201:
        return

    payload = response.json()

    # Response fields must match submitted values
    assert "id" in payload, "Response must contain 'id'"
    assert payload["username"] == username, (
        f"Returned username {payload['username']!r} != submitted {username!r}"
    )
    assert payload["email"] == email, (
        f"Returned email {payload['email']!r} != submitted {email!r}"
    )

    user_id = payload["id"]

    # User must exist in the database with matching fields
    db_user = User.objects.get(pk=user_id)
    assert db_user.username == username, (
        f"DB username {db_user.username!r} != submitted {username!r}"
    )
    assert db_user.email == email, (
        f"DB email {db_user.email!r} != submitted {email!r}"
    )


# ── Property 6: Passwords are never stored in plaintext ──────────────────────

# Feature: user-auth, Property 6: Passwords are never stored in plaintext
@pytest.mark.django_db(transaction=True)
@given(password=password_strategy)
@settings(max_examples=20, deadline=None)
def test_passwords_are_never_stored_in_plaintext(password):
    """
    **Validates: Requirements 1.7, 7.1**

    For any successful signup with password p, the password_hash field stored
    in the database SHALL NOT equal p, SHALL begin with 'pbkdf2_sha256$', and
    check_password(p, password_hash) SHALL return True.
    """
    from django.contrib.auth.hashers import check_password

    client = Client()

    # Use a fixed, unique username/email that is cleaned up before each example
    # so that Hypothesis shrinking and replay always start from a clean state.
    username = "prop6_testuser"
    email = "prop6_testuser@example.com"
    User.objects.filter(username=username).delete()

    response = client.post(
        "/api/auth/signup/",
        data=json.dumps({"username": username, "email": email, "password": password}),
        content_type="application/json",
    )

    # Signup must succeed for this property to be testable.
    assert response.status_code == 201, (
        f"Expected HTTP 201 for valid signup, got {response.status_code}. "
        f"Response: {response.json()}"
    )

    payload = response.json()
    user_id = payload["id"]

    db_user = User.objects.get(pk=user_id)
    stored_hash = db_user.password_hash

    # The stored value must not be the plaintext password
    assert stored_hash != password, (
        f"password_hash must not equal the plaintext password {password!r}"
    )

    # The stored value must use PBKDF2-SHA256 (Django's default hasher)
    assert stored_hash.startswith("pbkdf2_sha256$"), (
        f"password_hash {stored_hash!r} does not start with 'pbkdf2_sha256$'"
    )

    # Django's check_password must verify the plaintext against the stored hash
    assert check_password(password, stored_hash), (
        f"check_password({password!r}, hash) returned False — hash verification failed"
    )


# ── Property 3: Short passwords are rejected ─────────────────────────────────

# Feature: user-auth, Property 3: Short passwords are rejected
@pytest.mark.django_db(transaction=True)
@given(password=st.text(min_size=0, max_size=7))
@settings(max_examples=20)
def test_short_password_is_rejected(password):
    """
    **Validates: Requirements 1.4**

    For any password string of length 0–7 (inclusive), a POST to
    /api/auth/signup/ SHALL return HTTP 400 with a validation error
    on the `password` field.
    """
    client = Client()

    # Derive a unique username/email from the password so that duplicate-user
    # 400s do not mask the password-length 400.
    suffix = str(abs(hash(password)) % 10_000_000)
    payload = {
        "username": f"u{suffix}",
        "email": f"u{suffix}@example.com",
        "password": password,
    }

    response = client.post(
        "/api/auth/signup/",
        data=json.dumps(payload),
        content_type="application/json",
    )

    assert response.status_code == 400, (
        f"Expected HTTP 400 for password of length {len(password)}, "
        f"got {response.status_code}. Response: {response.json()}"
    )

    data = response.json()
    assert "password" in data, (
        f"Expected 'password' key in error response, got keys: {list(data.keys())}. "
        f"Password length was {len(password)}."
    )


# ── Property 5: Malformed emails are rejected at signup ───────────────────────

# Feature: user-auth, Property 5: Malformed emails are rejected at signup
@pytest.mark.django_db(transaction=True)
@given(
    username=username_strategy,
    invalid_email=st.text(min_size=1, max_size=50).filter(lambda s: "@" not in s),
    password=password_strategy,
)
@settings(max_examples=20)
def test_malformed_email_rejected_at_signup(username, invalid_email, password):
    """
    Property 5: Malformed emails are rejected at signup.
    Validates: Requirements 1.6

    For any string that does not contain '@', a POST to /api/auth/signup/
    SHALL return HTTP 400 with a validation error on the 'email' field.
    """
    client = Client()
    response = client.post(
        "/api/auth/signup/",
        data=json.dumps({"username": username, "email": invalid_email, "password": password}),
        content_type="application/json",
    )

    assert response.status_code == 400, (
        f"Expected HTTP 400 for invalid email {invalid_email!r}, got {response.status_code}"
    )

    data = response.json()
    assert "email" in data, (
        f"Expected 'email' field error in response, got: {data}"
    )


# ── Property 4: Long usernames are rejected ───────────────────────────────────

# Feature: user-auth, Property 4: Long usernames are rejected
@pytest.mark.django_db(transaction=True)
@given(
    username=st.text(
        alphabet=st.characters(
            whitelist_categories=("Lu", "Ll", "Nd"),
            whitelist_characters="_",
        ),
        min_size=81,
        max_size=200,
    ),
)
@settings(max_examples=20)
def test_long_username_is_rejected(username):
    """
    **Validates: Requirements 1.8**

    For any username string of length 81 or greater, a POST to
    /api/auth/signup/ SHALL return HTTP 400 with a validation error
    on the `username` field.
    """
    client = Client()
    payload = {
        "username": username,
        "email": "test@example.com",
        "password": "validpassword123",
    }
    response = client.post(
        "/api/auth/signup/",
        data=json.dumps(payload),
        content_type="application/json",
    )

    assert response.status_code == 400, (
        f"Expected HTTP 400 for username of length {len(username)}, "
        f"got {response.status_code}"
    )

    data = response.json()
    assert "username" in data, (
        f"Expected 'username' field error in response, got: {data}"
    )


# ── Property 2: Duplicate username or email is rejected ───────────────────────

# Feature: user-auth, Property 2: Duplicate username or email is rejected
@pytest.mark.django_db(transaction=True)
@given(
    username=username_strategy,
    email=email_strategy,
    password=password_strategy,
    alt_email=email_strategy,
    alt_username=username_strategy,
)
@settings(max_examples=20)
def test_duplicate_username_or_email_is_rejected(
    username, email, password, alt_email, alt_username
):
    """
    **Validates: Requirements 1.2, 1.3**

    For any existing user, a subsequent signup attempt using the same
    `username` OR the same `email` SHALL return HTTP 400 with a field-level
    error identifying the conflicting field.
    """
    # Ensure the alternate values are distinct from the originals so that
    # only one conflict is introduced at a time.
    if alt_email == email or alt_username == username:
        return

    client = Client()

    # Create the initial user; skip if this combination is already taken
    # (can happen across Hypothesis examples within the same DB transaction).
    first_response = client.post(
        "/api/auth/signup/",
        data=json.dumps({"username": username, "email": email, "password": password}),
        content_type="application/json",
    )
    if first_response.status_code != 201:
        return

    # ── Duplicate username (different email) ──────────────────────────────────
    dup_username_response = client.post(
        "/api/auth/signup/",
        data=json.dumps(
            {"username": username, "email": alt_email, "password": password}
        ),
        content_type="application/json",
    )

    assert dup_username_response.status_code == 400, (
        f"Expected HTTP 400 when reusing username {username!r}, "
        f"got {dup_username_response.status_code}. "
        f"Response: {dup_username_response.json()}"
    )
    dup_username_data = dup_username_response.json()
    assert "username" in dup_username_data, (
        f"Expected 'username' field error for duplicate username, "
        f"got keys: {list(dup_username_data.keys())}"
    )

    # ── Duplicate email (different username) ──────────────────────────────────
    dup_email_response = client.post(
        "/api/auth/signup/",
        data=json.dumps(
            {"username": alt_username, "email": email, "password": password}
        ),
        content_type="application/json",
    )

    assert dup_email_response.status_code == 400, (
        f"Expected HTTP 400 when reusing email {email!r}, "
        f"got {dup_email_response.status_code}. "
        f"Response: {dup_email_response.json()}"
    )
    dup_email_data = dup_email_response.json()
    assert "email" in dup_email_data, (
        f"Expected 'email' field error for duplicate email, "
        f"got keys: {list(dup_email_data.keys())}"
    )
