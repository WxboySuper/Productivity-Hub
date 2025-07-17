## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/), with personal tweaks for rewarding milestones and highly detailed dev versions.

## API Change Summary Requirement
- For every stable, alpha, or beta release, summarize all API changes (new endpoints, deleted endpoints, changes to endpoints, etc.) in the changelog, even if they were already documented in dev releases. This ensures the release notes provide a complete overview of API evolution for each version.

## [v0.12.0-dev10] - 2025-07-15

### Test Infrastructure Improvements
- Refactored MainManagementWindow UI tests: Split monolithic 4,147-line test file into 9 focused, maintainable test files (3,437 lines total)
- Fixed 31 failing tests caused by component migration to hooks architecture (`useProjects`, `useTasks`)
- Created organized test directory structure: `/MainManagementWindow/` with 9 specialized test files covering all feature areas
- Added test utilities: Centralized mock setups and common patterns in `testUtils.ts` to eliminate code duplication
- Enhanced test safety: Added 5-second timeouts to all `waitFor` calls for better test reliability
- Fixed async testing patterns: Corrected improper `await` usage in test callbacks and separated `act()` from `waitFor()` calls

### Test Coverage Organization
- Initial Render & Sidebar tests: 6 tests for component mounting, navigation, and logout functionality
- Task Form & Management tests: 7 tests for task CRUD operations and form handling
- Project Form & Management tests: 6 tests for project operations and deletion confirmation
- Quick Tasks tests: 3 tests for rapid task creation and management
- Background & Toast Provider tests: 3 tests for notification and background processing
- Error Handling & Edge Cases tests: 10 tests for error scenarios and boundary conditions
- State Management & UI Interactions tests: 21 tests for component state and user interactions
- Helper Functions tests: 21 tests for utility function coverage
- Additional Coverage tests: 23 tests for comprehensive feature validation

### Technical Fixes
- Updated component mocking: Fixed TaskForm, ProjectForm, and TaskDetails mocks for hook-based architecture
- Resolved duplicate element selection: Fixed "Found multiple elements" errors with specific DOM targeting
- Corrected hook mock structure: Aligned API response mocks with `useProjects`/`useTasks` hook expectations
- Fixed import paths: Resolved all test import issues after directory restructuring

## [v0.12.0-dev9] - 2025-07-13
### Added
- **Complete UI/UX System Overhaul:** Implemented a comprehensive modern UI design system with multiple themes and dynamic backgrounds
  - **Dynamic Background System:** Added 10 creative background themes with smooth animations including Creative Dots, Neural Network, Cosmic Waves, Aurora Borealis, Ocean Depths, and more
  - **Background Switcher:** Interactive background switcher with real-time preview in the top-right corner
  - **Form System Redesign:** Complete overhaul of all forms with modern, productivity-focused design inspired by ClickUp/Todoist
  - **Advanced Form Components:** New creative form system with floating labels, animated inputs, priority selectors, and expandable sections
  - **Component Architecture:** Modular component structure for scalable UI development

- **Enhanced Authentication System:** 
  - **CSRF Token Security:** Fixed critical CSRF token validation issues by correcting cookie vs session token handling
  - **Authentication Context:** Robust auth state management with proper session validation
  - **Error Handling:** Comprehensive error boundary system with toast notifications
  - **Logout Verification:** Enhanced logout process with backend verification

- **Advanced Error Handling & User Feedback:**
  - **ErrorBoundary Component:** React error boundary with graceful fallbacks and detailed error reporting
  - **Toast Notification System:** Modern toast provider with success, error, warning, and info notifications
  - **Loading States:** Comprehensive loading indicators throughout the application
  - **Form Validation:** Real-time form validation with user-friendly error messages

- **Creative Components & Layout System:**
  - **Multiple Form Variants:** Created 5+ different form design systems (Creative, Productive, Modern, Advanced Creative, etc.)
  - **Background Context:** Global background state management with React Context
  - **Responsive Design:** Mobile-first responsive design across all components
  - **CSS Architecture:** Organized CSS system with modular stylesheets for each component type

### Changed
- **Authentication Flow:** 
  - Completely redesigned authentication components with modern UI
  - Enhanced session management with proper cleanup on logout
  - Improved CSRF token handling throughout the application
  - Fixed authentication state persistence issues

- **Main Management Interface:**
  - Redesigned sidebar with collapsible navigation
  - Modern card-based layout for tasks and projects
  - Enhanced typography and spacing throughout
  - Improved visual hierarchy and information architecture

