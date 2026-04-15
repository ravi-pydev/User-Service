from django.shortcuts import redirect, render
from rest_framework.views import APIView


class Home(APIView):
    """
    Redirect the registration landing page to the first step.
    """

    def get(self, request):
        return redirect("registration-step", step=1)


class RegistrationStepView(APIView):
    """
    Render an individual registration step page.
    """

    step_config = {
        1: {"template": "step1.html", "title": "Personal Details"},
        2: {"template": "step2.html", "title": "Address Details"},
        3: {"template": "step3.html", "title": "Education Details"},
        4: {"template": "step4.html", "title": "Job Preferences"},
        5: {"template": "step5.html", "title": "Document Upload"},
        6: {"template": "step6.html", "title": "Registration Fee Payment"},
    }

    steps = [
        {"number": 1, "label": "Personal", "tooltip": "Go to Personal"},
        {"number": 2, "label": "Address", "tooltip": "Go to Address"},
        {"number": 3, "label": "Education", "tooltip": "Go to Education"},
        {"number": 4, "label": "Preferences", "tooltip": "Go to Preferences"},
        {"number": 5, "label": "Documents", "tooltip": "Go to Documents"},
        {"number": 6, "label": "Payment", "tooltip": "Go to Payment"},
    ]

    def get(self, request, step):
        if step not in self.step_config:
            return redirect("registration-step", step=1)

        context = {
            "current_step": step,
            "steps": self.steps,
            "page_title": self.step_config[step]["title"],
            "prev_step": step - 1 if step > 1 else None,
            "next_step": step + 1 if step < len(self.steps) else None,
        }
        return render(request, self.step_config[step]["template"], context)


class RegistrationSuccessView(APIView):
    """
    Render the demo success screen.
    """

    def get(self, request):
        return render(request, "success.html", {"page_title": "Application Submitted"})
