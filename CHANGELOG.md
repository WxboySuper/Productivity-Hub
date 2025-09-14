## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/), with personal tweaks for rewarding milestones and highly detailed dev versions.

## API Change Summary Requirement

- For every stable, alpha, or beta release, summarize all API changes (new endpoints, deleted endpoints, changes to endpoints, etc.) in the changelog, even if they were already documented in dev releases. This ensures the release notes provide a complete overview of API evolution for each version.

## [v0.12.0-beta] - 2025-07-25

### Added

- **Cross-platform deployment infrastructure**: Windows PowerShell and Linux/macOS deployment scripts with robust error handling
- **Enhanced SSL/HTTPS setup**: Comprehensive SSL configuration guide with Let's Encrypt and commercial certificate support
- **Deployment validation tools**: Nginx configuration validator with placeholder detection and SSL certificate verification
- **Improved deployment reliability**: Package-based dependency resolution with retry logic and automatic rollback
- **Production-ready deployment documentation**: Step-by-step guides for VPS, Docker, and automated deployments
- Dynamic backgrounds (10 creative themes), sidebar navigation, and modern card-based layouts
- Multiple form design systems (Creative, Productivity Focused, Modern, etc.)
- Toast notification system and improved notification center with persistent scheduling (UTC support)
- Advanced form components: floating labels, animated inputs, priority selectors, expandable sections
- Modular component library for consistent UI development
- Automated accessibility tests (axe-core) and ARIA improvements
- 441 passing frontend tests; backend coverage >95%
- Persistent notification scheduling and new API endpoints for task dependencies
- End-of-version checklist template and personal change tracking system

### Changed

- **Deployment process**: Enhanced with cross-platform support, better error handling, and comprehensive validation
- **Nginx configuration**: Improved with clear placeholder indicators and validation requirements
- **SSL certificate management**: Streamlined setup process with automated validation and renewal guidance
- Major UI/UX redesign: responsive layout, unified backgrounds, enhanced typography, progressive disclosure for forms
- Authentication and security: robust CSRF handling, session management, secure logout, authentication guards
- Comprehensive error handling: React ErrorBoundary, standardized API error responses, improved user feedback
- Notification/reminder logic now uses UTC consistently

### Infrastructure

- **Windows deployment support**: PowerShell script with SSH client detection and rsync fallback support
- **Deployment package strategy**: Local dependency resolution to prevent runtime failures during deployment
- **Configuration validation**: Automated checks for placeholder values, SSL certificates, and DNS resolution
- **Enhanced documentation**: Comprehensive SSL setup guide and troubleshooting resources
- All major flows, accessibility, and coverage requirements tracked in checklists and roadmap
- Documentation updated for all new features, test patterns, migration notes, and best practices

### Fixed

- Color contrast and focus management improvements for accessibility
- Keyboard navigation and tab order fixes
- Date precision fix for notification scheduling
- Closed all single-line/component coverage gaps in ProjectForm, PasswordResetConfirmPage, LoginPage, useTasks
- Addressed moderate/complex coverage gaps in NotificationCenter, TaskForm, TaskDetails, MainManagementWindow

### Refactored

- Component structure and test organization for maintainability and speed
- CSS architecture: modular stylesheets for each component type
- Authentication context refactored for robust auth state management
- Refactored and stabilized test infrastructure

### API Change Summary

- No breaking API changes; all new/changed endpoints and models are documented in `docs/API.md`
- Persistent notification scheduling and new endpoints for task dependencies

### Breaking Changes & Migration Notes

- Component API and CSS classes updated for new design system
- Authentication flow enhancements may require re-login
- Notification system enhanced with new security measures

## [v0.11.0-beta] - 2025-07-04

### Summary

This beta release introduces a modern, full-page unauthenticated landing page, a protected dashboard placeholder for authenticated users, and a robust, persistent authentication flow. All authentication and routing logic has been refactored for security, maintainability, and user experience. DeepSource issues have been addressed for code quality. The changelog and roadmap are fully up to date for this release.

### Added

