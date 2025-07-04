## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/), with personal tweaks for rewarding milestones and highly detailed dev versions.

## API Change Summary Requirement
- For every stable, alpha, or beta release, summarize all API changes (new endpoints, deleted endpoints, changes to endpoints, etc.) in the changelog, even if they were already documented in dev releases. This ensures the release notes provide a complete overview of API evolution for each version.

## [v0.12.0-dev1] - 2025-07-04
### Added
- Modern, consistent app-wide header (`AppHeader.tsx`) applied to all main pages (dashboard, home, login, register, password reset, project management).
- Unified background gradients and layout for all main pages for a visually consistent experience.
- Project Management UI (`ProjectListPage.tsx`):
  - Project listing with friendly empty state and instant updates.
  - Modal form for project creation (`ProjectForm.tsx`) with CSRF and error handling.
- Improved navigation: app title in header now links to home/dashboard.

### Changed
- Refactored authentication context (`auth.tsx`) to use a single source of truth (`token`), fixing redirect loops and ensuring persistent login state.
- Removed unused variables in `LoginPage.tsx`, `RegisterPage.tsx`, and `PasswordResetConfirmPage.tsx` to resolve ESLint warnings.
- Unified and modernized page backgrounds and layouts for a cohesive look.

### Fixed
- Debug output and troubleshooting for authentication and routing issues.
- All changes tested for robustness and user experience.

### API Change Summary
_No new API changes in this release. See previous entries for the latest API additions._

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

## [v0.11.0-dev3] - 2025-07-04
### Added
- Implemented a full-page, modern unauthenticated landing page (`HomePage.tsx`) with creative SVG background and feature highlights.
- Created a placeholder dashboard page (`DashboardPlaceholderPage.tsx`) for authenticated users, including a "Sign Out" button.
- Added a robust authentication context (`AuthProvider` and `useAuth` in `auth.tsx`) with persistent login state using localStorage.
- Updated login flow in `LoginPage.tsx` to use the actual authentication token from the backend and store it in localStorage.
- Refactored routing in `App.tsx` to use authentication state for route protection, showing the dashboard for authenticated users and the landing page for unauthenticated users.

### Fixed
- Removed unused `PrivateRoute` component from `App.tsx` to resolve DeepSource JS-0356 (unused variable).
- Reduced JSX nesting in `HomePage.tsx` by mapping over an array for feature cards, resolving DeepSource JS-0415 (JSX maximum depth).
- Replaced `!!token` with `Boolean(token)` in `auth.tsx` to resolve DeepSource JS-0066 (shorthand type coercion).

### Changed
- Refactored code for maintainability and code quality, addressing DeepSource issues and improving overall structure.
- Updated the changelog and roadmap to accurately reflect all new features, fixes, and improvements for this version.

## [v0.11.0-dev2] - 2025-07-03
### Added
- Implemented a robust frontend authentication context (`AuthProvider` and `useAuth`) to manage login state and protect routes.
- Added persistent authentication using localStorage, so users remain logged in after page refresh.
- Added a "Sign Out" button to the dashboard placeholder page, allowing users to securely log out and clear their session.
- Integrated route protection: authenticated users see the dashboard placeholder, unauthenticated users see the landing page, and public routes redirect appropriately.
- Updated login flow to call `login()` on successful authentication, ensuring the dashboard is shown immediately after login.

### Changed
- Refactored route logic in `App.tsx` to use `PrivateRoute` and `PublicRoute` wrappers for clean, maintainable access control.
- Improved user experience by providing instant feedback and redirect after login/logout.

## [v0.11.0-dev1] - 2025-07-03
### Changed
- Updated the ROADMAP.md to correctly reflect feature dependencies and the order of upcoming features, ensuring clarity on the development path and feature rollout sequence.

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

## [v0.10.0-dev5] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0417: Refactored all inline functions in JSX properties to stable, memoized handlers using `useCallback` in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev4] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0086: Removed assignment operator in return statement for the forgot password button in `LoginPage.tsx` by extracting the handler to a separate function.
- Fixed DeepSource JS-0246: Replaced string concatenation with template literals in RegExp construction in `getCookie` helpers in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev3] - 2025-07-03
### Added
- Added public `/api/csrf-token` endpoint: always generates and sets a CSRF token for the current session (even if unauthenticated) and returns it in JSON. This allows the frontend to fetch a CSRF token before submitting password reset or other unauthenticated forms, ensuring CSRF protection works for all users and fixing 403 errors on password reset.

### Changed
- Password reset email links now point to `/password-reset/confirm?token=...` on the frontend, matching the actual confirmation page route. The base URL is configurable via the `FRONTEND_BASE_URL` environment variable for both local and production use.
- Backend password reset flow and email delivery are now fully compatible with Gmail SMTP and any SMTP provider, using environment variables for configuration.

