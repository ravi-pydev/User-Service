"""
Unit tests for missing required fields on the signup endpoint.

Requirements: 1.5
"""

import json
import pytest
from django.test import Client

SIGNUP_URL = "/api/auth/signup/"


@pytest.mark.django_db
class TestSignupMissingUsername:
    """POST /api/auth/signup/ without 'username' returns HTTP 400 with a username field error."""

    def test_missing_username_returns_400(self):
        """Validates: Requirements 1.5 — missing username field → HTTP 400."""
        client = Client()
        payload = {"email": "user@example.com", "password": "securepass123"}

        response = client.post(
            SIGNUP_URL,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_missing_username_error_identifies_field(self):
        """Validates: Requirements 1.5 — error response body contains 'username' key."""
        client = Client()
        payload = {"email": "user@example.com", "password": "securepass123"}

        response = client.post(
            SIGNUP_URL,
            data=json.dumps(payload),
            content_type="application/json",
        )

        data = response.json()
        assert "username" in data


@pytest.mark.django_db
class TestSignupMissingEmail:
    """POST /api/auth/signup/ without 'email' returns HTTP 400 with an email field error."""

    def test_missing_email_returns_400(self):
        """Validates: Requirements 1.5 — missing email field → HTTP 400."""
        client = Client()
        payload = {"username": "testuser", "password": "securepass123"}

        response = client.post(
            SIGNUP_URL,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_missing_email_error_identifies_field(self):
        """Validates: Requirements 1.5 — error response body contains 'email' key."""
        client = Client()
        payload = {"username": "testuser", "password": "securepass123"}

        response = client.post(
            SIGNUP_URL,
            data=json.dumps(payload),
            content_type="application/json",
        )

        data = response.json()
        assert "email" in data


@pytest.mark.django_db
class TestSignupMissingPassword:
    """POST /api/auth/signup/ without 'password' returns HTTP 400 with a password field error."""

    def test_missing_password_returns_400(self):
        """Validates: Requirements 1.5 — missing password field → HTTP 400."""
        client = Client()
        payload = {"username": "testuser", "email": "user@example.com"}

        response = client.post(
            SIGNUP_URL,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_missing_password_error_identifies_field(self):
        """Validates: Requirements 1.5 — error response body contains 'password' key."""
        client = Client()
        payload = {"username": "testuser", "email": "user@example.com"}

        response = client.post(
            SIGNUP_URL,
            data=json.dumps(payload),
            content_type="application/json",
        )

        data = response.json()
        assert "password" in data
