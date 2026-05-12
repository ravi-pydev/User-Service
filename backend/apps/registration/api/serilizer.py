from django.contrib.auth.hashers import make_password
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
            "thumbnail_url",
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


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for partial user profile updates (username, email)."""

    class Meta:
        model = User
        fields = ("username", "email")

    def validate_username(self, value):
        qs = User.objects.filter(username=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        qs = User.objects.filter(email=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This email is already in use.")
        return value


class SignupSerializer(serializers.ModelSerializer):
    """Serializer for user registration (POST /api/auth/signup/)."""

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={"min_length": "Password must be at least 8 characters."},
    )
    email = serializers.EmailField(max_length=254)

    class Meta:
        model = User
        fields = ("username", "email", "password")
        extra_kwargs = {
            "username": {"max_length": 80},
        }

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data["password_hash"] = make_password(password)
        return User.objects.create(**validated_data)


class LoginSerializer(serializers.Serializer):
    """Serializer for user login (POST /api/auth/login/).
    Accepts either email or username in the 'identifier' field.
    """

    identifier = serializers.CharField(required=True, max_length=254)
    password = serializers.CharField(required=True)


class FormSubmissionSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source="template.name", read_only=True)
    template_type = serializers.CharField(source="template.template_type", read_only=True)

    class Meta:
        model = FormSubmission
        fields = ("id", "template", "template_name", "template_type", "user", "form_data", "created_at")
        read_only_fields = ("id", "user", "created_at", "template_name", "template_type")