- Modern, creative unauthenticated landing page (`HomePage.tsx`) with SVG background and feature highlights.
- Placeholder dashboard page (`DashboardPlaceholderPage.tsx`) for authenticated users, including a "Sign Out" button.
- Robust authentication context (`AuthProvider` and `useAuth` in `auth.tsx`) with persistent login state using localStorage.
- Login flow in `LoginPage.tsx` now uses the backend authentication token and stores it securely in localStorage.
- Route protection in `App.tsx`: authenticated users see the dashboard, unauthenticated users see the landing page.

### Changed

- Refactored routing and authentication logic for clarity, maintainability, and security.
- Updated changelog and roadmap to reflect all new features and improvements.

### Fixed

- Removed unused `PrivateRoute` from `App.tsx` (DeepSource JS-0356).
- Reduced JSX nesting in `HomePage.tsx` by mapping feature cards (DeepSource JS-0415).
- Used `Boolean(token)` instead of `!!token` in `auth.tsx` (DeepSource JS-0066).

### API Change Summary

_No new API changes in this release. See v0.10.0-alpha for the latest API additions._

## [v0.10.0-alpha] - 2025-07-03

### Summary

This alpha release introduces a complete, secure password reset flow (frontend and backend), robust CSRF protection for unauthenticated users, modern authentication UI, and improved code quality. All changes from dev1–dev5 are included below.

### API Change Summary

**New Endpoints:**

- `GET /api/csrf-token` — Obtain a CSRF token for the current session (public, unauthenticated).
- `POST /api/password-reset/request` — Request a password reset token by email (secure, generic response, email delivery, token/expiration in dev/test).
- `POST /api/password-reset/confirm` — Confirm a password reset using a token and new password (validates, updates password, marks token as used, enforces expiration and strength).

**Changed Endpoints:**

- Password reset endpoints now use timing-equalized logic and always attempt token generation/email send, even for non-existent users.
- All endpoints requiring primary key lookups now use `db.session.get()` for SQLAlchemy 2.x compatibility.

**New Models:**

- `PasswordResetToken` — Stores password reset tokens, user association, expiration, and usage metadata for secure password reset flow.

**Security:**

- Password reset and authentication flows are robust against timing attacks and enumeration. All sensitive operations are logged. Expired/used tokens are rejected. Passwords are validated for strength and hashed securely.

### Major Features

- Password reset request and confirm pages (frontend) with CSRF token handling and modern UX.
- Configurable password reset email links using `FRONTEND_BASE_URL` for local/production use.
- Login and registration pages with modern UI, error/success banners, and API integration.
- Tailwind CSS styling and improved status messages for all auth pages.
- Development proxy for frontend to backend API requests.
- Thorough logging and error handling throughout all new features.
- `.env` is excluded from version control to protect sensitive credentials and secrets.
- Backend password reset flow and email delivery are now fully compatible with Gmail SMTP and any SMTP provider, using environment variables for configuration.
- Fixed DeepSource issues: JS-0086, JS-0246, JS-0417, JS-0356, and others for code quality and maintainability.

## [v0.9.1-alpha] - 2025-07-03

- Update `ROADMAP.md` to reflect changes in the release process and future plans of migrating to Vite or Next.js.

## [v0.9.0-alpha] - 2025-07-03

### Added

- ErrorBoundary wrapper in `frontend/src/App.tsx` to catch runtime errors and display a user-friendly error message.
- Catch-all 404 Not Found route in `frontend/src/App.tsx` for unmatched paths, improving user experience and routing robustness.
- Initialized frontend React app with TypeScript in `frontend/`.
- Installed and configured Tailwind CSS (v3) for the frontend, including Tailwind directives in `frontend/src/index.css` and configuration in `frontend/tailwind.config.js`.
- Installed and set up `react-router-dom` for frontend routing with placeholder Home, Login, and Register pages.
- Enabled .env support in backend with `python-dotenv` and `load_dotenv()` in `backend/app.py`.

### Changed

