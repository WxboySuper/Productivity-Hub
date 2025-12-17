# Architecture Overview

This document provides a high-level overview of the Productivity Hub architecture. As the project grows, update this file with diagrams, explanations, and integration details.

## Structure

- **Frontend** (`/frontend`):
  - Built with React (TypeScript) and Tailwind CSS
  - Handles all user interface, routing, and API requests

- **Backend** (`/backend`):
  - Built with Python (Flask)
  - Provides REST API endpoints for all app features
  - Handles authentication, business logic, and database operations

- **Database**:
  - SQLite (development/personal use)
  - Can migrate to PostgreSQL for production/multi-user

- **Integrations**:
  - Google Drive/Docs (highest priority)
  - Alexa (next priority)
  - Discord (planned)

## Data Flow

1. User interacts with the frontend (React UI)
2. Frontend sends API requests to the backend (Flask)
3. Backend processes requests, interacts with the database, and returns responses
4. Integrations are handled by the backend, with results/data sent to the frontend as needed

## Deployment

- Both frontend and backend are deployed on your Hostinger VPS
- Nginx (or similar) can be used as a reverse proxy
- See DEPLOYMENT.md for details

## Diagrams

- Add diagrams here as your architecture evolves (e.g., sequence diagrams, ER diagrams, integration flows)

---

## Authentication & Session Management

- **Registration:** Users register via `/api/register` with username, email, and strong password. Email and password are validated server-side.
- **Login:** Users authenticate via `/api/login` using username or email and password. Password validation uses constant-time comparison to prevent timing attacks. On successful login, the user's ID is stored in the Flask session (`session['user_id']`).
- **Session:** Flask's built-in session is used for user authentication state. The session is secured with a secret key and stores only the user ID.
- **Logout:** Users log out via `/api/logout` (POST), which clears the session.
- **Current User Helper:** The backend provides a `get_current_user()` helper to retrieve the logged-in user from the session for use in protected endpoints.
- **Security:** All authentication endpoints require JSON requests. Passwords are hashed using Werkzeug's `generate_password_hash` and checked with `check_password_hash`.
- **Session Cookie Security (Recommended):**
  - Set `SESSION_COOKIE_SECURE = True` to enforce HTTPS-only cookies in production.
  - Set `SESSION_COOKIE_HTTPONLY = True` to prevent JavaScript access to the session cookie.
  - Set `SESSION_COOKIE_SAMESITE = "Lax"` to help mitigate CSRF risks.
- **CSRF Protection:**
  - All state-changing API requests (POST, PUT, DELETE) require a valid CSRF token sent in the `X-CSRF-Token` header. The token is generated per session and must match the value stored in the session. Login and register endpoints are excluded for demonstration.
  - If the CSRF token is missing or invalid, the API returns a 400 error.
  - To obtain the CSRF token, call an authenticated endpoint and extract the token from the session (see API.md for usage).

---

## Security & Session Management (Updated)

- **Production Warning:** The backend now issues a warning at startup if not running in debug or development mode, reminding you to check all security settings, including CSRF protection.
- **Session Cookie Security:** The backend sets `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, and `SESSION_COOKIE_SAMESITE` in the Flask config for best security practices.
- **CSRF Protection:**
  - All state-changing API requests (POST, PUT, DELETE) require a valid CSRF token sent in the `X-CSRF-Token` header. The token is generated per session and must match the value stored in the session. Login and register endpoints are excluded for demonstration.
  - If the CSRF token is missing or invalid, the API returns a 400 error.
  - To obtain the CSRF token, call an authenticated endpoint and extract the token from the session (see API.md for usage).
- **Granular Error Messages:** All endpoints return specific, actionable error messages for each validation failure (e.g., missing/empty title, invalid priority, invalid due_date format).
- **Priority Validation:** The `priority` field is strictly validated to be an integer between 0 and 3 (inclusive) in both create and update endpoints.
- **Timezone-Aware Datetime Handling:** All incoming `due_date` values are parsed as local time if no timezone is provided, and stored as timezone-aware datetimes using the system's local timezone. All returned datetime fields are ISO 8601 strings with timezone info if available.

---

## Testing Approach and Coverage

- All backend features and endpoints are now covered by automated tests using pytest and Flask's test client.
- Tests cover Task, Project, and User Profile CRUD endpoints, authentication, CSRF protection, timezone handling, and ownership validation.
- Test data uses valid, non-example.com email domains to comply with backend email validation rules.
- All forms of CSRF protection are fully disabled in test mode, ensuring no 403 errors during testing.
- Authenticated endpoint tests use `auth_client` fixtures to register and log in users.
- Backend code uses `db.session.get(Model, id)` instead of deprecated `Model.query.get(id)` for SQLAlchemy 2.x compatibility.
- See COPILOT_INSTRUCTIONS.md for testing and review policies.

---

_Expand this document as your project grows!_
