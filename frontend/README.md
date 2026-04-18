# Frontend — FormForge UI

Pure static HTML/CSS/JS. No build step required.

## Setup

1. Make sure the backend is running at `http://localhost:8000`
2. Open `index.html` in a browser, or serve it with any static file server:

```bash
# Using Python
python3 -m http.server 3000

# Using Node (npx)
npx serve .
```

Then open `http://localhost:3000`.

## Configuration

The backend URL is set at the top of `static/app.js`:

```js
const API_BASE = "http://localhost:8000";
```

Change this if your backend runs on a different host or port.

## Structure

```
frontend/
  index.html        # Main app shell
  static/
    app.css         # Styles
    app.js          # All client-side logic
```
