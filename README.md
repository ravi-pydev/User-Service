# User Service

A decoupled web application with a Django REST API backend and a React frontend.

## Project Structure

```
user-service/
├── backend/    # Django REST API
└── frontend/   # React + Vite application
```

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The React app will be available at `http://localhost:5173`.

## Environment Variables

### Frontend

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL for the Django API | `` (empty — uses Vite proxy) |

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` when deploying against a remote backend.

## Development

During local development, the Vite dev server proxies all `/api/*` requests to `http://localhost:8000`, so no CORS configuration is needed in the browser.

## Production

Build the React app:

```bash
cd frontend
npm run build
```

Serve `frontend/dist/` with any static file server (Nginx, S3, Vercel, etc.) and set `VITE_API_BASE_URL` to point at your deployed Django server.
