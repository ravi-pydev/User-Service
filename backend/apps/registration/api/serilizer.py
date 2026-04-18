from rest_framework import serializers

from apps.registration.models import FormSubmission, Template, User


class TemplateListSerializer(serializers.ModelSerializer):
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = (
            "id",
            "name",
            "category",
            "template_type",
            "description",
            "thumbnail",
            "is_premium",
            "accent_color",
            "is_favorite",
        )

    def get_is_favorite(self, obj):
        user = self.context.get("user")
        return bool(user and user.favorite_templates.filter(pk=obj.pk).exists())


class TemplateDetailSerializer(TemplateListSerializer):
    class Meta(TemplateListSerializer.Meta):
        fields = TemplateListSerializer.Meta.fields + ("schema",)


class UserSerializer(serializers.ModelSerializer):
    favorites_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "is_premium", "favorites_count")

    def get_favorites_count(self, obj):
        return obj.favorite_templates.count()


class FormSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormSubmission
        fields = ("id", "template", "user", "form_data", "created_at")
