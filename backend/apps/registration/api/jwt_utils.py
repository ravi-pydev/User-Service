"""
JWT utility functions for user authentication.

Provides generate_token() and decode_token() using HS256 algorithm.
The JWT secret is read from the JWT_SECRET environment variable,
falling back to Django's SECRET_KEY in development.
"""

import os
import time

import jwt
from django.conf import settings


def _get_secret() -> str:
    """Return the JWT signing secret."""
    return os.environ.get("JWT_SECRET", settings.SECRET_KEY)


def generate_token(user_id: int) -> str:
    """
    Create a signed JWT for the given user_id.

    Claims:
        user_id (int): The database PK of the user.
        iat (int): Issued-at Unix timestamp.
        exp (int): Expiry Unix timestamp (iat + 86400 seconds / 24 hours).

    Returns:
        str: Encoded JWT string.
    """
    iat = int(time.time())
    payload = {
        "user_id": user_id,
        "iat": iat,
        "exp": iat + 86400,
    }
    return jwt.encode(payload, _get_secret(), algorithm="HS256")


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT.

    Args:
        token (str): The encoded JWT string.

    Returns:
        dict: The decoded payload containing user_id, iat, and exp.

    Raises:
        jwt.ExpiredSignatureError: If the token has expired.
        jwt.InvalidTokenError: If the token is invalid for any other reason.
    """
    return jwt.decode(token, _get_secret(), algorithms=["HS256"])
