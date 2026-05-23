from django.contrib import admin
from django.urls import path
from apps.registration.urls import api_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),
] + api_urlpatterns
