import random

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.registration.api.serilizer import (
    TemplateDetailSerializer,
    TemplateListSerializer,
    UserSerializer,
)
from apps.registration.models import FormSubmission, RecentlyUsedTemplate, Template, User
from apps.registration.template_catalog import seed_templates


DEMO_USER = {
    "username": "demo_user",
    "email": "demo@example.com",
}


def get_demo_user():
    user, _ = User.objects.get_or_create(
        username=DEMO_USER["username"],
        defaults={"email": DEMO_USER["email"]},
    )
    return user


@transaction.atomic
def ensure_seed_data():
    """Seed templates exactly once, safely under concurrent requests.

    The atomic block acquires a write lock before the existence check so
    only one caller can enter the seeding path at a time.  All others wait
    (up to the DB timeout) and then find the table already populated.
    """
    if not Template.objects.exists():
        seed_templates()


class HelloWorldView(APIView):
    """Returns a simple Hello World JSON response."""

    def get(self, request):
        return Response({"message": "Hello, World!"})


class MarketplaceHome(APIView):
    def get(self, request):
        return Response({"message": "Registration template marketplace API"})


class CurrentUserView(APIView):
    def get(self, request):
        ensure_seed_data()
        return Response(UserSerializer(get_demo_user()).data)


class TemplateListView(APIView):
    def get(self, request):
        ensure_seed_data()
        user = get_demo_user()
        queryset = Template.objects.all()

        category = request.query_params.get("category")
        template_type = request.query_params.get("type")
        search = request.query_params.get("search")

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

        serializer = TemplateListSerializer(queryset, many=True, context={"user": user})
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
    def get(self, request, template_id):
        ensure_seed_data()
        user = get_demo_user()
        template = get_object_or_404(Template, pk=template_id)

        if template.is_premium and not user.is_premium:
            return Response(
                {"detail": "Upgrade to Premium", "code": "premium_required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TemplateDetailSerializer(template, context={"user": user})
        return Response(serializer.data)


class UseTemplateView(APIView):
    def post(self, request, template_id):
        ensure_seed_data()
        user = get_demo_user()
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
    def post(self, request, template_id):
        ensure_seed_data()
        user = get_demo_user()
        template = get_object_or_404(Template, pk=template_id)

        if user.favorite_templates.filter(pk=template.pk).exists():
            user.favorite_templates.remove(template)
            is_favorite = False
        else:
            user.favorite_templates.add(template)
            is_favorite = True

        return Response({"is_favorite": is_favorite})


class SubmitFormView(APIView):
    def post(self, request, template_id):
        ensure_seed_data()
        user = get_demo_user()
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


class UpgradeUserView(APIView):
    def post(self, request):
        ensure_seed_data()
        user = get_demo_user()
        desired_outcome = request.data.get("outcome")
        outcome = desired_outcome or random.choice(["success", "failure"])

        if outcome == "success":
            user.is_premium = True
            user.save(update_fields=["is_premium"])
            return Response(
                {
                    "message": "Premium unlocked successfully",
                    "payment_status": "success",
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
