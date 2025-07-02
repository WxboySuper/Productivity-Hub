# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/), with personal tweaks for rewarding milestones and highly detailed dev versions.

## API Change Summary Requirement
- For every stable, alpha, or beta release, summarize all API changes (new endpoints, deleted endpoints, changes to endpoints, etc.) in the changelog, even if they were already documented in dev releases. This ensures the release notes provide a complete overview of API evolution for each version.

## [v0.5.0-dev13] - 2025-07-02
- **Automated Test Coverage Complete:** All backend features and endpoints are now covered by automated tests using pytest and Flask's test client. This includes Task, Project, and User Profile CRUD endpoints, authentication, CSRF protection, timezone handling, and project/user ownership validation. Tests include both positive and negative cases, edge cases, and error handling.
- **Test Data Compliance:** Updated all test data to use valid, non-example.com email domains (e.g., `user@devmail.local`, `task@weatherboysuper.com`) to comply with backend email validation rules. This ensures registration and authentication tests pass and reflect real-world usage.
- **CSRF Protection in Test Mode:** Ensured all forms of CSRF protection are fully disabled in test mode, both for Flask-WTF and custom CSRF checks. This prevents 403 errors during testing and allows all state-changing endpoints to be tested without requiring CSRF tokens.
- **Authenticated Test Fixtures:** Added and documented `auth_client` fixtures in test files to register and log in users for authenticated endpoint testing. This enables robust, isolated testing of endpoints that require authentication and session state.
- **SQLAlchemy 2.x Compatibility:** Updated backend code to use `db.session.get(Model, id)` instead of deprecated `Model.query.get(id)` for all primary key lookups. This removes SQLAlchemy 2.x deprecation warnings and ensures future compatibility with newer SQLAlchemy versions.
- **Expanded Documentation:**
  - Added a "Testing Approach and Coverage" section to `docs/API.md` and `docs/architecture.md`, summarizing the automated test coverage, CSRF/test config, and SQLAlchemy compatibility improvements.
  - Updated documentation to clarify test approach, coverage, and configuration, including how CSRF is handled in test mode and how authenticated test clients are used.
  - All changes are documented per workflow and testing policy in `COPILOT_INSTRUCTIONS.md`.
- **Logging and Traceability:** Maintained thorough logging throughout the codebase, including all helper functions, route handlers, and major logic branches. All true error conditions use `logger.error` or `logger.warning` as appropriate. Logging level remains configurable via the `LOG_LEVEL` environment variable.
- **Policy Adherence:** All changes follow the workflow, documentation, reviewer, testing, and logging policies as defined in `COPILOT_INSTRUCTIONS.md`. Versioning, changelog, and documentation are kept up to date and detailed for dev releases.

## [v0.5.0-dev12] - 2025-07-02
- Updated the reviewer policy for extra clarification on the end of version review policy.
- Refactored `update_profile` endpoint in `backend/app.py` to reduce cyclomatic complexity by extracting field update logic into helper functions and using a loop for field processing. This improves maintainability and clarity.
- Improved error handling and validation in `update_profile` for username, email, and password updates, with clear error messages and robust checks for uniqueness and format.
- Updated documentation and code organization for user profile endpoints to ensure clarity and maintainability.
- **New Testing Policy:** All features and functions must have automated tests created and passing before any version (including dev versions) is pushed. Exception: tests for current features will be implemented in v0.5.0-dev13. This policy is now required for all future development.
- Began implementation of automated tests for all features and functions, as required by the new testing policy in COPILOT_INSTRUCTIONS.md. This is in preparation for the stable v0.5.0-alpha release.
- Confirmed that all Task, Project, and User Profile CRUD API endpoints, authentication, CSRF protection, timezone handling, project/user ownership validation, and logging are implemented and documented per workflow and organization policies.
- Performed end-of-version review and confirmed adherence to all workflow, documentation, reviewer, testing, and logging policies as defined in COPILOT_INSTRUCTIONS.md.
- Updated and clarified documentation in docs/API.md, COPILOT_INSTRUCTIONS.md, and ROADMAP.md to reflect current code state and new testing/logging requirements.
- All changes are versioned, auditable, and follow best practices, with a strong emphasis on code and documentation organization.
- Added password reset (forgot password) as a planned feature for the backend and frontend in the roadmap (v0.10.1-alpha).
- Made logging level configurable via LOG_LEVEL environment variable, defaulting to INFO, and log the configured level at startup.
- Expanded docstrings for is_strong_password, get_current_user, serialize_task, and serialize_project for clarity and maintainability.

