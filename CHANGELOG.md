## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/), with personal tweaks for rewarding milestones and highly detailed dev versions.

## API Change Summary Requirement
- For every stable, alpha, or beta release, summarize all API changes (new endpoints, deleted endpoints, changes to endpoints, etc.) in the changelog, even if they were already documented in dev releases. This ensures the release notes provide a complete overview of API evolution for each version.

## [v0.8.0-dev2] - 2025-07-03
- Implemented the `PasswordResetToken` model in the backend to support password reset functionality.
- Added the `/api/password-reset/request` endpoint:
  - Accepts an email address, generates a secure token, stores it in the database, and (for now) returns the token in the response.
  - Lays the groundwork for full password reset flow, including email delivery and token validation in future dev releases.
- Updated backend/app.py with all model, endpoint, and helper logic for password reset requests.
- Changed DB pathing to be relative to the app directory for easier deployment and testing.
- Fixed deprecation warning for `datetime.datetime.utcnow()` by switching to `datetime.now(timezone.utc)` for UTC-aware timestamps in the `PasswordResetToken` model. This ensures future compatibility and removes warnings during tests and runtime.
- Added documentation for the new password reset functionality.
- Added automated tests for the password reset endpoint:
  - Tests for valid email requests, invalid email handling, and token generation.
  - Ensures the endpoint behaves correctly and securely.

### API Change Summary
**New Endpoints:**
- `POST /api/password-reset/request` — Request a password reset token by email (returns token for now; will send email in a future release).

**New Models:**
- `PasswordResetToken` — Stores password reset tokens, user association, and metadata for secure password reset flow.


## [v0.8.0-dev1] - 2025-07-02
- Roadmap reorganization: Password reset (backend) is now its own milestone at v0.8.0-alpha, immediately after API Testing.
- All subsequent milestones have been renumbered to keep versioning clean and intuitive.
- Password reset UI (frontend) is grouped with Auth UI in v0.10.0-alpha.
- Removed the redundant password reset milestone that previously appeared after Dashboard Layout.
- See ROADMAP.md for the updated milestone sequence and details.

## [0.7.0-alpha] - 2025-07-02
### Changed
- Marked all tasks as done, tests were previously implemented already

## [v0.6.0-alpha] - 2025-07-02
### Added
- `start_date` (optional, ISO 8601 datetime) and `recurrence` (optional, string) fields to the Task model and API.
- Full CRUD support for new Task fields, including validation, serialization, and error handling.
- Centralized, DRY validation and update helpers for all user and task fields.
- Automated tests for all Task, Project, and User endpoints, including new fields, edge cases, and error handling.
- Unique test credentials for all tests to ensure reliability and prevent collisions.
- Logging throughout all endpoints, helpers, and major logic branches for traceability and maintainability.
- Policy-driven workflow, changelog, and documentation practices as defined in COPILOT_INSTRUCTIONS.md and VERSIONING.md.

### Changed
- Refactored all endpoint logic to use centralized helpers for validation, error handling, and DRY principles.
- Refactored `update_task` and `update_profile` endpoints to reduce cyclomatic complexity using loop-based field processing.
- Improved code and documentation organization: all helpers are grouped, and all changes are reflected in docs/API.md and ROADMAP.md.
- Improved error messages and validation for all endpoints, including granular feedback for invalid input and ownership errors.
- Enhanced timezone handling and fallback logic for robust datetime support across platforms.
- Updated all test files to use endpoint constants and improved assertion patterns.

### Fixed
- Fixed bug in Task update: start_date vs due_date validation now always runs if both are set, regardless of which fields are present in the update payload.
- Fixed DeepSource issues: BAN-B101, PYL-R1714, PYL-W0621, and PY-R1000 (cyclomatic complexity).
- Fixed test reliability by ensuring all test credentials are unique per run.
- Fixed inconsistent error handling and object lookup throughout the backend.

### API Change Summary

**New Endpoints:**
- _None in this release._

**Changed Endpoints:**
- **PUT /api/profile**
  - Now uses centralized validation and error handling for all fields.
  - Improved error messages and feedback for invalid input and ownership errors.
  - Refactored to reduce cyclomatic complexity using loop-based field processing.

- **POST /api/tasks**
  - Now supports `start_date` (optional, ISO 8601 datetime) and `recurrence` (optional, string) fields.
  - Full validation, serialization, and error handling for new fields.

