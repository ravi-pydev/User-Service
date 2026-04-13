from django.contrib import admin
from django.urls import path

from apps.registration.api import controller as user_controller 

user_urlpatterns = [
    path('home/', user_controller.Home.as_view()),
]