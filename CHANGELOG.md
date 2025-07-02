# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/), with personal tweaks for rewarding milestones and highly detailed dev versions.

## [v0.5.0-dev8] - 2025-07-01
- Added docs/API.md with detailed documentation for all Task CRUD API endpoints, including request/response formats and notes on datetime usage
- Added documentation for User endpoints (register, login, logout) in docs/API.md, including request/response examples and session handling notes
- Documented that all datetime fields (due_date, created_at, updated_at) are handled as ISO 8601 strings in the API, and recommend sending/receiving them in this format
- Noted in docs/API.md and code comments that all endpoints require authentication and return JSON responses
- Minor clarification in documentation policy: API usage examples and endpoint docs should be placed in docs/API.md rather than README.md for clarity and maintainability
- Implemented Task CRUD API endpoints in backend/app.py:
  - `GET /api/tasks` to list all tasks for the current user
  - `GET /api/tasks/<task_id>` to retrieve a specific task by ID
  - `POST /api/tasks` to create a new task (accepts ISO 8601 string for due_date)
  - `PUT /api/tasks/<task_id>` to update an existing task (supports partial updates, accepts ISO 8601 string for due_date)
  - `DELETE /api/tasks/<task_id>` to delete a task
- All endpoints require authentication via session (using @login_required)
- All endpoints return JSON responses and error messages
- Added `serialize_task` helper to ensure all datetime fields (due_date, created_at, updated_at) are returned as ISO 8601 strings
- Updated code comments and API documentation to clarify datetime handling and authentication requirements
- Updated VERSIONING.md to require that all API changes must be summarized in every stable/beta/alpha release entry
- Implemented ISO 8601 datetime string parsing for `due_date` in Task creation and update endpoints in backend/app.py. Incoming `due_date` values are now converted to Python datetime objects before storing in the database, and invalid formats return a 400 error with a clear message. This ensures robust API behavior and matches the documentation and changelog policy.
- Explicitly set `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, and `SESSION_COOKIE_SAMESITE` in Flask app config for better security practices
- Added a production warning using Python's warnings module: a warning is shown if the app is not running in debug or development mode, reminding the user to check security settings (including CSRF protection).
- Implemented CSRF protection for all state-changing API requests (POST, PUT, DELETE) using a session-based CSRF token and requiring an `X-CSRF-Token` header. Excluded login and register endpoints for demonstration. Added helper to generate CSRF tokens.
- Improved error messages throughout the Task endpoints to be granular and actionable (e.g., specific messages for missing/invalid title, priority, or due_date).
- Added strict validation for the `priority` field: must be an integer between 0 and 3 (inclusive) in both create and update endpoints.
- Implemented timezone-aware datetime handling: all incoming due_date values are parsed as local time if no timezone is provided, and stored as timezone-aware datetimes. Used Python's zoneinfo for local timezone detection.
- Documented in API.md and architecture.md:
  - Production warning for security settings
  - CSRF protection for all state-changing API requests (POST, PUT, DELETE) using a session-based CSRF token and `X-CSRF-Token` header
  - Granular error messages for all validation failures
  - Strict priority validation (integer 0-3)
  - Timezone-aware datetime handling (local time if no timezone provided)

## [v0.5.0-dev7] - 2025-07-01
- Updated `.deepsource.toml` to try again at adding exclusion pattern for migrations

## [v0.5.0-dev6] - 2025-07-01
- Updated `.deepsource.toml` to try again at adding exclusion pattern for migrations

## [v0.5.0-dev5] - 2025-07-01
- Updated `.deepsource.toml` to try again at adding exclusion pattern for migrations

## [v0.5.0-dev4] - 2025-07-01
- Skipped due to user error when committing

## [v0.5.0-dev3] - 2025-07-01
- Updated `.deepsource.toml` to try again at adding exclusion pattern for migrations

## [v0.5.0-dev2] - 2025-07-01
- Updated `.deepsource.toml` to fix issue with version number

## [v0.5.0-dev1] - 2025-07-01
- Updated .deepsource.toml to add exclusion patterns

## [v0.4.0-alpha] - 2025-07-01
### Added
- User authentication endpoints: `/api/register`, `/api/login`, and `/api/logout` with robust input validation and error handling
- Session-based authentication using Flask session (user ID stored on login, cleared on logout)
- Constant-time password validation to prevent timing attacks
- Helper function `get_current_user()` to retrieve the current user from the session
- Logging for all authentication events and errors
- Documentation updates: authentication/session management in `architecture.md`, API usage in `README.md`, security note in `DEPLOYMENT.md`, and implementation status in `FEATURES.md`
- Section in `architecture.md` detailing recommended Flask session cookie security settings: `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, and `SESSION_COOKIE_SAMESITE`, with rationale for each
- Clarification in `architecture.md` that CSRF protection is not yet implemented for state-changing requests, and recommendations for adding CSRF protection (e.g., Flask-WTF for forms, custom headers for APIs) before production deployment

