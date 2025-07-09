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
- Response fields:
  - `id`: integer, task ID
  - `title`: string, task title
  - `description`: string, optional, task description
  - `due_date`: string, ISO 8601 format, due date
  - `start_date`: string, ISO 8601 format, optional, start date
  - `priority`: integer, 0-3, priority level
  - `recurrence`: string, optional, recurrence rule (e.g., 'daily', 'weekly', 'custom')
  - `completed`: boolean, completion status
  - `project_id`: integer, optional, associated project ID

### Get Task by ID
**GET** `/api/tasks/<task_id>`
- Returns a single task by its ID (if it belongs to the user).
- Response: `200 OK`, JSON task object. `404` if not found.
- Response fields:
  - `id`: integer, task ID
  - `title`: string, task title
  - `description`: string, optional, task description
  - `due_date`: string, ISO 8601 format, due date
  - `start_date`: string, ISO 8601 format, optional, start date
  - `priority`: integer, 0-3, priority level
  - `recurrence`: string, optional, recurrence rule (e.g., 'daily', 'weekly', 'custom')
  - `completed`: boolean, completion status
  - `project_id`: integer, optional, associated project ID

### Create Task
**POST** `/api/tasks`
- Request JSON:
  ```json
  {
    "title": "Task title",
    "description": "Optional description",
    "due_date": "2025-07-01T12:00:00",
    "start_date": "2025-06-30T09:00:00",  // Optional, ISO 8601
    "priority": 1,
    "recurrence": "weekly",  // Optional, string (e.g., 'daily', 'weekly', 'custom')
    "completed": false,
    "project_id": 2
  }
  ```
- Field notes:
  - `title`: required, non-empty string
  - `description`: optional string
  - `due_date`: ISO 8601 string (with or without timezone)
  - `start_date`: ISO 8601 string (with or without timezone, optional)
  - `priority`: integer 0-3 (inclusive)
  - `recurrence`: optional string (e.g., 'daily', 'weekly', 'custom')
  - `completed`: boolean
  - `project_id`: optional, integer
- Validation:
  - If both `start_date` and `due_date` are set, `start_date` must not be after `due_date`.
- Headers: Must include `X-CSRF-Token` with the session's CSRF token value.
- Response: `201 Created`, JSON task object.
- Errors:
  - `400` if title is missing/empty, priority is not an integer 0-3, due_date/start_date is invalid, or start_date is after due_date (see error message for details).

### Update Task
**PUT** `/api/tasks/<task_id>`
- Request JSON: Any updatable fields (see above).
- Headers: Must include `X-CSRF-Token` with the session's CSRF token value.
- Validation:
  - If both `start_date` and `due_date` are set, `start_date` must not be after `due_date`.
- Response: `200 OK`, JSON updated task object. `404` if not found.
- Errors:
  - `400` if title is missing/empty, priority is not an integer 0-3, due_date/start_date is invalid, or start_date is after due_date (see error message for details).

### Delete Task
**DELETE** `/api/tasks/<task_id>`
- Response: `200 OK` on success (returns `{ "message": "Task deleted successfully" }`). `404` if not found.

---

## User Endpoints

### Register
**POST** `/api/register`
- Registers a new user.
- Request JSON:
  ```json
  {
    "username": "yourname",
    "email": "your@email.com",
    "password": "StrongPassword123!"
  }
  ```
- Response: `201 Created` on success, JSON message. `400` on validation error.

### Login
**POST** `/api/login`
- Logs in a user.
- Request JSON:
  ```json
  {
    "username": "yourname",
    "password": "StrongPassword123!"
  }
  ```
- Response: `200 OK` on success, JSON message. `401` on invalid credentials.
- On success, a session cookie is set for authentication.

### Logout
**POST** `/api/logout`
- Logs out the current user.
- Response: `200 OK` on success, JSON message.
- Clears the session cookie.

### Get current user profile
**GET** `/api/profile`
- Returns the current user's profile (id, username, email).
- Requires authentication.
- Response: `200 OK`, JSON user object.

