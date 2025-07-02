# API Reference

This document describes the REST API endpoints for Task management in Productivity Hub.

---

## Authentication
All endpoints require the user to be authenticated (session-based). Include the session cookie in your requests.

---

## Task Endpoints

### Get All Tasks
**GET** `/api/tasks`
- Returns a list of all tasks for the current user.
- Response: `200 OK`, JSON array of tasks.

### Get Task by ID
**GET** `/api/tasks/<task_id>`
- Returns a single task by its ID (if it belongs to the user).
- Response: `200 OK`, JSON task object. `404` if not found.

### Create Task
**POST** `/api/tasks`
- Request JSON:
  ```json
  {
    "title": "Task title", // required, non-empty string
    "description": "Optional description",
    "due_date": "2025-07-01T12:00:00", // ISO 8601 string (with or without timezone)
    "priority": 1, // integer 0-3 (inclusive)
    "completed": false, // boolean
    "project_id": 2 // optional, integer
  }
  ```
- Headers: Must include `X-CSRF-Token` with the session's CSRF token value.
- Response: `201 Created`, JSON task object.
- Errors:
  - `400` if title is missing/empty, priority is not an integer 0-3, or due_date is invalid (see error message for details).

### Update Task
**PUT** `/api/tasks/<task_id>`
- Request JSON: Any updatable fields (see above).
- Headers: Must include `X-CSRF-Token` with the session's CSRF token value.
- Response: `200 OK`, JSON updated task object. `404` if not found.
- Errors:
  - `400` if title is missing/empty, priority is not an integer 0-3, or due_date is invalid (see error message for details).

### Delete Task
**DELETE** `/api/tasks/<task_id>`
- Response: `200 OK` on success. `404` if not found.

---

## User Endpoints

### Register
**POST** `/api/register`
- Request JSON:
  ```json
  {
    "username": "yourname",
    "email": "your@email.com",
    "password": "StrongPassword123!"
  }
  ```
- Response: `201 Created` on success, JSON message. `400` or `500` on error.

### Login
**POST** `/api/login`
- Request JSON:
  ```json
  {
    "username": "yourname", // or "email": "your@email.com"
    "password": "StrongPassword123!"
  }
  ```
- Response: `200 OK` on success, JSON message. `401` on invalid credentials.
- On success, a session cookie is set for authentication.

### Logout
**POST** `/api/logout`
- Response: `200 OK` on success, JSON message.
- Clears the session cookie.

---

## Security Notes
- **Production Warning:** If the app is not running in debug or development mode, a warning is shown at startup reminding you to check all security settings, including CSRF protection.
- **Session Cookie Security:** The backend sets `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, and `SESSION_COOKIE_SAMESITE` in the Flask config for best security practices.
- **CSRF Protection:**
  - All state-changing API requests (POST, PUT, DELETE) require a valid CSRF token sent in the `X-CSRF-Token` header. The token is generated per session and must match the value stored in the session. Login and register endpoints are excluded for demonstration.
  - If the CSRF token is missing or invalid, the API returns a 400 error.
  - To obtain the CSRF token, call an authenticated endpoint and extract the token from the session (see below for usage).

---

## CSRF Token Usage
- After login, call any authenticated GET endpoint (e.g., `/api/tasks`) to establish a session. The CSRF token is generated and stored in the session.
- To retrieve the CSRF token, you may need to expose an endpoint or include it in a response (e.g., as a custom header or in the JSON response). For now, the backend generates it per session.
- For all POST, PUT, DELETE requests, include the CSRF token in the `X-CSRF-Token` header.

---

## Error Handling (Granular)
- All endpoints return specific, actionable error messages for each validation failure (e.g., missing/empty title, invalid priority, invalid due_date format).
- Example error responses:
  - `{ "error": "Title is required and cannot be empty." }`
  - `{ "error": "Priority must be an integer between 0 and 3." }`
  - `{ "error": "Invalid due_date format. Use ISO 8601 with or without timezone." }`
  - `{ "error": "CSRF token missing or invalid" }`

---

## Timezone-Aware Datetime Handling
- All incoming `due_date` values are parsed as local time if no timezone is provided, and stored as timezone-aware datetimes using the system's local timezone.
- All returned datetime fields (`due_date`, `created_at`, `updated_at`) are ISO 8601 strings with timezone info if available.
- This ensures all times are consistent with the user's local system.

---

## Notes
- `due_date`, `created_at`, and `updated_at` are returned as ISO 8601 strings. When creating or updating a task, the `due_date` field must be provided as an ISO 8601 string (e.g., `2025-07-01T12:00:00`). The backend now validates and converts this string to a datetime object. If the format is invalid, the API returns a 400 error with a clear message. This ensures robust and predictable datetime handling.
- All endpoints return JSON responses.
- All errors are returned as JSON with an `error` field.

---

*Expand this file as you add more endpoints or features.*
