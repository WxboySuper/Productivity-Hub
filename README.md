# Productivity Hub

A personal productivity assistant to help you track tasks, manage projects, schedule work, and integrate with your favorite tools.

## Tech Stack

- **Frontend:** React (TypeScript), Tailwind CSS
- **Backend:** Python (Flask)
- **Database:** SQLite (easy to set up, can migrate to Postgres later)
- **Authentication:** Flask (Flask-Login for basic auth, Flask-Dance/Authlib for social login like Google/Discord)
- **Integrations:** Google Drive/Docs (highest priority), Alexa (next priority), Discord (planned)
- **Deployment:** Hostinger VPS (Linux)

## Getting Started

### Prerequisites
- Node.js (for frontend)
- Python 3.9+ (for backend)
- SQLite (default, comes with Python)

### Setup

1. **Clone the repository**
2. **Frontend:**
   - `cd frontend`
   - `npm install`
   - `npm run dev`
3. **Backend:**
   - `cd backend`
   - `python -m venv venv && source venv/bin/activate` (Linux/macOS)
   - `venv\Scripts\activate` (Windows)
   - `pip install -r requirements.txt`
   - `python app.py`

### Deployment
- See `DEPLOYMENT.md` for VPS deployment instructions (to be created).

## Roadmap
See [ROADMAP.md](./ROADMAP.md) for a step-by-step development checklist.

## Features
See [FEATURES.md](./FEATURES.md) for a high-level feature list.

## License
MIT

---

## Authentication API

### Register

POST `/api/register`
```json
{
  "username": "yourname",
  "email": "your@email.com",
  "password": "StrongPassword123!"
}
```

### Login

POST `/api/login`
```json
{
  "username": "yourname",
  "password": "StrongPassword123!"
}
```
or
```json
{
  "email": "your@email.com",
  "password": "StrongPassword123!"
}
```

### Logout

POST `/api/logout`

Clears the session and logs the user out.

---

**Note:** All endpoints require `Content-Type: application/json`.