### Update current user profile
**PUT** `/api/profile`
- Updates the current user's username, email, and/or password.
- Request JSON: any combination of `username`, `email`, `password` fields.
- Headers: Must include `X-CSRF-Token` with the session's CSRF token value.
- Validation:
  - `username`: required if present, must be unique and non-empty
  - `email`: required if present, must be valid, unique, and non-empty
  - `password`: required if present, must be strong (min 8 chars, upper/lower/number/special)
- Response: `200 OK` on success, JSON message. `400` on validation error. `401` if not authenticated.
- Errors:
  - `400` if username/email/password is missing, empty, not unique, or invalid
  - `400` if no valid fields to update

#### Notes
- All endpoints require authentication where applicable.
- All state-changing endpoints require CSRF token in `X-CSRF-Token` header.
- See error handling and security notes above for details.

---

## Password Reset Endpoints

### Request Password Reset Token
**POST** `/api/password-reset/request`
- Initiates a password reset for a user by email.
- Request JSON:
  ```json
  {
    "email": "user@domain.com"
  }
  ```
- Response: `200 OK`, JSON message.
  - **In development/testing:**
    ```json
    {
      "message": "If the email exists, a password reset link will be sent.",
      "token": "<reset_token>",
      "expires_at": "2025-07-03T12:34:56.000000+00:00"
    }
    ```
  - **In production:**
    ```json
    {
      "message": "If the email exists, a password reset link will be sent."
    }
    ```
- Security: Always returns a generic message to prevent email enumeration. The token is only returned in development/testing; in production, it is sent via email only.
- The email contains a password reset link with the token as a query parameter (e.g., `https://yourdomain.com/reset-password?token=<reset_token>`).
- The email body is generated using a template and includes the expiration time (default: 60 minutes, configurable via `PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES`).
- Notes:
  - The endpoint does not reveal whether the email exists in the system.
  - Tokens expire after the configured period and are single-use.
  - Email delivery uses SMTP settings configured via environment variables (see below).

#### Model: PasswordResetToken
- Stores password reset tokens and metadata for secure password reset flow.
- Fields:
  - `id`: integer, primary key
  - `user_id`: integer, foreign key to User
  - `token`: string, secure random token
  - `created_at`: string, ISO 8601 UTC timestamp
  - `expires_at`: string, ISO 8601 UTC timestamp (token expiration)
  - `used`: boolean, whether the token has been used
- Usage:
  - Tokens are single-use and expire after a set period (default: 60 minutes, configurable).
  - Used to validate password reset requests and securely update user passwords.

##### Email Delivery Configuration
- The backend uses SMTP to send password reset emails. Configure these environment variables (e.g., in a `.env` file):
  - `EMAIL_HOST` (SMTP server hostname, e.g., `smtp.gmail.com` or `localhost` for testing)
  - `EMAIL_PORT` (SMTP port, e.g., `587` for TLS, `1025` for local debug)
  - `EMAIL_HOST_USER` (SMTP username, if required)
  - `EMAIL_HOST_PASSWORD` (SMTP password, if required)
  - `EMAIL_USE_TLS` (`true` or `false`)
  - `EMAIL_FROM` (sender address, e.g., `noreply@yourdomain.com`)
  - `PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES` (expiration in minutes, default: 60)
- The password reset email is generated using a template and includes the reset link and expiration time.
- See the project `.env` file for an example configuration.

### Confirm Password Reset
**POST** `/api/password-reset/confirm`
- Confirms a password reset using a token and sets a new password.
- Request JSON:
  ```json
  {
    "token": "<reset_token>",
    "new_password": "NewStrongPassw0rd!"
  }
  ```
- Response:
  - `200 OK` on success:
    ```json
    { "message": "Password has been reset successfully." }
    ```
  - `400 Bad Request` on error:
    - Invalid or expired token:
      ```json
      { "error": "Invalid or expired token." }
      ```
    - Token already used:
      ```json
      { "error": "This token has already been used." }
      ```
    - Weak password:
      ```json
      { "error": "Password does not meet strength requirements." }
      ```
    - Missing fields:
      ```json
      { "error": "Token and new_password are required." }
      ```
- Notes:
  - The token must be valid and unused (expiration enforcement coming soon).
  - The new password must meet strength requirements (min 8 chars, upper/lower/number/special).
  - On success, the token is marked as used and cannot be reused.

