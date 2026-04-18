from django.urls import path
from apps.registration.api import controller

api_urlpatterns = [
    path('api/', controller.MarketplaceHome.as_view(), name='api-home'),
    path('api/hello/', controller.HelloWorldView.as_view(), name='hello-world'),
    path('api/user/', controller.CurrentUserView.as_view(), name='current-user'),
    path('api/templates/', controller.TemplateListView.as_view(), name='template-list'),
    path('api/templates/<int:template_id>/', controller.TemplateDetailView.as_view(), name='template-detail'),
    path('api/templates/<int:template_id>/use/', controller.UseTemplateView.as_view(), name='template-use'),
    path('api/templates/<int:template_id>/favorite/', controller.ToggleFavoriteView.as_view(), name='template-favorite'),
    path('api/templates/<int:template_id>/submit/', controller.SubmitFormView.as_view(), name='template-submit'),
    path('api/user/upgrade/', controller.UpgradeUserView.as_view(), name='user-upgrade'),
]
