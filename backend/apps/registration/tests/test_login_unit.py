"""
Unit tests for missing required fields on the login endpoint.

Requirements: 2.4
"""

import json
import pytest
from django.test import Client

LOGIN_URL = "/api/auth/login/"


@pytest.mark.django_db
class TestLoginMissingEmail:
    """POST /api/auth/login/ without 'email' returns HTTP 400 with an email field error."""

    def test_missing_email_returns_400(self):
        """Validates: Requirements 2.4 — missing email field → HTTP 400."""
        client = Client()
        payload = {"password": "securepass123"}

        response = client.post(
            LOGIN_URL,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_missing_email_error_identifies_field(self):
        """Validates: Requirements 2.4 — error response body contains 'email' key."""
        client = Client()
        payload = {"password": "securepass123"}

        response = client.post(
            LOGIN_URL,
            data=json.dumps(payload),
            content_type="application/json",
        )

        data = response.json()
        assert "email" in data


@pytest.mark.django_db
class TestLoginMissingPassword:
    """POST /api/auth/login/ without 'password' returns HTTP 400 with a password field error."""

    def test_missing_password_returns_400(self):
        """Validates: Requirements 2.4 — missing password field → HTTP 400."""
        client = Client()
        payload = {"email": "user@example.com"}

        response = client.post(
            LOGIN_URL,
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_missing_password_error_identifies_field(self):
        """Validates: Requirements 2.4 — error response body contains 'password' key."""
        client = Client()
        payload = {"email": "user@example.com"}

        response = client.post(
            LOGIN_URL,
            data=json.dumps(payload),
            content_type="application/json",
        )

        data = response.json()
        assert "password" in data
