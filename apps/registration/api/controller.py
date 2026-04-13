# Create your views here.
# import redis
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import render
from rest_framework.views import APIView


class Home(APIView):
    """
    Render the registration landing page.
    """

    def get(self, request):
        return render(request, "registration.html")
