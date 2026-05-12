from django.urls import path
from apps.registration.api import controller

api_urlpatterns = [
    # ── Utility ───────────────────────────────────────────────────────────
    path('api/', controller.MarketplaceHome.as_view(), name='api-home'),
    path('api/hello/', controller.HelloWorldView.as_view(), name='hello-world'),

    # ── Auth ──────────────────────────────────────────────────────────────
    path('api/auth/signup/', controller.SignupView.as_view(), name='auth-signup'),
    path('api/auth/login/', controller.LoginView.as_view(), name='auth-login'),

    # ── User ──────────────────────────────────────────────────────────────
    path('api/user/', controller.CurrentUserView.as_view(), name='current-user'),
    path('api/user/upgrade/', controller.UpgradeUserView.as_view(), name='user-upgrade'),
    path('api/user/downgrade/', controller.DowngradeUserView.as_view(), name='user-downgrade'),
    path('api/user/favorites/', controller.FavoriteListView.as_view(), name='user-favorites'),
    path('api/user/recent/', controller.RecentlyUsedView.as_view(), name='user-recent'),

    # ── Templates ─────────────────────────────────────────────────────────
    path('api/templates/', controller.TemplateListView.as_view(), name='template-list'),
    path('api/templates/<int:template_id>/', controller.TemplateDetailView.as_view(), name='template-detail'),
    path('api/templates/<int:template_id>/use/', controller.UseTemplateView.as_view(), name='template-use'),
    path('api/templates/<int:template_id>/favorite/', controller.ToggleFavoriteView.as_view(), name='template-favorite'),
    path('api/templates/<int:template_id>/submit/', controller.SubmitFormView.as_view(), name='template-submit'),
    path('api/templates/<int:template_id>/submissions/', controller.TemplateSubmissionsView.as_view(), name='template-submissions'),

    # ── Submissions ───────────────────────────────────────────────────────
    path('api/submissions/', controller.SubmissionListView.as_view(), name='submission-list'),
    path('api/submissions/<int:submission_id>/', controller.SubmissionDetailView.as_view(), name='submission-detail'),
]
