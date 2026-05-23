from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("registration", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="template",
            name="thumbnail_url",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
