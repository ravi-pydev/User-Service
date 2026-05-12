from rest_framework.exceptions import AuthenticationFailed
from apps.registration.models import User
from apps.registration.api.jwt_utils import decode_token


def get_authenticated_user(request) -> User:
    """
    Extract and validate JWT from Authorization header.
    Returns the User instance on success.
    Raises AuthenticationFailed (→ HTTP 401) on failure.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise AuthenticationFailed("Authentication credentials were not provided.")
    token = auth_header[len("Bearer "):]
    try:
        payload = decode_token(token)
    except Exception:
        raise AuthenticationFailed("Invalid or expired token.")
    try:
        return User.objects.get(pk=payload["user_id"])
    except User.DoesNotExist:
        raise AuthenticationFailed("User not found.")