### Changed
- Improved security and user experience for authentication endpoints
- Updated documentation to reflect new authentication and session management features
- Expanded documentation policy to require additional docs in `docs/` for new features/changes
- Clarified workflow: stay within request scope, document and ask before making out-of-scope changes, and ensure incremental progression per `ROADMAP.md`
- Reiterated code quality and security best practices
- Minor word tweak in `FEATURES.md` to stay consistent with the rest of the documentation

## [v0.4.0-dev8] - 2025-07-01
- Updated COPILOT_INSTRUCTIONS.md to clarify changelog policy: discourage use of "Unreleased" section, require all changes to be listed under the next dev version, and specify that stable releases should only update CHANGELOG.md after all dev changes are tested
- Expanded documentation policy to require additional docs in docs/ for new features/changes
- Clarified workflow: stay within request scope, document and ask before making out-of-scope changes, and ensure incremental progression per ROADMAP.md
- Reiterated code quality and security best practices
- Added explicit instruction to keep the changelog list running in the current dev version until it is expressly noted that the dev version has been pushed and a new dev version should begin (e.g., do not start dev9 until dev8 is confirmed as pushed)
- Added a section to docs/architecture.md detailing recommended Flask session cookie security settings: SESSION_COOKIE_SECURE, SESSION_COOKIE_HTTPONLY, and SESSION_COOKIE_SAMESITE, with rationale for each
- Clarified in docs/architecture.md that CSRF protection is not yet implemented for state-changing requests, and provided recommendations for adding CSRF protection (e.g., Flask-WTF for forms, custom headers for APIs) before production deployment
- Minor word tweak in docs/FEATURES.md to stay consistent with the rest of the documentation

## [v0.4.0-dev7] - 2025-07-01
- Updated `architecture.md` to include authentication and session management details
- Updated `DEPLOYMENT.md` to mention the need for a secure `SECRET_KEY` in production
- Updated `FEATURES.md` to include user authentication features and current status
- Updated `README.md` to reflect recent changes and improvements

## [v0.4.0-dev6] - 2025-07-01
- Added `/api/logout` endpoint for user logout
- Implemented session clearing on logout

## [v0.4.0-dev5] - 2025-07-01
- Implemented session management for user login/logout
- Added helper function `get_current_user()` to retrieve the current user from the session

## [v0.4.0-dev4] - 2025-07-01
- Implemented constant-time password validation to prevent timing attacks

## [v0.4.0-dev3] - 2025-07-01
- Added `/api/login` endpoint for user login
- Added DeepSource integration for code quality checks

## [v0.4.0-dev2] - 2025-06-30
- Added request content-type validation to `/api/register` endpoint
- Added input validation for empty fields in registration data
- Updated user existence check to be handled gracefully
- Added password strength validation to ensure strong passwords

## [v0.4.0-dev1] - 2025-06-30
- Implemented user registration endpoint at `/api/register` with input validation and error handling
- Integrated email validation using `email-validator` package
- Added password hashing and checking methods to the User model
- Added logging for registration attempts and errors
- Updated SQLAlchemy database URI to use environment variable or default to `sqlite:///productivity_hub.db`
- Tested registration endpoint with valid and invalid data

