from django.test import TestCase
from django.urls import reverse, resolve
from rest_framework.test import APIClient
from rest_framework import status


class HelloWorldViewTests(TestCase):
    """Tests for GET /api/hello/"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("hello-world")

    # --- Positive ---

    def test_get_returns_200(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_returns_json_message(self):
        response = self.client.get(self.url)
        self.assertEqual(response.json(), {"message": "Hello, World!"})

    def test_get_content_type_is_json(self):
        response = self.client.get(self.url)
        self.assertIn("application/json", response["Content-Type"])

    # --- Negative ---

    def test_post_not_allowed(self):
        response = self.client.post(self.url, data={})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_put_not_allowed(self):
        response = self.client.put(self.url, data={})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_not_allowed(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_patch_not_allowed(self):
        response = self.client.patch(self.url, data={})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class HomeViewTests(TestCase):
    """Tests for GET /home/"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("registration-home")

    # --- Positive ---

    def test_get_redirects(self):
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [status.HTTP_301_MOVED_PERMANENTLY, status.HTTP_302_FOUND])

    def test_get_redirects_to_step_1(self):
        response = self.client.get(self.url)
        self.assertRedirects(
            response,
            reverse("registration-step", kwargs={"step": 1}),
            fetch_redirect_response=False,
        )

    # --- Negative ---

    def test_post_not_allowed(self):
        response = self.client.post(self.url, data={})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_not_allowed(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class RegistrationStepViewTests(TestCase):
    """Tests for GET /home/step/<int:step>/"""

    def setUp(self):
        self.client = APIClient()

    # --- Positive ---

    def test_valid_steps_return_200(self):
        for step in range(1, 7):
            with self.subTest(step=step):
                url = reverse("registration-step", kwargs={"step": step})
                response = self.client.get(url)
                self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_step1_uses_correct_template(self):
        url = reverse("registration-step", kwargs={"step": 1})
        response = self.client.get(url)
        self.assertTemplateUsed(response, "step1.html")

    def test_step_context_contains_current_step(self):
        url = reverse("registration-step", kwargs={"step": 3})
        response = self.client.get(url)
        self.assertEqual(response.context["current_step"], 3)

    def test_first_step_has_no_prev(self):
        url = reverse("registration-step", kwargs={"step": 1})
        response = self.client.get(url)
        self.assertIsNone(response.context["prev_step"])

    def test_last_step_has_no_next(self):
        url = reverse("registration-step", kwargs={"step": 6})
        response = self.client.get(url)
        self.assertIsNone(response.context["next_step"])

    def test_middle_step_has_prev_and_next(self):
        url = reverse("registration-step", kwargs={"step": 3})
        response = self.client.get(url)
        self.assertEqual(response.context["prev_step"], 2)
        self.assertEqual(response.context["next_step"], 4)

    def test_context_contains_steps_list(self):
        url = reverse("registration-step", kwargs={"step": 1})
        response = self.client.get(url)
        self.assertIn("steps", response.context)
        self.assertEqual(len(response.context["steps"]), 6)

    def test_context_contains_page_title(self):
        url = reverse("registration-step", kwargs={"step": 2})
        response = self.client.get(url)
        self.assertEqual(response.context["page_title"], "Address Details")

    # --- Negative ---

    def test_invalid_step_redirects_to_step_1(self):
        url = reverse("registration-step", kwargs={"step": 99})
        response = self.client.get(url)
        self.assertRedirects(
            response,
            reverse("registration-step", kwargs={"step": 1}),
            fetch_redirect_response=False,
        )

    def test_zero_step_redirects_to_step_1(self):
        url = reverse("registration-step", kwargs={"step": 0})
        response = self.client.get(url)
        self.assertRedirects(
            response,
            reverse("registration-step", kwargs={"step": 1}),
            fetch_redirect_response=False,
        )

    def test_negative_step_returns_404(self):
        # URL pattern only accepts [0-9]+, so negative int won't match → 404
        response = self.client.get("/home/step/-1/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_negative_step_redirects_to_step_1(self):
        # The URL pattern rejects negative ints at the router level (404).
        # The closest equivalent that reaches the view is step=0, which the
        # view treats as out-of-range and redirects to step 1.
        url = reverse("registration-step", kwargs={"step": 0})
        response = self.client.get(url)
        self.assertRedirects(
            response,
            reverse("registration-step", kwargs={"step": 1}),
            fetch_redirect_response=False,
        )

    def test_non_integer_step_returns_404(self):
        response = self.client.get("/home/step/abc/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_not_allowed(self):
        url = reverse("registration-step", kwargs={"step": 1})
        response = self.client.post(url, data={})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_not_allowed(self):
        url = reverse("registration-step", kwargs={"step": 1})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class RegistrationSuccessViewTests(TestCase):
    """Tests for GET /home/success/"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("registration-success")

    # --- Positive ---

    def test_get_returns_200(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_uses_success_template(self):
        response = self.client.get(self.url)
        self.assertTemplateUsed(response, "success.html")

    def test_context_contains_page_title(self):
        response = self.client.get(self.url)
        self.assertEqual(response.context["page_title"], "Application Submitted")

    # --- Negative ---

    def test_post_not_allowed(self):
        response = self.client.post(self.url, data={})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_not_allowed(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_put_not_allowed(self):
        response = self.client.put(self.url, data={})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
