from django.contrib import admin

from apps.registration.models import FormSubmission, RecentlyUsedTemplate, Template, User


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "template_type", "category", "is_premium")
    list_filter = ("category", "template_type", "is_premium")
    search_fields = ("name", "description", "template_type")


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "is_premium")
    search_fields = ("username", "email")


@admin.register(FormSubmission)
class FormSubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "template", "user", "created_at")
    search_fields = ("template__name", "user__username")


@admin.register(RecentlyUsedTemplate)
class RecentlyUsedTemplateAdmin(admin.ModelAdmin):
    list_display = ("user", "template", "used_at")
