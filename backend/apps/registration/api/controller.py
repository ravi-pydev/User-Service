import random

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth.hashers import check_password

from apps.registration.api import jwt_utils
from apps.registration.api.authentication import get_authenticated_user
from apps.registration.api.serilizer import (
    FormSubmissionSerializer,
    LoginSerializer,
    SignupSerializer,
    TemplateDetailSerializer,
    TemplateListSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from apps.registration.models import FormSubmission, RecentlyUsedTemplate, Template, User
from apps.registration.template_catalog import seed_templates


def get_optional_user(request):
    """
    Try to authenticate the request. Returns the User on success, or None
    if no token is provided or the token is invalid/expired.
    Unlike get_authenticated_user, this never raises — it just returns None.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[len("Bearer "):]
    try:
        payload = jwt_utils.decode_token(token)
        return User.objects.get(pk=payload["user_id"])
    except Exception:
        return None


@transaction.atomic
def ensure_seed_data():
    """Seed templates exactly once, safely under concurrent requests."""
    if not Template.objects.exists():
        seed_templates()


# ── Utility ───────────────────────────────────────────────────────────────────

class HelloWorldView(APIView):
    """GET /api/hello/ — health check."""

    def get(self, request):
        return Response({"message": "Hello, World!"})


class MarketplaceHome(APIView):
    """GET /api/ — API root."""

    def get(self, request):
        return Response({"message": "Registration template marketplace API"})


# ── Auth ──────────────────────────────────────────────────────────────────────

class LogoutView(APIView):
    """POST /api/auth/logout/ — invalidate session (client-side token drop).
    JWTs are stateless; this endpoint exists for future token blacklisting
    and to give clients a clean logout API to call.
    """

    def post(self, request):
        # Optionally validate the token so only authenticated users can call this
        get_authenticated_user(request)
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


class SignupView(APIView):
    """POST /api/auth/signup/ — create a new user account."""

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"id": user.id, "username": user.username, "email": user.email},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """POST /api/auth/login/ — authenticate and return a JWT.
    Accepts email or username in the 'identifier' field.
    """

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data["identifier"]
        password = serializer.validated_data["password"]

        # Try email first, then username
        user = (
            User.objects.filter(email__iexact=identifier).first()
            or User.objects.filter(username__iexact=identifier).first()
        )

        if user is None or not check_password(password, user.password_hash):
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token = jwt_utils.generate_token(user.id)
        return Response(
            {
                "token": token,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_premium": user.is_premium,
                },
            },
            status=status.HTTP_200_OK,
        )


# ── User ──────────────────────────────────────────────────────────────────────

class CurrentUserView(APIView):
    """
    GET  /api/user/         — return current user profile
    PATCH /api/user/        — update username or email
    """

    def get(self, request):
        ensure_seed_data()
        return Response(UserSerializer(get_authenticated_user(request)).data)

    def patch(self, request):
        ensure_seed_data()
        user = get_authenticated_user(request)
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpgradeUserView(APIView):
    """POST /api/user/upgrade/ — mock premium upgrade."""

    def post(self, request):
        ensure_seed_data()
        user = get_authenticated_user(request)
        desired_outcome = request.data.get("outcome")
        outcome = desired_outcome or random.choice(["success", "failure"])

        if outcome == "success":
            user.is_premium = True
            user.save(update_fields=["is_premium"])
            new_token = jwt_utils.generate_token(user.id)
            return Response(
                {
                    "message": "Premium unlocked successfully",
                    "payment_status": "success",
                    "token": new_token,
                    "user": UserSerializer(user).data,
                }
            )

        return Response(
            {
                "message": "Payment failed. Please try again.",
                "payment_status": "failure",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_402_PAYMENT_REQUIRED,
        )


class DowngradeUserView(APIView):
    """POST /api/user/downgrade/ — revert premium (dev/testing helper)."""

    def post(self, request):
        ensure_seed_data()
        user = get_authenticated_user(request)
        user.is_premium = False
        user.save(update_fields=["is_premium"])
        new_token = jwt_utils.generate_token(user.id)
        return Response(
            {
                "message": "Reverted to free tier.",
                "token": new_token,
                "user": UserSerializer(user).data,
            }
        )


# ── Templates ─────────────────────────────────────────────────────────────────

class TemplateListView(APIView):
    """
    GET /api/templates/
    Query params: category, type, search, layout, field_type, has_required, field_count

    Works for both authenticated and unauthenticated users.
    Logged-out users see all templates but get empty recently_used / favorites.
    """

    def get(self, request):
        ensure_seed_data()
        user = get_optional_user(request)  # None for logged-out visitors
        queryset = Template.objects.all()

        category = request.query_params.get("category")
        template_type = request.query_params.get("type")
        search = request.query_params.get("search")
        layout = request.query_params.get("layout")
        field_type = request.query_params.get("field_type")
        has_required = request.query_params.get("has_required")
        field_count = request.query_params.get("field_count")

        if category in {Template.CATEGORY_BASIC, Template.CATEGORY_PREMIUM}:
            queryset = queryset.filter(category=category)

        if template_type:
            queryset = queryset.filter(template_type__icontains=template_type)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(template_type__icontains=search)
            )

        # JSON-based filters evaluated in Python
        candidates = list(queryset)

        if layout:
            candidates = [t for t in candidates if t.schema.get("layout") == layout]

        if field_type:
            candidates = [
                t for t in candidates
                if any(f.get("type") == field_type for f in t.schema.get("fields", []))
            ]

        if has_required == "true":
            candidates = [
                t for t in candidates
                if any(f.get("required") for f in t.schema.get("fields", []))
            ]

        if field_count:
            def _in_range(t):
                n = len(t.schema.get("fields", []))
                if field_count == "small":
                    return n <= 3
                if field_count == "medium":
                    return 4 <= n <= 6
                if field_count == "large":
                    return n >= 7
                return True
            candidates = [t for t in candidates if _in_range(t)]

        serializer = TemplateListSerializer(candidates, many=True, context={"user": user})

        if user is not None:
            recent_items = RecentlyUsedTemplate.objects.select_related("template").filter(user=user)[:3]
            recent = TemplateListSerializer(
                [item.template for item in recent_items],
                many=True,
                context={"user": user},
            ).data
            favorites = TemplateListSerializer(
                user.favorite_templates.all()[:4],
                many=True,
                context={"user": user},
            ).data
        else:
            recent = []
            favorites = []

        return Response(
            {
                "templates": serializer.data,
                "recently_used": recent,
                "favorites": favorites,
                "available_types": sorted(
                    Template.objects.values_list("template_type", flat=True).distinct()
                ),
            }
        )


class TemplateDetailView(APIView):
    """GET /api/templates/:id/ — full template detail including schema.
    Works for both authenticated and unauthenticated users.
    Unauthenticated users can view free templates; premium templates require auth + premium.
    """

    def get(self, request, template_id):
        ensure_seed_data()
        user = get_optional_user(request)
        template = get_object_or_404(Template, pk=template_id)

        if template.is_premium and (user is None or not user.is_premium):
            return Response(
                {"detail": "Upgrade to Premium", "code": "premium_required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TemplateDetailSerializer(template, context={"user": user})
        return Response(serializer.data)


class UseTemplateView(APIView):
    """POST /api/templates/:id/use/ — open a template in the builder."""

    def post(self, request, template_id):
        ensure_seed_data()
        user = get_authenticated_user(request)
        template = get_object_or_404(Template, pk=template_id)

        if template.is_premium and not user.is_premium:
            return Response(
                {"detail": "Upgrade to Premium", "code": "premium_required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        RecentlyUsedTemplate.objects.update_or_create(
            user=user,
            template=template,
            defaults={},
        )
        serializer = TemplateDetailSerializer(template, context={"user": user})
        return Response(serializer.data)


class ToggleFavoriteView(APIView):
    """
    POST   /api/templates/:id/favorite/ — toggle favorite on/off
    DELETE /api/templates/:id/favorite/ — explicitly remove from favorites
    """

    def post(self, request, template_id):
        ensure_seed_data()
        user = get_authenticated_user(request)
        template = get_object_or_404(Template, pk=template_id)

        if user.favorite_templates.filter(pk=template.pk).exists():
            user.favorite_templates.remove(template)
            is_favorite = False
        else:
            user.favorite_templates.add(template)
            is_favorite = True

        return Response({"is_favorite": is_favorite})

    def delete(self, request, template_id):
        ensure_seed_data()
        user = get_authenticated_user(request)
        template = get_object_or_404(Template, pk=template_id)
        user.favorite_templates.remove(template)
        return Response({"is_favorite": False})


class FavoriteListView(APIView):
    """GET /api/user/favorites/ — list all favorited templates."""

    def get(self, request):
        ensure_seed_data()
        user = get_authenticated_user(request)
        templates = user.favorite_templates.all()
        serializer = TemplateListSerializer(templates, many=True, context={"user": user})
        return Response({"favorites": serializer.data, "count": templates.count()})


# ── Form Submissions ──────────────────────────────────────────────────────────

class SubmitFormView(APIView):
    """POST /api/templates/:id/submit/ — submit a filled form."""

    def post(self, request, template_id):
        ensure_seed_data()
        user = get_authenticated_user(request)
        template = get_object_or_404(Template, pk=template_id)

        if template.is_premium and not user.is_premium:
            return Response(
                {"detail": "Upgrade to Premium", "code": "premium_required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = request.data.get("form_data") or {}
        if not isinstance(payload, dict) or not payload:
            return Response(
                {"detail": "form_data must be a non-empty object"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submission = FormSubmission.objects.create(
            template=template,
            user=user,
            form_data=payload,
        )
        RecentlyUsedTemplate.objects.update_or_create(user=user, template=template, defaults={})

        return Response(
            {
                "message": "Form submitted successfully",
                "submission_id": submission.pk,
            },
            status=status.HTTP_201_CREATED,
        )


class SubmissionListView(APIView):
    """
    GET /api/submissions/
    Returns all submissions for the current user.
    Query params: template_id (optional filter)
    """

    def get(self, request):
        ensure_seed_data()
        user = get_authenticated_user(request)
        queryset = FormSubmission.objects.filter(user=user).select_related("template")

        template_id = request.query_params.get("template_id")
        if template_id:
            queryset = queryset.filter(template_id=template_id)

        serializer = FormSubmissionSerializer(queryset, many=True)
        return Response({"submissions": serializer.data, "count": queryset.count()})


class SubmissionDetailView(APIView):
    """
    GET    /api/submissions/:id/ — retrieve a single submission
    DELETE /api/submissions/:id/ — delete a submission
    """

    def get(self, request, submission_id):
        ensure_seed_data()
        user = get_authenticated_user(request)
        submission = get_object_or_404(FormSubmission, pk=submission_id, user=user)
        return Response(FormSubmissionSerializer(submission).data)

    def delete(self, request, submission_id):
        ensure_seed_data()
        user = get_authenticated_user(request)
        submission = get_object_or_404(FormSubmission, pk=submission_id, user=user)
        submission.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TemplateSubmissionsView(APIView):
    """GET /api/templates/:id/submissions/ — all submissions for a specific template."""

    def get(self, request, template_id):
        ensure_seed_data()
        user = get_authenticated_user(request)
        template = get_object_or_404(Template, pk=template_id)
        submissions = FormSubmission.objects.filter(
            template=template, user=user
        ).select_related("template")
        serializer = FormSubmissionSerializer(submissions, many=True)
        return Response({"submissions": serializer.data, "count": submissions.count()})


# ── Recently Used ─────────────────────────────────────────────────────────────

class RecentlyUsedView(APIView):
    """
    GET    /api/user/recent/     — list recently used templates
    DELETE /api/user/recent/     — clear all recently used
    """

    def get(self, request):
        ensure_seed_data()
        user = get_authenticated_user(request)
        limit = int(request.query_params.get("limit", 10))
        recent_items = (
            RecentlyUsedTemplate.objects
            .select_related("template")
            .filter(user=user)[:limit]
        )
        templates = [item.template for item in recent_items]
        serializer = TemplateListSerializer(templates, many=True, context={"user": user})
        return Response({"recently_used": serializer.data, "count": len(templates)})

    def delete(self, request):
        ensure_seed_data()
        user = get_authenticated_user(request)
        deleted_count, _ = RecentlyUsedTemplate.objects.filter(user=user).delete()
        return Response({"message": f"Cleared {deleted_count} recently used entries."})