- **Form Interactions:**
  - Complete redesign of task and project forms with modern UX patterns
  - Progressive disclosure for advanced options
  - Improved field validation and error display
  - Enhanced accessibility with proper focus management

- **Notification System:**
  - Protected notification API calls from unauthenticated access
  - Improved notification center with better visual design
  - Enhanced notification cleanup on authentication state changes

### Fixed
- **Critical CSRF Security Issue:** Resolved CSRF token validation failures where backend was incorrectly checking session storage instead of cookie values
- **Authentication Logout:** Fixed logout functionality that was failing due to CSRF token mismatches
- **Debug Panel Removal:** Removed development debug authentication panel from production build
- **API Error Handling:** Improved error handling for all API endpoints with proper user feedback
- **Form State Management:** Fixed form state persistence and validation issues
- **Memory Leaks:** Resolved potential memory leaks in notification polling and authentication checks
- **Console Log Cleanup:** Removed 15+ debug console.log statements from production code while preserving essential error logging

### Security
- **CSRF Protection:** Enhanced CSRF token validation system with proper cookie-based verification
- **Session Security:** Improved session management with secure logout verification
- **Authentication Guards:** Added comprehensive authentication guards throughout the application
- **API Security:** Protected all API endpoints with proper authentication and CSRF validation

### Performance
- **Component Optimization:** Optimized React components with proper memoization and state management
- **CSS Optimization:** Streamlined CSS with efficient animations and reduced reflows
- **Background Rendering:** Optimized dynamic background rendering with GPU acceleration
- **Bundle Size:** Improved code splitting and component lazy loading
- **Debug Code Cleanup:** Removed 15+ development console.log statements to reduce runtime overhead and prevent debug information exposure

### Developer Experience
- **CSS Architecture:** Organized stylesheet structure with clear naming conventions
- **Component Library:** Created reusable component library for consistent UI development
- **Type Safety:** Enhanced TypeScript types throughout the application
- **Code Organization:** Improved file structure and component organization
- **Code Quality:** Removed debug logging and cleaned up development artifacts for production readiness

### API Changes
- **CSRF Token Endpoint:** Enhanced `/api/csrf-token` endpoint reliability
- **Authentication Endpoints:** Improved session validation and cleanup
- **Error Responses:** Standardized error response format across all endpoints
- **Security Headers:** Enhanced security headers for CSRF protection

### Breaking Changes
- **Component API:** Some component props may have changed due to UI system overhaul
- **CSS Classes:** Custom CSS classes may need updates due to new design system
- **Authentication:** Authentication state management behavior has been enhanced

### Migration Notes
- **UI Components:** All forms and UI components have been updated with new design system
- **Authentication:** Enhanced authentication flow may require re-login for existing sessions
- **Notifications:** Notification system has been enhanced with new security measures

## [v0.12.0-dev8] - 2025-07-09
### Added
- **Robust Notification Timing:** Implemented production-ready, resilient notification/reminder timing for all users. Notifications (in-app and browser/OS) now appear only once, at the correct time, and are resilient to server/client restarts.
- **Persistent Notification Scheduling:** Added a persistent `show_at` (appear at) field to the Notification model and database (Alembic migration). All notification logic now uses this field for precise, reliable scheduling.
- **Frontend Notification Logic:** Updated `NotificationCenter.tsx` to use `show_at` for notification timing, ensuring notifications are shown only once and at the intended time. Fixed all double-conversion and timezone bugs in notification display and reminder handling.
- **Backend Notification Logic:** Updated backend endpoints and reminder job to use and return `show_at` for all notifications. All notification and reminder logic now uses UTC consistently.
- **Date Precision Fix:** Trimmed `show_at` to seconds precision in frontend to avoid JS Date precision issues.
- **API Documentation:** Updated `docs/API.md` to document new/changed notification and reminder fields and endpoints.
- **UI Dependencies:** Added `@mui/material`, `@emotion/react`, and `@emotion/styled` to frontend dependencies for improved notification UI.