- **PUT /api/tasks/<task_id>**
  - Now supports updating `start_date` and `recurrence` fields.
  - Improved validation, including start_date vs due_date logic.
  - Refactored to use DRY, loop-based update logic for maintainability.

**Note:**
- All endpoints require authentication and enforce user/project ownership.
- State-changing endpoints require a valid CSRF token in production.
- All API changes and features are fully documented in `docs/API.md`.

## [v0.6.0-dev4] - 2025-07-02
- Refactored the `update_task` endpoint in backend/app.py to reduce cyclomatic complexity (PY-R1000):
    - Replaced sequential field update logic with a loop-based approach using a field-to-helper mapping, similar to the `update_profile` refactor.
    - Grouped direct assignments for simple fields (description, completed) for clarity and maintainability.
    - This reduces branching, improves maintainability, and ensures consistent validation and error handling for all updatable fields.
- No API changes, but the code is now more maintainable, testable, and compliant with code quality standards.
- See also: previous dev4 entries for validation helper refactor and organization.

## [v0.6.0-dev3] - 2025-07-02
- Updated all test credentials in backend/tests/test_auth.py, backend/tests/test_projects.py, and backend/tests/test_tasks.py to use unique usernames and emails generated with UUIDs. This prevents collisions and improves test reliability for all tests and fixtures.
- Refactored pure validation helpers for `start_date` and `recurrence` in backend/app.py:
    - Added `validate_task_start_date` and `validate_task_recurrence` as pure functions that validate and parse input values directly, without requiring Task object instantiation.
    - Updated the Task creation endpoint to use these helpers, improving efficiency and clarity.
    - Moved these helpers to the global helper section for better code organization and maintainability.
- Removed duplicate/stray definitions of these helpers at the end of backend/app.py.
- No API changes, but code is now more maintainable and efficient for future development.

## [v0.6.0-dev2] - 2025-07-02
- Added `start_date` (optional, ISO 8601 datetime) and `recurrence` (optional, string) fields to the Task model in backend/app.py.
- Updated Task serialization to include `start_date` and `recurrence` in API responses.
- Added helper functions for validating and updating `start_date` and `recurrence` fields.
- Updated Task creation and update endpoints to accept, validate, and store `start_date` and `recurrence` fields, using new helpers for consistency and error handling.
- Added validation to ensure `start_date` is not after `due_date` if both are set.
- Updated API documentation in docs/API.md to describe new fields, validation, and error cases for Task endpoints.
- Added and expanded automated tests in backend/tests/test_tasks.py for:
    - Creating and updating tasks with `start_date` and `recurrence`
    - Validation for `start_date` after `due_date` (should fail)
    - Ensured all new fields are covered in CRUD and edge cases
- Updated test_auth.py:
    - Replaced manual error raising with assert statements in `test_auth_client_fixture_works` for clarity and best practice in test files.
    - Added a local `auth_client` fixture to ensure the test is authenticated and passes reliably.
- Updated `auth_client` fixture in `backend/tests/test_tasks.py` to generate a unique username and email for each test run, preventing UNIQUE constraint errors during user registration in tests.
- Fixed a bug in the Task update endpoint: start_date vs due_date validation now always runs if both are set on the task, regardless of which fields are present in the update payload. This ensures invalid updates (e.g., setting start_date after an existing due_date) are correctly rejected with a 400 error.

## [v0.6.0-dev1] - 2025-07-02
- Updated ROADMAP.md to reflect the addition of the start date feature to the plan
- Updated ROADMAP.md to reflect that due_date and priority have already been added earlier in development.

## [v0.5.1-alpha] - 2025-07-02
### Added
- Automated test for `auth_client` fixture moved from `conftest.py` to `test_auth.py` for proper test organization.
- Expanded and clarified automated tests for CSRF protection, 404 error handling, and pagination edge cases in `test_auth.py`, `test_projects.py`, and `test_tasks.py`.

### Changed
- Refactored all test files to use endpoint constants instead of hardcoded strings for maintainability.
- Improved assertion patterns in tests for clarity and predictability.
- Updated test organization: all test logic now resides in dedicated test files, and `conftest.py` contains only fixtures and shared setup logic.
- Replaced all `assert ... or ...` patterns with `assert ... in (...)` for status code checks in tests.