### Fixed
- Removed unused 'success' state variable from `RegisterPage.tsx` to resolve DeepSource JS-0356 (unused variable).
- Fixed CSRF 403 errors on password reset request and confirm pages: both now read the CSRF token from the `_csrf_token` cookie and send it in the `X-CSRF-Token` header, matching backend requirements. This ensures secure, robust password reset flow and resolves frontend-backend integration issues for these endpoints.

### Security
- `.env` is excluded from version control to protect sensitive credentials and secrets.
- Password reset and authentication flows are robust against timing attacks and enumeration.

## [v0.10.0-dev2] - 2025-07-03
### Fixed
- Refactored `RegisterPage.tsx` to use `useCallback` for event handlers and added explicit TypeScript types, resolving DeepSource JS-0417 (avoid local functions in JSX) and TypeScript compile errors.

### Added
- Scaffolded `LoginPage.tsx` in `frontend/src/pages/` with a login form (username/email and password), error/success handling, and API integration.
- Wired up `/login` route in `App.tsx` to use the new login page, replacing the placeholder.

### Changed
- Improved status messages on both login and registration pages: now use bold, visually distinct banners with icons, color, and animation for error and success states, enhancing user feedback and readability.

## [v0.10.0-dev1] - 2025-07-03
### Added
- Created `RegisterPage.tsx` in `frontend/src/pages/` with a registration form (username, email, password, confirm password), client-side validation, error/success messages, and API integration.
- Wired up `/register` route in `App.tsx` to use the new registration page, replacing the placeholder.
- Added Tailwind CSS styling to the registration form for a modern, responsive UI.
- Added development proxy (`proxy` field) to `frontend/package.json` to forward API requests to Flask backend on port 5000, resolving CORS/network issues during local development.

### Fixed
- Fixed network error when registering by ensuring frontend API requests are proxied to the correct backend port (5000) instead of default React port (3000).

### Changed
- Updated project workflow to start v0.10.0-alpha (Auth UI milestone) with registration page as the first step.

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

## [v0.9.0-dev3] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0323 (usage of `any` type) and JS-0105 (class methods should utilize `this`) in `frontend/src/App.tsx` by replacing `any` with `unknown` and ensuring correct method signatures and usage.

## [v0.9.0-dev2] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0328 (unhandled promise) in `frontend/src/reportWebVitals.ts` by adding a `.catch` handler to the dynamic import of `web-vitals`.
- Backend now fails fast if `.env` is missing or cannot be loaded: `backend/app.py` checks for the existence and successful loading of the `.env` file at startup, logs an error, and exits immediately if not found or invalid. This prevents silent configuration errors and ensures environment issues are detected early.
- Added `.env` to `.gitignore` explicitly
- Upgraded TypeScript from 4.9.5 to 5.4.5 in `frontend/package.json`. Ran type checks and tests to verify compatibility; no issues found.

### Added
- Added ErrorBoundary wrapper to `frontend/src/App.tsx` to catch runtime errors and display a user-friendly error message.
- Added a catch-all 404 Not Found route to `frontend/src/App.tsx` for unmatched paths, improving user experience and routing robustness.

## [v0.9.0-dev1] - 2025-07-03
### Added
- Initialized frontend React app with TypeScript in `frontend/`.
- Installed and configured Tailwind CSS (v3) for the frontend:
  - Added Tailwind directives to `frontend/src/index.css`.
  - Configured `frontend/tailwind.config.js` with correct content paths.
  - Documented and resolved Tailwind v4 CLI installation issues by using v3.
- Installed and set up `react-router-dom` for frontend routing:
  - Added basic routing in `frontend/src/App.tsx` with placeholder Home, Login, and Register pages.
- Enabled .env support in backend:
  - Installed `python-dotenv` and added `load_dotenv()` to `backend/app.py`.
  - Backend now loads configuration (e.g., SMTP, Flask secrets) from `.env`.

### Changed
- Updated documentation and configuration to reflect new frontend environment and backend .env support.

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

## [v0.10.0-dev5] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0417: Refactored all inline functions in JSX properties to stable, memoized handlers using `useCallback` in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev4] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0086: Removed assignment operator in return statement for the forgot password button in `LoginPage.tsx` by extracting the handler to a separate function.
- Fixed DeepSource JS-0246: Replaced string concatenation with template literals in RegExp construction in `getCookie` helpers in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev3] - 2025-07-03
### Added
- Added public `/api/csrf-token` endpoint: always generates and sets a CSRF token for the current session (even if unauthenticated) and returns it in JSON. This allows the frontend to fetch a CSRF token before submitting password reset or other unauthenticated forms, ensuring CSRF protection works for all users and fixing 403 errors on password reset.

### Changed
- Password reset email links now point to `/password-reset/confirm?token=...` on the frontend, matching the actual confirmation page route. The base URL is configurable via the `FRONTEND_BASE_URL` environment variable for both local and production use.
- Backend password reset flow and email delivery are now fully compatible with Gmail SMTP and any SMTP provider, using environment variables for configuration.

