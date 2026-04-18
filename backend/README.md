# Backend — FormForge API

Django REST Framework API. No HTML rendering — all responses are JSON.

## Setup

```bash
# Activate your virtual environment
source ../../virtual_envs/user-service-venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the server (default port 8000)
python manage.py runserver
```

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/` | API root |
| GET | `/api/hello/` | Hello World |
| GET | `/api/user/` | Current demo user |
| GET | `/api/templates/` | List templates (supports `?search=`, `?category=`, `?type=`) |
| GET | `/api/templates/<id>/` | Template detail |
| POST | `/api/templates/<id>/use/` | Mark template as recently used |
| POST | `/api/templates/<id>/favorite/` | Toggle favorite |
| POST | `/api/templates/<id>/submit/` | Submit form data |
| POST | `/api/user/upgrade/` | Mock premium upgrade |

## Running Tests

```bash
python manage.py test apps.registration --verbosity=2
```
