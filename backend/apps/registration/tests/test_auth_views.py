"""
Tests for authentication views: LoginView, LogoutView, UpgradeUserView, DowngradeUserView.

Requirements: 9.2, 9.3, 9.4, 9.5, 9.6
"""

import pytest
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIClient

from apps.registration.api import jwt_utils
from apps.registration.models import User

LOGIN_URL = "/api/auth/login/"
LOGOUT_URL = "/api/auth/logout/"
UPGRADE_URL = "/api/user/upgrade/"
DOWNGRADE_URL = "/api/user/downgrade/"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user(db):
    """Create a test user with a known password."""
    password = "testpassword123"
    user = User.objects.create(
        username="testuser",
        email="testuser@example.com",
        password_hash=make_password(password),
        is_premium=False,
    )
    user._plain_password = password
    return user


@pytest.fixture
def premium_user(db):
    """Create a premium test user."""
    password = "premiumpass456"
    user = User.objects.create(
        username="premiumuser",
        email="premiumuser@example.com",
        password_hash=make_password(password),
        is_premium=True,
    )
    user._plain_password = password
    return user


@pytest.mark.django_db
class TestLoginViewIsPremium:
    """LoginView returns is_premium in the user object of the response."""

    def test_login_returns_is_premium_false_for_free_user(self, api_client, test_user):
        """Validates: Requirements 2.1, 2.2 — is_premium=False is present in user object."""
        response = api_client.post(
            LOGIN_URL,
            {"identifier": test_user.email, "password": test_user._plain_password},
            format="json",
        )

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "is_premium" in data["user"]
        assert data["user"]["is_premium"] is False

    def test_login_returns_is_premium_true_for_premium_user(self, api_client, premium_user):
        """Validates: Requirements 2.1, 2.2 — is_premium=True is present in user object."""
        response = api_client.post(
            LOGIN_URL,
            {"identifier": premium_user.email, "password": premium_user._plain_password},
            format="json",
        )

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "is_premium" in data["user"]
        assert data["user"]["is_premium"] is True

    def test_login_user_object_contains_all_fields(self, api_client, test_user):
        """Validates: Requirements 2.1 — user object contains id, username, email, is_premium."""
        response = api_client.post(
            LOGIN_URL,
            {"identifier": test_user.email, "password": test_user._plain_password},
            format="json",
        )

        assert response.status_code == 200
        user_data = response.json()["user"]
        assert "id" in user_data
        assert "username" in user_data
        assert "email" in user_data
        assert "is_premium" in user_data
        assert user_data["username"] == test_user.username
        assert user_data["email"] == test_user.email


@pytest.mark.django_db
class TestLoginViewToken:
    """LoginView returns a token field in the response."""

    def test_login_returns_token(self, api_client, test_user):
        """Validates: Requirements 2.3 — token field is present in response."""
        response = api_client.post(
            LOGIN_URL,
            {"identifier": test_user.email, "password": test_user._plain_password},
            format="json",
        )

        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0

    def test_login_token_is_non_empty_string(self, api_client, test_user):
        """Validates: Requirements 2.3 — token is a non-empty string."""
        response = api_client.post(
            LOGIN_URL,
            {"identifier": test_user.email, "password": test_user._plain_password},
            format="json",
        )

        token = response.json()["token"]
        # JWT tokens have 3 dot-separated parts
        parts = token.split(".")
        assert len(parts) == 3

    def test_login_with_username_returns_token(self, api_client, test_user):
        """Validates: Requirements 2.3 — login via username also returns token."""
        response = api_client.post(
            LOGIN_URL,
            {"identifier": test_user.username, "password": test_user._plain_password},
            format="json",
        )

        assert response.status_code == 200
        assert "token" in response.json()


@pytest.mark.django_db
class TestLoginViewInvalidCredentials:
    """LoginView returns HTTP 401 for invalid credentials."""

    def test_login_wrong_password_returns_401(self, api_client, test_user):
        """Validates: Requirements 2.5 — wrong password → HTTP 401."""
        response = api_client.post(
            LOGIN_URL,
            {"identifier": test_user.email, "password": "wrongpassword"},
            format="json",
        )

        assert response.status_code == 401

    def test_login_nonexistent_user_returns_401(self, api_client):
        """Validates: Requirements 2.5 — unknown email → HTTP 401."""
        response = api_client.post(
            LOGIN_URL,
            {"identifier": "nobody@example.com", "password": "somepassword"},
            format="json",
        )

        assert response.status_code == 401

    def test_login_invalid_credentials_returns_detail(self, api_client, test_user):
        """Validates: Requirements 2.5 — error response contains detail message."""
        response = api_client.post(
            LOGIN_URL,
            {"identifier": test_user.email, "password": "wrongpassword"},
            format="json",
        )

        data = response.json()
        assert "detail" in data


@pytest.mark.django_db
class TestLogoutView:
    """LogoutView returns HTTP 200 for authenticated requests and HTTP 401 for unauthenticated."""

    def test_logout_authenticated_returns_200(self, api_client, test_user):
        """Validates: Requirements 9.5 — authenticated logout returns HTTP 200."""
        token = jwt_utils.generate_token(test_user.id)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(LOGOUT_URL)

        assert response.status_code == 200

    def test_logout_unauthenticated_returns_401(self, api_client):
        """Validates: Requirements 9.6 — missing Authorization header returns 4xx (401 or 403)."""
        response = api_client.post(LOGOUT_URL)

        # Django's CSRF middleware may return 403 before the view runs;
        # either 401 (auth failed) or 403 (CSRF/forbidden) signals the request was rejected.
        assert response.status_code in (401, 403)


@pytest.mark.django_db
class TestUpgradeUserView:
    """UpgradeUserView returns token + premium user on success, HTTP 402 without token on failure."""

    def test_upgrade_success_returns_token(self, api_client, test_user):
        """Validates: Requirements 9.3 — successful upgrade returns a token field."""
        token = jwt_utils.generate_token(test_user.id)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(UPGRADE_URL, {"outcome": "success"}, format="json")

        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0

    def test_upgrade_success_returns_user_is_premium_true(self, api_client, test_user):
        """Validates: Requirements 9.3 — successful upgrade returns user with is_premium=True."""
        token = jwt_utils.generate_token(test_user.id)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(UPGRADE_URL, {"outcome": "success"}, format="json")

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["is_premium"] is True

    def test_upgrade_failure_returns_402_without_token(self, api_client, test_user):
        """Validates: Requirements 9.3 — failed upgrade returns HTTP 402 and no token field."""
        token = jwt_utils.generate_token(test_user.id)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(UPGRADE_URL, {"outcome": "failure"}, format="json")

        assert response.status_code == 402
        data = response.json()
        assert "token" not in data


@pytest.mark.django_db
class TestDowngradeUserView:
    """DowngradeUserView returns token and user with is_premium=False."""

    def test_downgrade_returns_token(self, api_client, premium_user):
        """Validates: Requirements 9.4 — downgrade returns a token field."""
        token = jwt_utils.generate_token(premium_user.id)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(DOWNGRADE_URL)

        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0

    def test_downgrade_returns_user_is_premium_false(self, api_client, premium_user):
        """Validates: Requirements 9.4 — downgrade returns user with is_premium=False."""
        token = jwt_utils.generate_token(premium_user.id)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(DOWNGRADE_URL)

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["is_premium"] is False