### Fixed
- Removed unused 'success' state variable from `RegisterPage.tsx` to resolve DeepSource JS-0356 (unused variable).
- Fixed CSRF 403 errors on password reset request and confirm pages: both now read the CSRF token from the `_csrf_token` cookie and send it in the `X-CSRF-Token` header, matching backend requirements. This ensures secure, robust password reset flow and resolves frontend-backend integration issues for these endpoints.

### Security
- `.env` is excluded from version control to protect sensitive credentials and secrets.
- Password reset and authentication flows are robust against timing attacks and enumeration.

## [v0.10.0-dev2] - 2025-07-03
### Fixed
- Refactored `RegisterPage.tsx` to use `useCallback` for event handlers and added explicit TypeScript types, resolving DeepSource JS-0417 (avoid local functions in JSX) and TypeScript compile errors.

### Added
- Scaffolded `LoginPage.tsx` in `frontend/src/pages/` with a login form (username/email and password), error/success handling, and API integration.
- Wired up `/login` route in `App.tsx` to use the new login page, replacing the placeholder.

### Changed
- Improved status messages on both login and registration pages: now use bold, visually distinct banners with icons, color, and animation for error and success states, enhancing user feedback and readability.

## [v0.10.0-dev1] - 2025-07-03
### Added
- Created `RegisterPage.tsx` in `frontend/src/pages/` with a registration form (username, email, password, confirm password), client-side validation, error/success messages, and API integration.
- Wired up `/register` route in `App.tsx` to use the new registration page, replacing the placeholder.
- Added Tailwind CSS styling to the registration form for a modern, responsive UI.
- Added development proxy (`proxy` field) to `frontend/package.json` to forward API requests to Flask backend on port 5000, resolving CORS/network issues during local development.

### Fixed
- Fixed network error when registering by ensuring frontend API requests are proxied to the correct backend port (5000) instead of default React port (3000).

### Changed
- Updated project workflow to start v0.10.0-alpha (Auth UI milestone) with registration page as the first step.

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

## [v0.9.0-dev3] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0323 (usage of `any` type) and JS-0105 (class methods should utilize `this`) in `frontend/src/App.tsx` by replacing `any` with `unknown` and ensuring correct method signatures and usage.

## [v0.9.0-dev2] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0328 (unhandled promise) in `frontend/src/reportWebVitals.ts` by adding a `.catch` handler to the dynamic import of `web-vitals`.
- Backend now fails fast if `.env` is missing or cannot be loaded: `backend/app.py` checks for the existence and successful loading of the `.env` file at startup, logs an error, and exits immediately if not found or invalid. This prevents silent configuration errors and ensures environment issues are detected early.
- Added `.env` to `.gitignore` explicitly
- Upgraded TypeScript from 4.9.5 to 5.4.5 in `frontend/package.json`. Ran type checks and tests to verify compatibility; no issues found.

### Added
- Added ErrorBoundary wrapper to `frontend/src/App.tsx` to catch runtime errors and display a user-friendly error message.
- Added a catch-all 404 Not Found route to `frontend/src/App.tsx` for unmatched paths, improving user experience and routing robustness.

## [v0.9.0-dev1] - 2025-07-03
### Added
- Initialized frontend React app with TypeScript in `frontend/`.
- Installed and configured Tailwind CSS (v3) for the frontend:
  - Added Tailwind directives to `frontend/src/index.css`.
  - Configured `frontend/tailwind.config.js` with correct content paths.
  - Documented and resolved Tailwind v4 CLI installation issues by using v3.
- Installed and set up `react-router-dom` for frontend routing:
  - Added basic routing in `frontend/src/App.tsx` with placeholder Home, Login, and Register pages.
- Enabled .env support in backend:
  - Installed `python-dotenv` and added `load_dotenv()` to `backend/app.py`.
  - Backend now loads configuration (e.g., SMTP, Flask secrets) from `.env`.

### Changed
- Updated documentation and configuration to reflect new frontend environment and backend .env support.

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

## [v0.10.0-dev5] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0417: Refactored all inline functions in JSX properties to stable, memoized handlers using `useCallback` in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev4] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0086: Removed assignment operator in return statement for the forgot password button in `LoginPage.tsx` by extracting the handler to a separate function.
- Fixed DeepSource JS-0246: Replaced string concatenation with template literals in RegExp construction in `getCookie` helpers in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev3] - 2025-07-03
### Added
- Added public `/api/csrf-token` endpoint: always generates and sets a CSRF token for the current session (even if unauthenticated) and returns it in JSON. This allows the frontend to fetch a CSRF token before submitting password reset or other unauthenticated forms, ensuring CSRF protection works for all users and fixing 403 errors on password reset.

