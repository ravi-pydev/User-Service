from django.db import models


class Template(models.Model):
    CATEGORY_BASIC = "basic"
    CATEGORY_PREMIUM = "premium"
    CATEGORY_CHOICES = [
        (CATEGORY_BASIC, "Basic"),
        (CATEGORY_PREMIUM, "Premium"),
    ]

    name = models.CharField(max_length=120)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    template_type = models.CharField(max_length=80)
    description = models.TextField()
    thumbnail = models.CharField(max_length=16, blank=True)
    is_premium = models.BooleanField(default=False)
    schema = models.JSONField(default=dict)
    accent_color = models.CharField(max_length=32, default="#1d4ed8")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["is_premium", "name"]

    def __str__(self):
        return self.name


class User(models.Model):
    username = models.CharField(max_length=80, unique=True)
    email = models.EmailField(unique=True)
    is_premium = models.BooleanField(default=False)
    favorite_templates = models.ManyToManyField(
        Template,
        blank=True,
        related_name="favorited_by_users",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["username"]

    def __str__(self):
        return self.username


class RecentlyUsedTemplate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recent_templates")
    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name="recent_usages",
    )
    used_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "template")
        ordering = ["-used_at"]

    def __str__(self):
        return f"{self.user.username} -> {self.template.name}"


class FormSubmission(models.Model):
    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="submissions")
    form_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Submission #{self.pk} for {self.template.name}"
