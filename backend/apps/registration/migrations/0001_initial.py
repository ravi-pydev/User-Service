from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Template",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("category", models.CharField(choices=[("basic", "Basic"), ("premium", "Premium")], max_length=20)),
                ("template_type", models.CharField(max_length=80)),
                ("description", models.TextField()),
                ("thumbnail", models.CharField(blank=True, max_length=16)),
                ("is_premium", models.BooleanField(default=False)),
                ("schema", models.JSONField(default=dict)),
                ("accent_color", models.CharField(default="#1d4ed8", max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["is_premium", "name"]},
        ),
        migrations.CreateModel(
            name="User",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("username", models.CharField(max_length=80, unique=True)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("is_premium", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("favorite_templates", models.ManyToManyField(blank=True, related_name="favorited_by_users", to="registration.template")),
            ],
            options={"ordering": ["username"]},
        ),
        migrations.CreateModel(
            name="FormSubmission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("form_data", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("template", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="submissions", to="registration.template")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="submissions", to="registration.user")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="RecentlyUsedTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("used_at", models.DateTimeField(auto_now=True)),
                ("template", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="recent_usages", to="registration.template")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="recent_templates", to="registration.user")),
            ],
            options={"ordering": ["-used_at"], "unique_together": {("user", "template")}},
        ),
    ]