### Changed
- Password reset email links now point to `/password-reset/confirm?token=...` on the frontend, matching the actual confirmation page route. The base URL is configurable via the `FRONTEND_BASE_URL` environment variable for both local and production use.
- Backend password reset flow and email delivery are now fully compatible with Gmail SMTP and any SMTP provider, using environment variables for configuration.

### Fixed
- Removed unused 'success' state variable from `RegisterPage.tsx` to resolve DeepSource JS-0356 (unused variable).
- Fixed CSRF 403 errors on password reset request and confirm pages: both now read the CSRF token from the `_csrf_token` cookie and send it in the `X-CSRF-Token` header, matching backend requirements. This ensures secure, robust password reset flow and resolves frontend-backend integration issues for these endpoints.

### Security
- `.env` is excluded from version control to protect sensitive credentials and secrets.
- Password reset and authentication flows are robust against timing attacks and enumeration.

## [v0.10.0-dev2] - 2025-07-03
### Fixed
- Refactored `RegisterPage.tsx` to use `useCallback` for event handlers and added explicit TypeScript types, resolving DeepSource JS-0417 (avoid local functions in JSX) and TypeScript compile errors.

### Added
- Scaffolded `LoginPage.tsx` in `frontend/src/pages/` with a login form (username/email and password), error/success handling, and API integration.
- Wired up `/login` route in `App.tsx` to use the new login page, replacing the placeholder.

### Changed
- Improved status messages on both login and registration pages: now use bold, visually distinct banners with icons, color, and animation for error and success states, enhancing user feedback and readability.

## [v0.10.0-dev1] - 2025-07-03
### Added
- Created `RegisterPage.tsx` in `frontend/src/pages/` with a registration form (username, email, password, confirm password), client-side validation, error/success messages, and API integration.
- Wired up `/register` route in `App.tsx` to use the new registration page, replacing the placeholder.
- Added Tailwind CSS styling to the registration form for a modern, responsive UI.
- Added development proxy (`proxy` field) to `frontend/package.json` to forward API requests to Flask backend on port 5000, resolving CORS/network issues during local development.

### Fixed
- Fixed network error when registering by ensuring frontend API requests are proxied to the correct backend port (5000) instead of default React port (3000).

### Changed
- Updated project workflow to start v0.10.0-alpha (Auth UI milestone) with registration page as the first step.

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

## [v0.9.0-dev3] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0323 (usage of `any` type) and JS-0105 (class methods should utilize `this`) in `frontend/src/App.tsx` by replacing `any` with `unknown` and ensuring correct method signatures and usage.

## [v0.9.0-dev2] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0328 (unhandled promise) in `frontend/src/reportWebVitals.ts` by adding a `.catch` handler to the dynamic import of `web-vitals`.
- Backend now fails fast if `.env` is missing or cannot be loaded: `backend/app.py` checks for the existence and successful loading of the `.env` file at startup, logs an error, and exits immediately if not found or invalid. This prevents silent configuration errors and ensures environment issues are detected early.
- Added `.env` to `.gitignore` explicitly
- Upgraded TypeScript from 4.9.5 to 5.4.5 in `frontend/package.json`. Ran type checks and tests to verify compatibility; no issues found.

### Added
- Added ErrorBoundary wrapper to `frontend/src/App.tsx` to catch runtime errors and display a user-friendly error message.
- Added a catch-all 404 Not Found route to `frontend/src/App.tsx` for unmatched paths, improving user experience and routing robustness.

## [v0.9.0-dev1] - 2025-07-03
### Added
- Initialized frontend React app with TypeScript in `frontend/`.
- Installed and configured Tailwind CSS (v3) for the frontend:
  - Added Tailwind directives to `frontend/src/index.css`.
  - Configured `frontend/tailwind.config.js` with correct content paths.
  - Documented and resolved Tailwind v4 CLI installation issues by using v3.
- Installed and set up `react-router-dom` for frontend routing:
  - Added basic routing in `frontend/src/App.tsx` with placeholder Home, Login, and Register pages.
- Enabled .env support in backend:
  - Installed `python-dotenv` and added `load_dotenv()` to `backend/app.py`.
  - Backend now loads configuration (e.g., SMTP, Flask secrets) from `.env`.

### Changed
- Updated documentation and configuration to reflect new frontend environment and backend .env support.

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

## [v0.10.0-dev5] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0417: Refactored all inline functions in JSX properties to stable, memoized handlers using `useCallback` in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev4] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0086: Removed assignment operator in return statement for the forgot password button in `LoginPage.tsx` by extracting the handler to a separate function.
- Fixed DeepSource JS-0246: Replaced string concatenation with template literals in RegExp construction in `getCookie` helpers in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev3] - 2025-07-03
### Added
- Added public `/api/csrf-token` endpoint: always generates and sets a CSRF token for the current session (even if unauthenticated) and returns it in JSON. This allows the frontend to fetch a CSRF token before submitting password reset or other unauthenticated forms, ensuring CSRF protection works for all users and fixing 403 errors on password reset.