### Changed
- **Timezone Handling:** All time handling is now robust: backend stores/returns `show_at` in UTC, frontend converts local input to UTC exactly once, and all logic uses UTC. Eliminated all timezone/double-conversion bugs in both backend and frontend.
- **Notification/Reminder Logic:** All notification and reminder logic now uses the persistent `show_at` field for scheduling and display. Removed all previous ad-hoc or test/dev logic for notification timing.
- **Frontend Reminder Input:** Fixed all double-conversion bugs in `TaskFormModal.tsx` (reminder time input and submission).
- **Code Cleanup:** Removed all debug logging, test notification injectors, and test listeners from `NotificationCenter.tsx`. Removed `TestReminderPopup` and all test notification code from `App.tsx`. Cleaned up `TaskFormModal.tsx` to ensure only production logic remains.
- **Backend Cleanup:** Removed `/api/notifications/test-create` endpoint and all test/dev-only reminder code from `app.py`.
- **Database Migration:** Added Alembic migration for `show_at` field in Notification table.

### Removed
- All test/dev-only code and endpoints related to notifications and reminders from both backend and frontend. Restored production-like behavior throughout the codebase.

### API Change Summary
- **Notification model:** Added persistent `show_at` (UTC, ISO 8601) field for all notifications.
- **Notification endpoints:** All endpoints now use and return `show_at` for notification scheduling and display.
- **Removed:** All test/dev-only notification endpoints and fields.
- **Task API:** Reminder fields (`reminder_time`, `reminder_recurring`, `reminder_snoozed_until`, `reminder_enabled`) remain as in previous dev version, but all reminder logic now uses robust UTC handling and persistent scheduling.
- See `docs/API.md` for full details and updated field descriptions.

