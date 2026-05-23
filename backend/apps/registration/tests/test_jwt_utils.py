"""
Unit tests for JWT utility functions.

Tests cover:
- generate_token() creates a valid JWT with correct claims structure
- decode_token() successfully decodes valid tokens
- decode_token() raises jwt.ExpiredSignatureError for expired tokens
- decode_token() raises jwt.InvalidTokenError for tampered tokens

Requirements: 2.5
"""

import time

import jwt
import pytest

from apps.registration.api.jwt_utils import decode_token, generate_token


@pytest.mark.django_db
class TestGenerateToken:
    """Tests for generate_token()."""

    def test_returns_string(self):
        """generate_token() should return a non-empty string."""
        token = generate_token(user_id=1)
        assert isinstance(token, str)
        assert len(token) > 0

    def test_token_is_valid_jwt(self):
        """generate_token() should produce a decodable JWT."""
        token = generate_token(user_id=42)
        payload = decode_token(token)
        assert payload is not None

    def test_token_contains_user_id_claim(self):
        """generate_token() should embed user_id in the payload."""
        user_id = 99
        token = generate_token(user_id=user_id)
        payload = decode_token(token)
        assert payload["user_id"] == user_id

    def test_token_contains_iat_claim(self):
        """generate_token() should include an issued-at (iat) timestamp."""
        before = int(time.time())
        token = generate_token(user_id=1)
        after = int(time.time())
        payload = decode_token(token)
        assert "iat" in payload
        assert before <= payload["iat"] <= after

    def test_token_contains_exp_claim(self):
        """generate_token() should include an expiry (exp) timestamp."""
        token = generate_token(user_id=1)
        payload = decode_token(token)
        assert "exp" in payload

    def test_token_expiry_is_24_hours_after_iat(self):
        """generate_token() should set exp exactly 86400 seconds after iat."""
        token = generate_token(user_id=1)
        payload = decode_token(token)
        assert payload["exp"] - payload["iat"] == 86400

    def test_different_user_ids_produce_different_tokens(self):
        """generate_token() should produce distinct tokens for different user IDs."""
        token_a = generate_token(user_id=1)
        token_b = generate_token(user_id=2)
        assert token_a != token_b

    def test_claims_structure_has_six_keys(self):
        """JWT payload should contain exactly user_id, username, email, is_premium, iat, and exp."""
        token = generate_token(user_id=7)
        payload = decode_token(token)
        assert set(payload.keys()) == {"user_id", "username", "email", "is_premium", "iat", "exp"}


@pytest.mark.django_db
class TestDecodeToken:
    """Tests for decode_token()."""

    def test_decodes_valid_token(self):
        """decode_token() should return the original payload for a valid token."""
        user_id = 55
        token = generate_token(user_id=user_id)
        payload = decode_token(token)
        assert payload["user_id"] == user_id

    def test_raises_expired_signature_error_for_expired_token(self):
        """decode_token() should raise jwt.ExpiredSignatureError for an expired token."""
        from django.conf import settings

        iat = int(time.time()) - 90000  # issued 25 hours ago
        expired_payload = {
            "user_id": 1,
            "iat": iat,
            "exp": iat + 86400,  # expired 1 hour ago
        }
        import os

        secret = os.environ.get("JWT_SECRET", settings.SECRET_KEY)
        expired_token = jwt.encode(expired_payload, secret, algorithm="HS256")

        with pytest.raises(jwt.ExpiredSignatureError):
            decode_token(expired_token)

    def test_raises_invalid_token_error_for_tampered_signature(self):
        """decode_token() should raise jwt.InvalidTokenError when the signature is tampered."""
        token = generate_token(user_id=1)
        # Corrupt the signature by appending extra characters
        tampered_token = token + "tampered"

        with pytest.raises(jwt.InvalidTokenError):
            decode_token(tampered_token)

    def test_raises_invalid_token_error_for_wrong_secret(self):
        """decode_token() should raise jwt.InvalidTokenError when signed with a different secret."""
        payload = {
            "user_id": 1,
            "iat": int(time.time()),
            "exp": int(time.time()) + 86400,
        }
        wrong_secret_token = jwt.encode(payload, "wrong-secret", algorithm="HS256")

        with pytest.raises(jwt.InvalidTokenError):
            decode_token(wrong_secret_token)

    def test_raises_invalid_token_error_for_random_string(self):
        """decode_token() should raise jwt.InvalidTokenError for a non-JWT string."""
        with pytest.raises(jwt.InvalidTokenError):
            decode_token("not.a.jwt")

    def test_raises_invalid_token_error_for_empty_string(self):
        """decode_token() should raise jwt.InvalidTokenError for an empty string."""
        with pytest.raises(jwt.InvalidTokenError):
            decode_token("")

    def test_raises_invalid_token_error_for_tampered_payload(self):
        """decode_token() should raise jwt.InvalidTokenError when the payload is modified."""
        import base64
        import json

        token = generate_token(user_id=1)
        # Split the JWT into its three parts
        header, payload_b64, signature = token.split(".")

        # Decode, modify, and re-encode the payload (without re-signing)
        # Pad the base64 string to a multiple of 4
        padded = payload_b64 + "=" * (4 - len(payload_b64) % 4)
        original_payload = json.loads(base64.urlsafe_b64decode(padded))
        original_payload["user_id"] = 9999  # tamper with user_id

        tampered_payload_b64 = (
            base64.urlsafe_b64encode(json.dumps(original_payload).encode())
            .rstrip(b"=")
            .decode()
        )
        tampered_token = f"{header}.{tampered_payload_b64}.{signature}"

        with pytest.raises(jwt.InvalidTokenError):
            decode_token(tampered_token)