### Changed
- Password reset email links now point to `/password-reset/confirm?token=...` on the frontend, matching the actual confirmation page route. The base URL is configurable via the `FRONTEND_BASE_URL` environment variable for both local and production use.
- Backend password reset flow and email delivery are now fully compatible with Gmail SMTP and any SMTP provider, using environment variables for configuration.

### Fixed
- Removed unused 'success' state variable from `RegisterPage.tsx` to resolve DeepSource JS-0356 (unused variable).
- Fixed CSRF 403 errors on password reset request and confirm pages: both now read the CSRF token from the `_csrf_token` cookie and send it in the `X-CSRF-Token` header, matching backend requirements. This ensures secure, robust password reset flow and resolves frontend-backend integration issues for these endpoints.

### Security
- `.env` is excluded from version control to protect sensitive credentials and secrets.
- Password reset and authentication flows are robust against timing attacks and enumeration.

## [v0.10.0-dev2] - 2025-07-03
### Fixed
- Refactored `RegisterPage.tsx` to use `useCallback` for event handlers and added explicit TypeScript types, resolving DeepSource JS-0417 (avoid local functions in JSX) and TypeScript compile errors.

### Added
- Scaffolded `LoginPage.tsx` in `frontend/src/pages/` with a login form (username/email and password), error/success handling, and API integration.
- Wired up `/login` route in `App.tsx` to use the new login page, replacing the placeholder.

### Changed
- Improved status messages on both login and registration pages: now use bold, visually distinct banners with icons, color, and animation for error and success states, enhancing user feedback and readability.

## [v0.10.0-dev1] - 2025-07-03
### Added
- Created `RegisterPage.tsx` in `frontend/src/pages/` with a registration form (username, email, password, confirm password), client-side validation, error/success messages, and API integration.
- Wired up `/register` route in `App.tsx` to use the new registration page, replacing the placeholder.
- Added Tailwind CSS styling to the registration form for a modern, responsive UI.
- Added development proxy (`proxy` field) to `frontend/package.json` to forward API requests to Flask backend on port 5000, resolving CORS/network issues during local development.

### Fixed
- Fixed network error when registering by ensuring frontend API requests are proxied to the correct backend port (5000) instead of default React port (3000).

### Changed
- Updated project workflow to start v0.10.0-alpha (Auth UI milestone) with registration page as the first step.

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

## [v0.9.0-dev3] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0323 (usage of `any` type) and JS-0105 (class methods should utilize `this`) in `frontend/src/App.tsx` by replacing `any` with `unknown` and ensuring correct method signatures and usage.

## [v0.9.0-dev2] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0328 (unhandled promise) in `frontend/src/reportWebVitals.ts` by adding a `.catch` handler to the dynamic import of `web-vitals`.
- Backend now fails fast if `.env` is missing or cannot be loaded: `backend/app.py` checks for the existence and successful loading of the `.env` file at startup, logs an error, and exits immediately if not found or invalid. This prevents silent configuration errors and ensures environment issues are detected early.
- Added `.env` to `.gitignore` explicitly
- Upgraded TypeScript from 4.9.5 to 5.4.5 in `frontend/package.json`. Ran type checks and tests to verify compatibility; no issues found.

### Added
- Added ErrorBoundary wrapper to `frontend/src/App.tsx` to catch runtime errors and display a user-friendly error message.
- Added a catch-all 404 Not Found route to `frontend/src/App.tsx` for unmatched paths, improving user experience and routing robustness.

## [v0.9.0-dev1] - 2025-07-03
### Added
- Initialized frontend React app with TypeScript in `frontend/`.
- Installed and configured Tailwind CSS (v3) for the frontend:
  - Added Tailwind directives to `frontend/src/index.css`.
  - Configured `frontend/tailwind.config.js` with correct content paths.
  - Documented and resolved Tailwind v4 CLI installation issues by using v3.
- Installed and set up `react-router-dom` for frontend routing:
  - Added basic routing in `frontend/src/App.tsx` with placeholder Home, Login, and Register pages.
- Enabled .env support in backend:
  - Installed `python-dotenv` and added `load_dotenv()` to `backend/app.py`.
  - Backend now loads configuration (e.g., SMTP, Flask secrets) from `.env`.

### Changed
- Updated documentation and configuration to reflect new frontend environment and backend .env support.

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

## [v0.10.0-dev5] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0417: Refactored all inline functions in JSX properties to stable, memoized handlers using `useCallback` in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev4] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0086: Removed assignment operator in return statement for the forgot password button in `LoginPage.tsx` by extracting the handler to a separate function.
- Fixed DeepSource JS-0246: Replaced string concatenation with template literals in RegExp construction in `getCookie` helpers in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev3] - 2025-07-03
### Added
- Added public `/api/csrf-token` endpoint: always generates and sets a CSRF token for the current session (even if unauthenticated) and returns it in JSON. This allows the frontend to fetch a CSRF token before submitting password reset or other unauthenticated forms, ensuring CSRF protection works for all users and fixing 403 errors on password reset.

