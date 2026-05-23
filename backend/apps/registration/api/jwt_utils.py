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
        username (str): The user's username.
        email (str): The user's email.
        is_premium (bool): Whether the user has a premium account.
        iat (int): Issued-at Unix timestamp.
        exp (int): Expiry Unix timestamp (iat + 86400 seconds / 24 hours).

    Returns:
        str: Encoded JWT string.
    """
    from apps.registration.models import User as UserModel
    iat = int(time.time())
    try:
        user = UserModel.objects.get(pk=user_id)
        username = user.username
        email = user.email
        is_premium = user.is_premium
    except Exception:
        username = ''
        email = ''
        is_premium = False

    payload = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "is_premium": is_premium,
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