## [v0.12.0-dev7] - 2025-07-09
### Changed
- Implemented task dependencies (Blocked By/Blocking) in backend, API, and frontend UI.
  - Backend: Added self-referential many-to-many relationship (`task_dependencies` table) to Task model for dependencies.
  - API: Added endpoints for managing dependencies (`GET/POST/PATCH /api/tasks/<id>/dependencies`), updated main task endpoints to accept `blocked_by` and `blocking` arrays, and improved serialization to include dependency info.
  - Frontend: Added multi-select dropdown for "Blocking" tasks in TaskFormModal ("Blocked By" is now read-only and derived from other tasks' "Blocking" fields). Dependencies are displayed in TaskDetailsModal with clickable links.
  - UI: Practical blocking logic—tasks cannot be marked complete if blocked by incomplete tasks or have incomplete subtasks. Clear message shown explaining why completion is disabled.
  - Fixed linting error in TaskDetailsModal.tsx (undefined `tasks` variable) by passing all tasks as a prop.
  - Clarified dependency editing: only "Blocking" is user-editable; "Blocked By" is derived and read-only.
  - Improved task fetching in TaskFormModal: tasks are only fetched once when the modal opens, not on every render.

### Fixed
- Logging and error handling added for all new backend logic.

### API Change Summary
- Added `task_dependencies` table and self-referential many-to-many relationship to Task model.
- New endpoints:
  - `GET /api/tasks/<id>/dependencies`
  - `POST /api/tasks/<id>/dependencies`
  - `PATCH /api/tasks/<id>/dependencies`
- Updated main task create/update endpoints to accept `blocked_by` and `blocking` arrays.
- Task serialization now includes `blocked_by` and `blocking` arrays in API responses.

## [v0.12.0-dev6] - 2025-07-08
### Changed
- Migrated frontend from Create React App to Vite (Vite config, scripts, and entry points updated; CRA config removed).
- Refactored `frontend/src/pages/MainManagementWindow.tsx` to use a robust `ensureCsrfToken` helper for all project and task CRUD flows.
- Updated all project and task CRUD handlers to use the new CSRF logic for security and reliability.
- Improved error handling and consistency for all API calls in `MainManagementWindow.tsx`.
- Updated checklist and docs to reflect completed features and bug fixes for v0.12.0-beta.

### Fixed
- Fixed missing CSRF token in the add project button and all project/task CRUD flows in `MainManagementWindow.tsx`.
- Fixed React hook order errors and modal logic in `TaskDetailsModal` and related components.
- Fixed project creation modal logic and ensured correct modal opens from Projects tab.
- Fixed project assignment and clearing in all CRUD flows.
- Fixed date/time offset issues in backend for recurring tasks.

### API Change Summary
- No new endpoints in this dev release, but all state-changing project and task API requests now robustly require and send a CSRF token using the new helper.
- All frontend API calls for project/task CRUD now use the new CSRF logic for security and reliability.

## [v0.12.0-dev5] - 2025-07-05
### Changed
- Updated `.gitignore` to add rules for `docs/temp/*` and `docs/temp` (temp docs exclusion).
- Upgraded `requirements.txt` (Python dependencies) for backend: added/updated `python-dateutil` and other packages for recurrence and datetime support.
- Backend (`backend/app.py`):
  - Added robust recurrence support for tasks, including `next_occurrence` calculation in API responses.
  - Improved `parse_local_datetime` to avoid double-applying timezone info.
  - Added `get_next_occurrence` helper for recurring tasks.
  - Fixed bug: updating a task with `project_id` as `None` or missing now clears the project assignment in the database (allows moving tasks to quick tasks).
  - Refactored `update_task` endpoint to always process `project_id` and ensure correct clearing/assignment.
- Frontend (`frontend/src/components/TaskFormModal.tsx`, `TaskDetailsModal.tsx`, `MainManagementWindow.tsx`):
  - TaskFormModal: Now sends `undefined` for `project_id` when "None (Quick Task)" is selected, allowing backend to clear project assignment.
  - TaskDetailsModal: Displays `next_occurrence` for recurring tasks.
  - MainManagementWindow: Normalizes `project_id`/`projectId` mapping, ensures projects are loaded before tasks/forms, and fixes all project/task assignment flows.
  - Fixed: Editing a task to remove its project now updates both backend and UI correctly.
  - Fixed: Task Details modal closes before edit form opens, preventing modal stacking issues.
  - Fixed: Project dropdown in TaskFormModal always loads projects before opening the form.
  - Fixed: "+ Add Project" button and project creation modal in projects tab.
  - Removed deprecated project management button from dashboard placeholder.

### Fixed
- All bugs related to project assignment, quick task conversion, and modal stacking in task/project management flows.
- Ensured all CRUD flows for tasks and projects work as expected, including clearing project assignment.

### API Change Summary
- `PUT /api/tasks/<task_id>`: Now allows clearing a task's project assignment by omitting or setting `project_id` to `null`/`None` in the request body. This moves a task from a project to a quick task.
- Task API responses now include a `next_occurrence` field for recurring tasks.

## [v0.12.0-dev4] - 2025-07-04
### Added
- Main Management Window (`MainManagementWindow.tsx`):  
  - Modern, scalable UI for project and task management with a collapsible sidebar (Add New, All Tasks, Quick Tasks, Projects).
  - Sidebar navigation with prominent "Add New" button and improved accessibility.
  - Integrated project management UI under the "Projects" tab, including project info bar and CRUD operations.
  - Task management views: All Tasks, Quick Tasks, and Project Tasks, each with clear distinction and empty state UI.
  - Task Details modal (`TaskDetailsModal.tsx`) for viewing all task info, including before-start indicator and recurrence display.
  - TaskFormModal (`TaskFormModal.tsx`) for adding and editing tasks, supporting all fields, recurrence, and date/time split.
  - Visual indicator for tasks before their start date/time in TaskDetailsModal.
  - Edit button in TaskDetailsModal opens TaskFormModal in edit mode, pre-filled with task data.

### Changed
- Refactored task and project CRUD logic to use real backend API for all operations, with robust error and loading state handling.
- TaskFormModal now supports both add and edit modes, with proper state reset and hybrid recurrence UI (dropdown + custom input).
- Date/time fields for due/start date are now split, with time optional and backend-compatible.
- Improved modal width, alignment, and input state management for better usability.
- All modals and forms now handle loading and error states gracefully.
- Refactored code to remove unused variables and resolve all ESLint warnings.
- TaskFormModal now guards against null `initialValues` to prevent runtime errors.

### Fixed
- Fixed bug where TaskFormModal would crash if `initialValues` was null.
- Fixed input state reset bug in TaskFormModal (inputs no longer clear while typing).
- Fixed modal state, error overlays, and modal not appearing in certain flows.
- Fixed all ESLint warnings (unused variables, unnecessary escape characters, etc.).
- Fixed edit task flow: editing a task now updates the backend and refreshes the UI.

### Removed
- All unused state variables and handlers in MainManagementWindow and TaskDetailsModal for code quality.

### API Change Summary
_No new API changes in this release. See previous entries for the latest API additions._

## [v0.12.0-dev3] - 2025-07-04
### Fixed
- JS-0417: Refactored all inline functions and arrow functions in JSX properties to stable, memoized handlers using `useCallback` in `RegisterPage.tsx`, `ProjectListPage.tsx`, `PasswordResetConfirmPage.tsx`, and `LoginPage.tsx`.
- JS-0415: Reduced JSX nesting in `RegisterPage.tsx`, `PasswordResetConfirmPage.tsx`, and `LoginPage.tsx` by extracting content into smaller sections or components.
- JS-0066: Replaced shorthand type coercion with `Boolean(deleteProject)` in `ProjectListPage.tsx` for clarity and code quality.

## [v0.12.0-dev2] - 2025-07-04
### Added
- Modern, consistent app-wide header (`AppHeader.tsx`) applied to all main pages (dashboard, home, login, register, password reset, project management).
- Unified background gradients and layout for all main pages for a visually consistent experience.
- Project Management UI (`ProjectListPage.tsx`):
  - Project listing with friendly empty state and instant updates.
  - Modal form for project creation (`ProjectForm.tsx`) with CSRF and error handling.
- Improved navigation: app title in header now links to home/dashboard.
- Project editing and deletion in `ProjectListPage.tsx`:
  - "Edit" and "Delete" buttons for each project.
  - Reusable `ConfirmDialog` component for deletion confirmation.
  - `ProjectForm.tsx` extended to support edit mode (`initialName`, `initialDescription`, `editMode` props).
  - UI updates instantly after edit/delete.

### Changed
- Refactored authentication context (`auth.tsx`) to use a single source of truth (`token`), fixing redirect loops and ensuring persistent login state.
- Removed unused variables in `LoginPage.tsx`, `RegisterPage.tsx`, and `PasswordResetConfirmPage.tsx` to resolve ESLint warnings.
- Unified and modernized page backgrounds and layouts for a cohesive look (applied to all main pages).
- Improved debug output and troubleshooting for authentication/routing.

### Fixed
- JS-0323: Replaced all `any` types with `unknown` for error handling in `ProjectListPage.tsx`.
- JS-0356: Removed unused variable assignments (e.g., `handleSubmit`) in `RegisterPage.tsx`, `PasswordResetConfirmPage.tsx`, and `LoginPage.tsx`.
- JS-0417: Refactored `ProjectForm.tsx` to use `useCallback` for all event handlers, avoiding local functions in JSX props.
- JS-0757: Removed `autoFocus` prop from `ProjectForm.tsx` to comply with accessibility and code quality guidelines.
- JS-0415: Reduced JSX nesting in `RegisterPage.tsx`, `PasswordResetRequestPage.tsx`, `PasswordResetConfirmPage.tsx`, `LoginPage.tsx`, `HomePage.tsx`, and `DashboardPlaceholderPage.tsx` by extracting content into smaller sections or components.

### Removed
- Unused variables and assignments in `LoginPage.tsx`, `RegisterPage.tsx`, and `PasswordResetConfirmPage.tsx` (code quality).

### API Change Summary
_No new API changes in this release. See previous entries for the latest API additions._

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

### Frontend
- React + TypeScript app initialized in `frontend/`.
- Tailwind CSS v3 configured and working.
- React Router set up with placeholder pages.

## [v0.8.0-dev4] - 2025-07-03
- Added `/api/password-reset/confirm` endpoint:
  - Accepts a reset token and new password, validates the token (unused, valid), and updates the user's password.
  - Returns clear error messages for invalid, used, or missing tokens and for weak passwords.
  - Marks tokens as used after a successful reset.
  - Includes comprehensive automated tests for all major cases (valid, invalid, used token, weak password).
  - Updated API documentation to describe the new endpoint, request/response, and error cases.

## [v0.8.0-dev3] - 2025-07-03
- Implemented email delivery for password reset tokens:
  - The `/api/password-reset/request` endpoint now sends the reset token to the user's email address using SMTP (configurable via environment variables).
  - In development and test modes, the token may still be returned in the response for testing; in production, it is only sent via email.
  - Added configuration options for SMTP server, port, sender address, and credentials.
  - Updated backend/app.py with email sending logic and error handling.
  - Updated automated tests to mock email delivery and verify correct behavior.
- See docs/API.md for updated endpoint behavior and security notes.

### Fixed
- Fixed DeepSource JS-0323 (usage of `any` type) and JS-0105 (class methods should utilize `this`) in `frontend/src/App.tsx` by replacing `any` with `unknown` and ensuring correct method signatures and usage.

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


## [v0.8.0-dev1] - 2025-07-03
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