### Changed
- Password reset email links now point to `/password-reset/confirm?token=...` on the frontend, matching the actual confirmation page route. The base URL is configurable via the `FRONTEND_BASE_URL` environment variable for both local and production use.
- Backend password reset flow and email delivery are now fully compatible with Gmail SMTP and any SMTP provider, using environment variables for configuration.

### Fixed
- Removed unused 'success' state variable from `RegisterPage.tsx` to resolve DeepSource JS-0356 (unused variable).
- Fixed CSRF 403 errors on password reset request and confirm pages: both now read the CSRF token from the `_csrf_token` cookie and send it in the `X-CSRF-Token` header, matching backend requirements. This ensures secure, robust password reset flow and resolves frontend-backend integration issues for these endpoints.

### Security
- `.env` is excluded from version control to protect sensitive credentials and secrets.
- Password reset and authentication flows are robust against timing attacks and enumeration.

## [v0.10.0-dev2] - 2025-07-03
### Fixed
- Refactored `RegisterPage.tsx` to use `useCallback` for event handlers and added explicit TypeScript types, resolving DeepSource JS-0417 (avoid local functions in JSX) and TypeScript compile errors.

### Added
- Scaffolded `LoginPage.tsx` in `frontend/src/pages/` with a login form (username/email and password), error/success handling, and API integration.
- Wired up `/login` route in `App.tsx` to use the new login page, replacing the placeholder.

### Changed
- Improved status messages on both login and registration pages: now use bold, visually distinct banners with icons, color, and animation for error and success states, enhancing user feedback and readability.

## [v0.10.0-dev1] - 2025-07-03
### Added
- Created `RegisterPage.tsx` in `frontend/src/pages/` with a registration form (username, email, password, confirm password), client-side validation, error/success messages, and API integration.
- Wired up `/register` route in `App.tsx` to use the new registration page, replacing the placeholder.
- Added Tailwind CSS styling to the registration form for a modern, responsive UI.
- Added development proxy (`proxy` field) to `frontend/package.json` to forward API requests to Flask backend on port 5000, resolving CORS/network issues during local development.

### Fixed
- Fixed network error when registering by ensuring frontend API requests are proxied to the correct backend port (5000) instead of default React port (3000).

### Changed
- Updated project workflow to start v0.10.0-alpha (Auth UI milestone) with registration page as the first step.

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

## [v0.9.0-dev3] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0323 (usage of `any` type) and JS-0105 (class methods should utilize `this`) in `frontend/src/App.tsx` by replacing `any` with `unknown` and ensuring correct method signatures and usage.

## [v0.9.0-dev2] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0328 (unhandled promise) in `frontend/src/reportWebVitals.ts` by adding a `.catch` handler to the dynamic import of `web-vitals`.
- Backend now fails fast if `.env` is missing or cannot be loaded: `backend/app.py` checks for the existence and successful loading of the `.env` file at startup, logs an error, and exits immediately if not found or invalid. This prevents silent configuration errors and ensures environment issues are detected early.
- Added `.env` to `.gitignore` explicitly
- Upgraded TypeScript from 4.9.5 to 5.4.5 in `frontend/package.json`. Ran type checks and tests to verify compatibility; no issues found.

### Added
- Added ErrorBoundary wrapper to `frontend/src/App.tsx` to catch runtime errors and display a user-friendly error message.
- Added a catch-all 404 Not Found route to `frontend/src/App.tsx` for unmatched paths, improving user experience and routing robustness.

## [v0.9.0-dev1] - 2025-07-03
### Added
- Initialized frontend React app with TypeScript in `frontend/`.
- Installed and configured Tailwind CSS (v3) for the frontend:
  - Added Tailwind directives to `frontend/src/index.css`.
  - Configured `frontend/tailwind.config.js` with correct content paths.
  - Documented and resolved Tailwind v4 CLI installation issues by using v3.
- Installed and set up `react-router-dom` for frontend routing:
  - Added basic routing in `frontend/src/App.tsx` with placeholder Home, Login, and Register pages.
- Enabled .env support in backend:
  - Installed `python-dotenv` and added `load_dotenv()` to `backend/app.py`.
  - Backend now loads configuration (e.g., SMTP, Flask secrets) from `.env`.

### Changed
- Updated documentation and configuration to reflect new frontend environment and backend .env support.

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

## [v0.10.0-dev5] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0417: Refactored all inline functions in JSX properties to stable, memoized handlers using `useCallback` in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev4] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0086: Removed assignment operator in return statement for the forgot password button in `LoginPage.tsx` by extracting the handler to a separate function.
- Fixed DeepSource JS-0246: Replaced string concatenation with template literals in RegExp construction in `getCookie` helpers in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev3] - 2025-07-03
### Added
- Added public `/api/csrf-token` endpoint: always generates and sets a CSRF token for the current session (even if unauthenticated) and returns it in JSON. This allows the frontend to fetch a CSRF token before submitting password reset or other unauthenticated forms, ensuring CSRF protection works for all users and fixing 403 errors on password reset.