## [v0.3.0-alpha] - 2025-06-30
### Added
- User, Task, and Project models in `backend/app.py` using SQLAlchemy
- Relationships between User, Task, and Project (including cascade and backrefs)
- Validation constraints for User (unique username/email, indexed email, password hash)
- Task model fields for title, description, due date, priority, completion, timestamps
- Project model fields for name, description, timestamps
- Cascade and foreign key behaviors for safe deletion and data integrity
- Logging for backend events and debugging
- Flask-Migrate integration for database migrations

### Changed
- Improved model structure and relationships for future extensibility
- Updated code to use environment variable for secret key

## [v0.3.0-dev2] - 2025-06-29
- Added Logging to backend/app.py for better debugging
- Updated secret key configuration to use environment variable for security
- Integrated Flask-Migrate for database migrations
- Added cascade options to User, Task, and Project models for better data integrity
- Added validation constraints for email and password fields in User model
- Added validation for Task priority field

## [v0.3.0-dev1] - 2025-06-29
- Updated basic User model to be more complete with additional fields and relationships
- Added Task and Project models with relationships to User

## [v0.2.0-alpha] - 2025-06-29
### Added
- Python virtual environment setup under `.venv/`
- Flask app initialized in `backend/app.py`
- `requirements.txt` created for backend dependencies (Flask, Flask-SQLAlchemy, etc.)
- SQLite database setup and integrated with Flask app
- Example SQLAlchemy `User` model added to `app.py`
- Database tables auto-created on app startup
- Secret key configuration for session management
- Updated `.gitignore` to exclude `.venv/` and other environment files
- Updated `ROADMAP.md` to reflect backend environment progress

### Changed
- Moved database initialization logic to a separate function in `app.py`
- Switched to using absolute path for SQLite database in `app.py`

## [v0.2.0-dev2] - 2025-06-29
- Add secret key configuration for session management in backend/app.py
- Moved database initialization logic to a separate function in backend/app.py
- Switched to using absolute path for SQLite database in backend/app.py

## [v0.2.0-dev1] - 2025-06-29
- Set up Python virtual environment under the .venv/ directory
- Initialized Flask app structure in backend/
- Created requirements.txt for backend dependencies including Flask and Flask-SQLAlchemy
- Updated .gitignore to exclude .venv/ instead of venv/
- Added initial SQLite database setup in backend/app.py
- Updated ROADMAP.md to reflect changes made in this version

## [v0.1.0-alpha] - 2025-06-29
### Added
- Initial project roadmap with detailed, versioned milestones for rewarding progress
- Core and advanced features documented in FEATURES.md
- Tech stack and setup instructions in README.md
- Custom versioning and changelog process in VERSIONING.md
- CONTRIBUTING.md for workflow guidance
- DEPLOYMENT.md for VPS deployment steps
- MIT LICENSE for open usage
- .gitignore for Python, Node, and OS files
- CHANGELOG.md for detailed change tracking
- Project uploaded to private GitHub repository
- Created `frontend/`, `backend/`, and `docs/` directories
- Sample architecture overview at `docs/architecture.md`

## [v0.1.0-dev2] - 2025-06-29
- Created `frontend/`, `backend/`, and `docs/` directories in the project root
- Uploaded project to a private GitHub repository
- Added sample architecture overview at `docs/architecture.md` for future expansion
- Updated changelog and roadmap to reflect completed project initialization tasks

## [v0.1.0-dev1] - 2025-06-29
- Created initial project roadmap with detailed, versioned milestones for rewarding progress
- Defined and documented all core and advanced features in FEATURES.md
- Established tech stack and documented setup in README.md
- Outlined and documented custom versioning and changelog process in VERSIONING.md
- Added CONTRIBUTING.md to guide future contributions and personal workflow
- Created DEPLOYMENT.md for VPS deployment steps
- Added MIT LICENSE for open usage
- Set up .gitignore for Python, Node, and OS files
- Added CHANGELOG.md and began documenting all changes in detail

<!-- Add new entries above this line as you progress! -->