- Upgraded TypeScript from 4.9.5 to 5.4.5 in `frontend/package.json`. Ran type checks and tests to verify compatibility.
- Updated documentation and configuration to reflect new frontend environment and backend .env support.
- Backend now fails fast if `.env` is missing or cannot be loaded: `backend/app.py` checks for the existence and successful loading of the `.env` file at startup, logs an error, and exits immediately if not found or invalid.

### Fixed

- Fixed DeepSource JS-0328 (unhandled promise) in `frontend/src/reportWebVitals.ts` by adding a `.catch` handler to the dynamic import of `web-vitals`.
- Fixed DeepSource JS-0323 (usage of `any` type) and JS-0105 (class methods should utilize `this`) in `frontend/src/App.tsx` by replacing `any` with `unknown` and ensuring correct method signatures and usage.
- Added `.env` to `.gitignore` explicitly.

### API Change Summary

_No new API changes in this release. See v0.8.0-alpha for the latest API additions._

## [v0.8.0-alpha] - 2025-07-03

### Added

- Complete backend password reset flow:
  - `POST /api/password-reset/request`: Accepts email, generates a secure, single-use, expiring token, stores it, and sends a password reset email (SMTP configurable via environment variables). Always returns a generic message for security. In development/testing, returns the token and expiration in the response.
  - `POST /api/password-reset/confirm`: Accepts token and new password, validates the token (unused, unexpired), enforces password strength, updates the user's password, and marks the token as used. Returns clear error messages for invalid, expired, or used tokens and for weak passwords.
  - Password reset email uses a template helper and includes the reset link and expiration time.
  - All password reset features are thoroughly tested, including edge cases (invalid/expired/used token, weak password, email delivery).
  - Added `expires_at` field to `PasswordResetToken` model and enforced UTC-aware expiration logic.
- All changes are fully documented in `docs/API.md` (endpoint usage, model, configuration, security notes).
- Logging is thorough and consistent across all new features.

### Changed

- Refactored all usages of deprecated `Query.get()` to `db.session.get()` for SQLAlchemy 2.x compatibility.
- Improved code and documentation organization for maintainability and clarity.

### API Change Summary

**New Endpoints:**

- `POST /api/password-reset/request` — Request a password reset token by email (secure, generic response, email delivery, token/expiration in dev/test).
- `POST /api/password-reset/confirm` — Confirm a password reset using a token and new password (validates, updates password, marks token as used, enforces expiration and strength).

**New Models:**

- `PasswordResetToken` — Stores password reset tokens, user association, expiration, and usage metadata for secure password reset flow.

**Changed:**

- All endpoints requiring primary key lookups now use `db.session.get()` for SQLAlchemy 2.x compatibility.

**Security:**

- Password reset flow is secure, generic, and robust against enumeration and replay attacks. All sensitive operations are logged. Expired/used tokens are rejected. Passwords are validated for strength and hashed securely.

**Testing:**

- All new features and edge cases are covered by automated tests. All tests pass.

**Documentation:**

- All new endpoints, models, and configuration options are documented in `docs/API.md`.
- Updated `ROADMAP.md` and `CHANGELOG.md` to reflect password reset backend milestone and dev versions.

### Frontend

- React + TypeScript app initialized in `frontend/`.
- Tailwind CSS v3 configured and working.
- React Router set up with placeholder pages.

## [v0.7.0-alpha] - 2025-07-02

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

## [v0.5.0-alpha] - 2025-07-02

### Added

- Task, Project, and User Profile CRUD API endpoints with robust validation, error handling, authentication, CSRF protection, timezone handling, and strict project/user ownership validation.
- Automated test suite covering all endpoints and features, including positive, negative, and edge cases, with authenticated test fixtures and CSRF fully disabled in test mode.
- Logging throughout all major logic branches, endpoints, and helper functions, with configurable log level via `LOG_LEVEL` environment variable.
- Documentation for all endpoints, features, and security practices in `docs/API.md`, `docs/architecture.md`, and supporting files.
- Policy-driven workflow, changelog, and documentation practices as defined in COPILOT_INSTRUCTIONS.md and VERSIONING.md.

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

<!-- Add new entries above this line as you progress! -->