### Changed
- Password reset email links now point to `/password-reset/confirm?token=...` on the frontend, matching the actual confirmation page route. The base URL is configurable via the `FRONTEND_BASE_URL` environment variable for both local and production use.
- Backend password reset flow and email delivery are now fully compatible with Gmail SMTP and any SMTP provider, using environment variables for configuration.

### Fixed
- Removed unused 'success' state variable from `RegisterPage.tsx` to resolve DeepSource JS-0356 (unused variable).
- Fixed CSRF 403 errors on password reset request and confirm pages: both now read the CSRF token from the `_csrf_token` cookie and send it in the `X-CSRF-Token` header, matching backend requirements. This ensures secure, robust password reset flow and resolves frontend-backend integration issues for these endpoints.

### Security
- `.env` is excluded from version control to protect sensitive credentials and secrets.
- Password reset and authentication flows are robust against timing attacks and enumeration.

## [v0.10.0-dev2] - 2025-07-03
### Fixed
- Refactored `RegisterPage.tsx` to use `useCallback` for event handlers and added explicit TypeScript types, resolving DeepSource JS-0417 (avoid local functions in JSX) and TypeScript compile errors.

### Added
- Scaffolded `LoginPage.tsx` in `frontend/src/pages/` with a login form (username/email and password), error/success handling, and API integration.
- Wired up `/login` route in `App.tsx` to use the new login page, replacing the placeholder.

### Changed
- Improved status messages on both login and registration pages: now use bold, visually distinct banners with icons, color, and animation for error and success states, enhancing user feedback and readability.

## [v0.10.0-dev1] - 2025-07-03
### Added
- Created `RegisterPage.tsx` in `frontend/src/pages/` with a registration form (username, email, password, confirm password), client-side validation, error/success messages, and API integration.
- Wired up `/register` route in `App.tsx` to use the new registration page, replacing the placeholder.
- Added Tailwind CSS styling to the registration form for a modern, responsive UI.
- Added development proxy (`proxy` field) to `frontend/package.json` to forward API requests to Flask backend on port 5000, resolving CORS/network issues during local development.

### Fixed
- Fixed network error when registering by ensuring frontend API requests are proxied to the correct backend port (5000) instead of default React port (3000).

### Changed
- Updated project workflow to start v0.10.0-alpha (Auth UI milestone) with registration page as the first step.

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

## [v0.9.0-dev3] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0323 (usage of `any` type) and JS-0105 (class methods should utilize `this`) in `frontend/src/App.tsx` by replacing `any` with `unknown` and ensuring correct method signatures and usage.

## [v0.9.0-dev2] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0328 (unhandled promise) in `frontend/src/reportWebVitals.ts` by adding a `.catch` handler to the dynamic import of `web-vitals`.
- Backend now fails fast if `.env` is missing or cannot be loaded: `backend/app.py` checks for the existence and successful loading of the `.env` file at startup, logs an error, and exits immediately if not found or invalid. This prevents silent configuration errors and ensures environment issues are detected early.
- Added `.env` to `.gitignore` explicitly
- Upgraded TypeScript from 4.9.5 to 5.4.5 in `frontend/package.json`. Ran type checks and tests to verify compatibility; no issues found.

### Added
- Added ErrorBoundary wrapper to `frontend/src/App.tsx` to catch runtime errors and display a user-friendly error message.
- Added a catch-all 404 Not Found route to `frontend/src/App.tsx` for unmatched paths, improving user experience and routing robustness.

## [v0.9.0-dev1] - 2025-07-03
### Added
- Initialized frontend React app with TypeScript in `frontend/`.
- Installed and configured Tailwind CSS (v3) for the frontend:
  - Added Tailwind directives to `frontend/src/index.css`.
  - Configured `frontend/tailwind.config.js` with correct content paths.
  - Documented and resolved Tailwind v4 CLI installation issues by using v3.
- Installed and set up `react-router-dom` for frontend routing:
  - Added basic routing in `frontend/src/App.tsx` with placeholder Home, Login, and Register pages.
- Enabled .env support in backend:
  - Installed `python-dotenv` and added `load_dotenv()` to `backend/app.py`.
  - Backend now loads configuration (e.g., SMTP, Flask secrets) from `.env`.

### Changed
- Updated documentation and configuration to reflect new frontend environment and backend .env support.

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

## [v0.10.0-dev5] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0417: Refactored all inline functions in JSX properties to stable, memoized handlers using `useCallback` in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev4] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0086: Removed assignment operator in return statement for the forgot password button in `LoginPage.tsx` by extracting the handler to a separate function.
- Fixed DeepSource JS-0246: Replaced string concatenation with template literals in RegExp construction in `getCookie` helpers in `PasswordResetRequestPage.tsx` and `PasswordResetConfirmPage.tsx`.