### Fixed
- Resolved DeepSource issues: BAN-B101 (no assert outside test functions), PYL-R1714 (use `in` for multiple comparisons), and PYL-W0621 (no variable redefinition in fixtures).

### Review
- Codebase reviewed for code quality, maintainability, documentation, and policy compliance per `COPILOT_INSTRUCTIONS.md`.
- All tests pass and coverage is comprehensive.

### API Change Summary
- No API changes in this release. All changes are internal refactors, test improvements, and code quality fixes.

## [v0.5.1-dev4] - 2025-07-02
- Moved the test function `test_auth_client_fixture_works` from `conftest.py` to `test_auth.py` to follow best practices: all test logic now resides in dedicated test files, and `conftest.py` contains only fixtures and shared setup logic.

## [v0.5.1-dev3] - 2025-07-02
- Fixed DeepSource BAN-B101 (A04, OWASP Top 10): Ensured assert statements are only used inside test functions, not in fixtures or helpers, in `backend/tests/conftest.py`.
- Fixed PYL-R1714: Replaced multiple `or` conditions with `in` for status code assertions in `backend/tests/test_projects.py` and `backend/tests/test_auth.py` for clarity and maintainability.
- Fixed PYL-W0621: Ensured no variables are redefined from outer scope in fixtures in `backend/tests/conftest.py`.

## [v0.5.1-dev2] - 2025-07-02
- Updated `test_auth_client_fixture_works` in `backend/tests/conftest.py` to assert specifically for `'authtestuser'` as the username, ensuring the test matches the user created by the `auth_client` fixture and making the test more predictable and robust.
- Updated `test_csrf_protect_enforced` in `backend/tests/test_projects.py` to POST to `/api/projects` instead of `/api/tasks`, ensuring the test correctly verifies CSRF protection on the projects endpoint as intended.
- Updated `test_csrf_protect_profile_update` in `backend/tests/test_auth.py` to use the `REGISTER_URL`, `LOGIN_URL`, and `PROFILE_URL` constants instead of hardcoded endpoint strings, ensuring consistency and maintainability across all tests.
- Added/expanded automated tests in `backend/tests/test_projects.py` for:
    - 404 error handling for non-existent projects and tasks using `get_object_or_404` (test_get_object_or_404_returns_404)
    - Pagination edge cases for projects (out-of-range page, per_page over max) (test_paginate_query_edge_cases)
- Confirmed all new and updated tests use endpoint constants where possible and follow consistent assertion patterns.
- All changes documented per COPILOT_INSTRUCTIONS.md workflow and changelog policy.
- Performed a normal review per COPILOT_INSTRUCTIONS.md, confirming code quality, maintainability, documentation, and policy compliance. All tests pass and coverage is comprehensive.

## [v0.5.1-dev1] - 2025-07-02
- Refactored all logger calls in `backend/app.py` to use comma-separated arguments instead of f-strings, addressing 52 DeepSource issues and ensuring logging best practices for performance and security.
- DeepSource fixes: removed unused 'app' argument from the 'db' fixture in `backend/tests/conftest.py` (PYL-W0613), and removed unused 'session' import from `backend/tests/test_auth.py` (PY-W2000). Changelog entry added per policy.
- Refactored `update_profile` and `update_task` endpoints in `backend/app.py` to reduce cyclomatic complexity (from 18 and 16, respectively) by extracting field update logic into helper functions and using a loop-based approach. This improves maintainability, clarity, and policy compliance while preserving all validation, logging, and security checks.
- Further refactored `backend/app.py` to extract repeated validation and update logic for user and task fields into new global helper functions: `validate_and_update_username`, `validate_and_update_email`, `validate_and_update_password`, `validate_and_update_task_title`, `validate_and_update_task_priority`, `validate_and_update_task_due_date`, `validate_and_update_task_project`, and `error_response`. These helpers centralize validation, error handling, and update logic for user profile and task endpoints. All nested helpers were removed from `update_profile` and `update_task`, which now call these global helpers directly. This reduces cyclomatic complexity, ensures consistent validation and error responses, and improves maintainability and testability across the codebase.
- Re-added `csrf_protect` Flask before_request handler with a descriptive docstring and centralized error handling using `error_response`.
- Added `get_object_or_404` helper for DRY object lookup and error handling for 404s, with a descriptive docstring.
- Added `paginate_query` helper for DRY pagination and serialization of query results, with a descriptive docstring.
- Refactored all endpoints to use `error_response` for error handling instead of manual `jsonify` error responses.
- Refactored all object lookup (task/project by id) to use `get_object_or_404` for consistency and maintainability.
- Refactored all paginated endpoints to use `paginate_query` for DRY pagination logic.
- Ensured all helper functions, including new and existing ones, have clear, descriptive docstrings.
- Improved maintainability and reduced code duplication across the backend by centralizing repeated logic into helpers.
- Ensured CSRF protection is enforced and errors are handled consistently via the helper.
- Fixed inconsistent error handling and object lookup throughout the backend.
- Updated and expanded docstrings for all helpers and new utility functions.
- Documented all changes in this changelog entry as per COPILOT_INSTRUCTIONS.md.
- **Added new automated tests:**
    - CSRF protection enforcement for tasks and profile update endpoints.
    - 404 error handling for non-existent tasks and projects via `get_object_or_404`.
    - Pagination edge cases for tasks and projects (out-of-range page, per_page over max).
    - Test to ensure the `auth_client` fixture provides a valid authenticated session.

