from django.contrib import admin
from django.urls import path

from apps.registration.api import controller as user_controller 

user_urlpatterns = [
    path('api/hello/', user_controller.HelloWorldView.as_view(), name='hello-world'),
    path('home/', user_controller.Home.as_view(), name='registration-home'),
    path('home/step/<int:step>/', user_controller.RegistrationStepView.as_view(), name='registration-step'),
    path('home/success/', user_controller.RegistrationSuccessView.as_view(), name='registration-success'),
]