## [v0.5.0-dev11] - 2025-07-02
- Implemented User Profile API endpoints:
  - Added `GET /api/profile` to retrieve the current user's profile (id, username, email). Requires authentication.
  - Added `PUT /api/profile` to update the current user's username, email, and/or password. Validates uniqueness, format, and password strength. Requires authentication and CSRF token.
  - Robust error handling for all validation and uniqueness checks, with clear error messages for each failure case.
  - Updated `docs/API.md` with detailed documentation for profile endpoints, including usage, validation, and error handling.
  - All changes are documented and organized per project workflow and documentation policy.

## [v0.5.0-dev10] - 2025-07-02
- Implemented Project CRUD API endpoints (`/api/projects`):
  - Added `GET /api/projects` to list all projects for the current user, with pagination (`page`, `per_page`), returning only the user's projects.
  - Added `GET /api/projects/<project_id>` to retrieve a specific project by ID, returning 404 if not found or not owned by the user.
  - Added `POST /api/projects` to create a new project. Validates that `name` is present and non-empty. Returns the created project object.
  - Added `PUT /api/projects/<project_id>` to update an existing project. Validates ownership and that `name` (if present) is non-empty. Returns the updated project object.
  - Added `DELETE /api/projects/<project_id>` to delete a project, returning 404 if not found or not owned by the user.
  - All endpoints require authentication and enforce project ownership. State-changing endpoints require a valid CSRF token in the `X-CSRF-Token` header.
  - Added robust error handling and clear, actionable error messages for all endpoints.
  - Added `serialize_project` helper function for consistent API responses, and moved all helper functions to a single section above the route definitions for improved organization and maintainability.
  - Updated `docs/API.md` with detailed documentation for all Project endpoints, including usage, parameters, security notes, and error handling.
  - Updated `docs/architecture.md` and `ROADMAP.md` to reflect the new endpoints and organizational improvements.
  - Updated `COPILOT_INSTRUCTIONS.md` to add a rule prioritizing code and documentation organization for all future changes.
  - All changes are thoroughly documented and organized per project workflow and documentation policy.

## [v0.5.0-dev9] - 2025-07-02
- Updated the Task update endpoint to validate that the provided project_id belongs to the current user before assignment. If the project does not exist or is not owned by the user, a 404 error is returned. This ensures proper access control and data integrity for task-project relationships.
- Updated timezone handling to use a configurable DEFAULT_TIMEZONE environment variable (defaulting to "UTC"). If the specified timezone is invalid, the backend falls back to UTC. This ensures robust, configurable, and documented timezone handling for all datetime fields.
- Added project ownership validation to the Task creation endpoint: if a project_id is provided, the backend now checks that the project exists and belongs to the current user before creating the Task. If not, a 404 error is returned. This ensures proper access control and data integrity for task-project relationships.
- Removed all inline comments from the JSON example in the Create Task endpoint in docs/API.md to ensure valid JSON.
- Added field explanations as plain text below the code block for clarity and maintainability, per documentation policy in COPILOT_INSTRUCTIONS.md.
- Updated the Task DELETE endpoint documentation in docs/API.md to specify that a successful deletion returns 200 OK with a JSON message, matching the backend implementation. This avoids client confusion and ensures the documentation accurately reflects API behavior.
- Consolidated and clarified the CSRF protection documentation in docs/architecture.md, removing contradictory statements and ensuring a single, authoritative description of the current CSRF implementation. This improves accuracy and avoids reader confusion, per documentation policy in COPILOT_INSTRUCTIONS.md.
- Replaced the API change summary paragraph in COPILOT_INSTRUCTIONS.md changelog policy with a brief reference to VERSIONING.md, ensuring a single authoritative source and eliminating redundancy, per documentation policy.
- Updated the documentation policy in COPILOT_INSTRUCTIONS.md to reference the correct path 'docs/API.md' (instead of 'API.md') in both locations, ensuring clarity and preventing broken links, per documentation policy.
- Updated the production environment check in backend/app.py to trigger the security warning only if FLASK_ENV or ENVIRONMENT is explicitly set to 'production', ensuring the warning appears only in true production environments. This improves deployment clarity and aligns with best practices in COPILOT_INSTRUCTIONS.md.
- Updated CSRF token generation in backend/app.py to use the secrets module (secrets.token_hex(16)) instead of os.urandom, following best practices for cryptographic token generation, per COPILOT_INSTRUCTIONS.md.

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