## [v0.10.0-dev3] - 2025-07-03
### Added
- Added public `/api/csrf-token` endpoint: always generates and sets a CSRF token for the current session (even if unauthenticated) and returns it in JSON. This allows the frontend to fetch a CSRF token before submitting password reset or other unauthenticated forms, ensuring CSRF protection works for all users and fixing 403 errors on password reset.

### Changed
- Password reset email links now point to `/password-reset/confirm?token=...` on the frontend, matching the actual confirmation page route. The base URL is configurable via the `FRONTEND_BASE_URL` environment variable for both local and production use.
- Backend password reset flow and email delivery are now fully compatible with Gmail SMTP and any SMTP provider, using environment variables for configuration.

### Fixed
- Removed unused 'success' state variable from `RegisterPage.tsx` to resolve DeepSource JS-0356 (unused variable).
- Fixed CSRF 403 errors on password reset request and confirm pages: both now read the CSRF token from the `_csrf_token` cookie and send it in the `X-CSRF-Token` header, matching backend requirements. This ensures secure, robust password reset flow and resolves frontend-backend integration issues for these endpoints.

### Security
- `.env` is excluded from version control to protect sensitive credentials and secrets.
- Password reset and authentication flows are robust against timing attacks and enumeration.

## [v0.10.0-dev2] - 2025-07-03
### Fixed
- Refactored `RegisterPage.tsx` to use `useCallback` for event handlers and added explicit TypeScript types, resolving DeepSource JS-0417 (avoid local functions in JSX) and TypeScript compile errors.

### Added
- Scaffolded `LoginPage.tsx` in `frontend/src/pages/` with a login form (username/email and password), error/success handling, and API integration.
- Wired up `/login` route in `App.tsx` to use the new login page, replacing the placeholder.

### Changed
- Improved status messages on both login and registration pages: now use bold, visually distinct banners with icons, color, and animation for error and success states, enhancing user feedback and readability.

## [v0.10.0-dev1] - 2025-07-03
### Added
- Created `RegisterPage.tsx` in `frontend/src/pages/` with a registration form (username, email, password, confirm password), client-side validation, error/success messages, and API integration.
- Wired up `/register` route in `App.tsx` to use the new registration page, replacing the placeholder.
- Added Tailwind CSS styling to the registration form for a modern, responsive UI.
- Added development proxy (`proxy` field) to `frontend/package.json` to forward API requests to Flask backend on port 5000, resolving CORS/network issues during local development.

### Fixed
- Fixed network error when registering by ensuring frontend API requests are proxied to the correct backend port (5000) instead of default React port (3000).

### Changed
- Updated project workflow to start v0.10.0-alpha (Auth UI milestone) with registration page as the first step.

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

## [v0.9.0-dev3] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0323 (usage of `any` type) and JS-0105 (class methods should utilize `this`) in `frontend/src/App.tsx` by replacing `any` with `unknown` and ensuring correct method signatures and usage.

## [v0.9.0-dev2] - 2025-07-03
### Fixed
- Fixed DeepSource JS-0328 (unhandled promise) in `frontend/src/reportWebVitals.ts` by adding a `.catch` handler to the dynamic import of `web-vitals`.
- Backend now fails fast if `.env` is missing or cannot be loaded: `backend/app.py` checks for the existence and successful loading of the `.env` file at startup, logs an error, and exits immediately if not found or invalid. This prevents silent configuration errors and ensures environment issues are detected early.
- Added `.env` to `.gitignore` explicitly
- Upgraded TypeScript from 4.9.5 to 5.4.5 in `frontend/package.json`. Ran type checks and tests to verify compatibility; no issues found.

### Added
- Added ErrorBoundary wrapper to `frontend/src/App.tsx` to catch runtime errors and display a user-friendly error message.
- Added a catch-all 404 Not Found route to `frontend/src/App.tsx` for unmatched paths, improving user experience and routing robustness.

## [v0.9.0-dev1] - 2025-07-03
### Added
- Initialized frontend React app with TypeScript in `frontend/`.
- Installed and configured Tailwind CSS (v3) for the frontend:
  - Added Tailwind directives to `frontend/src/index.css`.
  - Configured `frontend/tailwind.config.js` with correct content paths.
  - Documented and resolved Tailwind v4 CLI installation issues by using v3.
- Installed and set up `react-router-dom` for frontend routing:
  - Added basic routing in `frontend/src/App.tsx` with placeholder Home, Login, and Register pages.
- Enabled .env support in backend:
  - Installed `python-dotenv` and added `load_dotenv()` to `backend/app.py`.
  - Backend now loads configuration (e.g., SMTP, Flask secrets) from `.env`.

### Changed
- Updated documentation and configuration to reflect new frontend environment and backend .env support.

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