---

## Project API Endpoints

### Get all projects
**GET** `/api/projects`
- Returns a paginated list of all projects for the current user.
- Response: `200 OK`, JSON array of projects.
- Query parameters:
  - `page`: optional, integer, the page number to retrieve (default: 1)
  - `per_page`: optional, integer, number of projects per page (default: 10, max: 100)

### Get a project by ID
**GET** `/api/projects/<project_id>`
- Returns the project with the given ID if it belongs to the user.
- Response: `200 OK`, JSON project object. `404` if not found.

### Create a project
**POST** `/api/projects`
- Request JSON:
  ```json
  {
    "name": "Project name",
    "description": "Optional description"
  }
  ```
- Field notes:
  - `name`: required, non-empty string
  - `description`: optional string
- Headers: Must include `X-CSRF-Token` with the session's CSRF token value.
- Response: `201 Created`, JSON project object.
- Errors:
  - `400` if name is missing/empty.

### Update a project
**PUT** `/api/projects/<project_id>`
- Request JSON: Any updatable fields (name, description).
- Headers: Must include `X-CSRF-Token` with the session's CSRF token value.
- Response: `200 OK`, JSON updated project object. `404` if not found.
- Errors:
  - `400` if name is present but empty.

### Delete a project
**DELETE** `/api/projects/<project_id>`
- Response: `200 OK` on success (returns `{ "message": "Project deleted successfully" }`). `404` if not found.

#### Notes
- All endpoints require authentication.
- All state-changing endpoints require CSRF token in `X-CSRF-Token` header.
- Only the current user's projects are accessible.
- See error handling and security notes above for details.

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

## Testing Approach and Coverage

- All backend features and endpoints are now covered by automated tests using pytest and Flask's test client.
- Tests cover Task, Project, and User Profile CRUD endpoints, authentication, CSRF protection, timezone handling, and ownership validation.
- Test data uses valid, non-example.com email domains to comply with backend email validation rules.
- All forms of CSRF protection are fully disabled in test mode, ensuring no 403 errors during testing.
- Authenticated endpoint tests use `auth_client` fixtures to register and log in users.
- Backend code uses `db.session.get(Model, id)` instead of deprecated `Model.query.get(id)` for SQLAlchemy 2.x compatibility.
- See COPILOT_INSTRUCTIONS.md for testing and review policies.

---

*Expand this file as you add more endpoints or features.*

---

## Task Dependencies Endpoints

#### Get Task Dependencies
**GET** `/api/tasks/<task_id>/dependencies`
- Returns all dependencies for a task (tasks this task is blocked by, and tasks it is blocking).
- Response: `200 OK`, JSON object:
  ```json
  {
    "blocked_by": [ { ...task }, ... ],
    "blocking": [ { ...task }, ... ]
  }
  ```
- Each dependency is a full task object (see Get Task by ID).
- Errors: `404` if task not found.

#### Set Task Dependencies (Replace All)
**POST** `/api/tasks/<task_id>/dependencies`
- Sets the dependencies for a task, replacing all existing dependencies.
- Request JSON:
  ```json
  {
    "blocked_by": [2, 3],   // IDs of tasks this task is blocked by
    "blocking": [4, 5]      // IDs of tasks this task is blocking
  }
  ```
- Response: `200 OK`, JSON updated task object.
- Errors: `404` if task not found.

#### Patch Task Dependencies (Add/Remove)
**PATCH** `/api/tasks/<task_id>/dependencies`
- Add or remove specific dependencies for a task.
- Request JSON:
  ```json
  {
    "add_blocked_by": [2],
    "remove_blocked_by": [3],
    "add_blocking": [4],
    "remove_blocking": [5]
  }
  ```
- All fields are optional arrays of task IDs.
- Response: `200 OK`, JSON updated task object.
- Errors: `404` if task not found.

#### Notes
- All dependency endpoints require authentication and CSRF token for state-changing requests.
- Only tasks owned by the current user can be set as dependencies.
- The main task create/update endpoints also accept `blocked_by` and `blocking` arrays in the payload to set dependencies at creation/update time.
- The `blocked_by` and `blocking` fields in the task object are arrays of task IDs.

---