## [v0.5.0-alpha] - 2025-07-02
### Added
- Task, Project, and User Profile CRUD API endpoints with robust validation, error handling, authentication, CSRF protection, timezone handling, and strict project/user ownership validation.
- Automated test suite covering all endpoints and features, including positive, negative, and edge cases, with authenticated test fixtures and CSRF fully disabled in test mode.
- Logging throughout all major logic branches, endpoints, and helper functions, with configurable log level via `LOG_LEVEL` environment variable.
- Documentation for all endpoints, features, and security practices in `docs/API.md`, `docs/architecture.md`, and supporting files.
- Policy-driven workflow, changelog, and documentation practices as defined in `COPILOT_INSTRUCTIONS.md` and `VERSIONING.md`.

### Changed
- Refactored user profile update logic for maintainability and reduced complexity.
- Replaced all deprecated SQLAlchemy `Model.query.get(id)` calls with `db.session.get(Model, id)` for 2.x compatibility.
- Improved error messages and validation for all endpoints, including granular feedback for invalid input and ownership errors.
- Enhanced timezone handling and fallback logic for robust datetime support across platforms.
- Reorganized code and documentation for clarity, maintainability, and policy compliance.

### Fixed
- Resolved all test failures and warnings, including email validation, CSRF in test mode, and SQLAlchemy deprecation warnings.
- Fixed zoneinfo timezone error by falling back to 'Etc/UTC' if 'UTC' is not found.

### Security
- Enforced secure session cookie settings (`SESSION_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, `SESSION_COOKIE_SAMESITE`).
- Implemented session-based CSRF protection for all state-changing API requests, with clear documentation and test-mode bypass.
- Passwords are hashed and validated using best practices; all sensitive operations are logged and validated.

### API Change Summary
- **Endpoints Added:**
  - `POST /api/register` — Register a new user
  - `POST /api/login` — User login
  - `POST /api/logout` — User logout
  - `GET /api/profile` — Get current user profile
  - `PUT /api/profile` — Update user profile (username, email, password)
  - `GET /api/tasks` — List all tasks for current user
  - `GET /api/tasks/<task_id>` — Get a specific task
  - `POST /api/tasks` — Create a new task
  - `PUT /api/tasks/<task_id>` — Update a task
  - `DELETE /api/tasks/<task_id>` — Delete a task
  - `GET /api/projects` — List all projects for current user
  - `GET /api/projects/<project_id>` — Get a specific project
  - `POST /api/projects` — Create a new project
  - `PUT /api/projects/<project_id>` — Update a project
  - `DELETE /api/projects/<project_id>` — Delete a project
- **All endpoints require authentication and enforce user/project ownership. State-changing endpoints require a valid CSRF token in production.**
- **All API changes and features are fully documented in `docs/API.md`.**

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
- Consolidated and clarified the CSRF protection documentation in docs/architecture.md, removing contradictory statements and ensuring a single, authoritative description of the current CSRF implementation. This improves accuracy and avoids reader confusion, per documentation policy.
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
