"""
Unit tests for the get_authenticated_user() helper.

Requirements: 3.1, 3.2, 3.3
"""

import pytest
from unittest.mock import MagicMock
from rest_framework.exceptions import AuthenticationFailed

from apps.registration.api.authentication import get_authenticated_user
from apps.registration.api.jwt_utils import generate_token
from apps.registration.models import User


def _make_request(auth_header=None):
    """Build a minimal mock request with the given Authorization header value."""
    request = MagicMock()
    headers = {}
    if auth_header is not None:
        headers["Authorization"] = auth_header
    request.headers = headers
    return request


@pytest.mark.django_db
class TestGetAuthenticatedUserSuccess:
    """get_authenticated_user() returns the correct User for a valid token."""

    def test_returns_correct_user(self):
        """Validates: Requirements 3.1 — valid JWT resolves to the matching User."""
        user = User.objects.create(username="alice", email="alice@example.com")
        token = generate_token(user.pk)
        request = _make_request(auth_header=f"Bearer {token}")

        result = get_authenticated_user(request)

        assert result.pk == user.pk
        assert result.username == "alice"
        assert result.email == "alice@example.com"


@pytest.mark.django_db
class TestGetAuthenticatedUserMissingHeader:
    """get_authenticated_user() raises AuthenticationFailed when the header is absent."""

    def test_raises_when_authorization_header_missing(self):
        """Validates: Requirements 3.3 — no Authorization header → 401."""
        request = _make_request()  # no Authorization header

        with pytest.raises(AuthenticationFailed):
            get_authenticated_user(request)

    def test_raises_when_authorization_header_empty(self):
        """Validates: Requirements 3.3 — empty Authorization header → 401."""
        request = _make_request(auth_header="")

        with pytest.raises(AuthenticationFailed):
            get_authenticated_user(request)

    def test_error_message_for_missing_header(self):
        """Error detail should indicate missing credentials."""
        request = _make_request()

        with pytest.raises(AuthenticationFailed) as exc_info:
            get_authenticated_user(request)

        assert "not provided" in str(exc_info.value.detail).lower()


@pytest.mark.django_db
class TestGetAuthenticatedUserInvalidTokenFormat:
    """get_authenticated_user() raises AuthenticationFailed for malformed tokens."""

    def test_raises_for_random_string_token(self):
        """Validates: Requirements 3.2 — invalid token string → 401."""
        request = _make_request(auth_header="Bearer notavalidtoken")

        with pytest.raises(AuthenticationFailed):
            get_authenticated_user(request)

    def test_raises_for_missing_bearer_prefix(self):
        """Validates: Requirements 3.2 — header without 'Bearer ' prefix → 401."""
        user = User.objects.create(username="bob", email="bob@example.com")
        token = generate_token(user.pk)
        # Provide the token without the required "Bearer " prefix
        request = _make_request(auth_header=token)

        with pytest.raises(AuthenticationFailed):
            get_authenticated_user(request)

    def test_raises_for_tampered_token(self):
        """Validates: Requirements 3.2 — tampered JWT → 401."""
        user = User.objects.create(username="carol", email="carol@example.com")
        token = generate_token(user.pk)
        # Corrupt the signature portion of the JWT
        tampered = token[:-4] + "XXXX"
        request = _make_request(auth_header=f"Bearer {tampered}")

        with pytest.raises(AuthenticationFailed):
            get_authenticated_user(request)

    def test_raises_for_empty_bearer_value(self):
        """Validates: Requirements 3.2 — 'Bearer ' with no token value → 401."""
        request = _make_request(auth_header="Bearer ")

        with pytest.raises(AuthenticationFailed):
            get_authenticated_user(request)

    def test_error_message_for_invalid_token(self):
        """Error detail should indicate invalid or expired token."""
        request = _make_request(auth_header="Bearer garbage.token.value")

        with pytest.raises(AuthenticationFailed) as exc_info:
            get_authenticated_user(request)

        assert "invalid" in str(exc_info.value.detail).lower() or "expired" in str(exc_info.value.detail).lower()


@pytest.mark.django_db
class TestGetAuthenticatedUserNonExistentUser:
    """get_authenticated_user() raises AuthenticationFailed when user_id is not in DB."""

    def test_raises_when_user_does_not_exist(self):
        """Validates: Requirements 3.1 — token with unknown user_id → 401."""
        # Generate a token for a user_id that will never be created
        non_existent_user_id = 999999
        token = generate_token(non_existent_user_id)
        request = _make_request(auth_header=f"Bearer {token}")

        with pytest.raises(AuthenticationFailed):
            get_authenticated_user(request)

    def test_error_message_for_missing_user(self):
        """Error detail should indicate user not found."""
        non_existent_user_id = 999998
        token = generate_token(non_existent_user_id)
        request = _make_request(auth_header=f"Bearer {token}")

        with pytest.raises(AuthenticationFailed) as exc_info:
            get_authenticated_user(request)

        assert "not found" in str(exc_info.value.detail).lower()

    def test_raises_after_user_deleted(self):
        """Token for a deleted user should raise AuthenticationFailed."""
        user = User.objects.create(username="dave", email="dave@example.com")
        token = generate_token(user.pk)
        user.delete()

        request = _make_request(auth_header=f"Bearer {token}")

        with pytest.raises(AuthenticationFailed):
            get_authenticated_user(request)
