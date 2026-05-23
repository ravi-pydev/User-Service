from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("registration", "0002_template_thumbnail_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="password_hash",
            field=models.CharField(default="", max_length=255),
        ),
    ]
