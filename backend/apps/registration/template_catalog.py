import json
from pathlib import Path

from django.db import transaction

from apps.registration.models import Template


DATA_FILE = Path(__file__).resolve().parent / "data" / "example_templates.json"


def load_template_payloads():
    with DATA_FILE.open(encoding="utf-8") as source:
        return json.load(source)


@transaction.atomic
def seed_templates():
    """Insert seed templates inside a single atomic transaction.

    Wrapping in atomic() means SQLite takes one write lock for the whole
    batch instead of one per update_or_create call, which eliminates the
    window where a second concurrent caller can also enter and cause a lock.
    """
    for payload in load_template_payloads():
        Template.objects.update_or_create(
            name=payload["name"],
            defaults={
                "category": payload["category"],
                "template_type": payload["template_type"],
                "description": payload["description"],
                "thumbnail": payload["thumbnail"],
                "is_premium": payload["is_premium"],
                "schema": payload["schema"],
                "accent_color": payload["accent_color"],
            },
        )
