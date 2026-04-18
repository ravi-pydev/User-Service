from django.test import TestCase
from rest_framework.test import APIClient

from apps.registration.models import FormSubmission, Template, User


class RegistrationMarketplaceTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_template_list_is_seeded(self):
        response = self.client.get("/api/templates/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreaterEqual(len(payload["templates"]), 6)
        self.assertIn("recently_used", payload)
        self.assertIn("favorites", payload)

    def test_premium_template_requires_upgrade(self):
        self.client.get("/api/templates/")
        premium_template = Template.objects.filter(is_premium=True).first()

        response = self.client.get(f"/api/templates/{premium_template.pk}/")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["code"], "premium_required")

    def test_upgrade_allows_premium_access(self):
        self.client.get("/api/templates/")
        premium_template = Template.objects.filter(is_premium=True).first()

        upgrade_response = self.client.post("/api/user/upgrade/", {"outcome": "success"}, format="json")
        detail_response = self.client.get(f"/api/templates/{premium_template.pk}/")

        self.assertEqual(upgrade_response.status_code, 200)
        self.assertEqual(detail_response.status_code, 200)
        self.assertTrue(detail_response.json()["is_premium"])

    def test_form_submission_persists_payload(self):
        self.client.get("/api/templates/")
        template = Template.objects.filter(is_premium=False).first()

        response = self.client.post(
            f"/api/templates/{template.pk}/submit/",
            {"form_data": {"full_name": "Test User", "email": "test@example.com"}},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(FormSubmission.objects.count(), 1)
        submission = FormSubmission.objects.first()
        self.assertEqual(submission.template_id, template.pk)
        self.assertEqual(submission.user.username, "demo_user")

    def test_favorites_toggle(self):
        self.client.get("/api/templates/")
        template = Template.objects.first()
        user = User.objects.get(username="demo_user")

        self.client.post(f"/api/templates/{template.pk}/favorite/", {}, format="json")
        user.refresh_from_db()
        self.assertTrue(user.favorite_templates.filter(pk=template.pk).exists())
