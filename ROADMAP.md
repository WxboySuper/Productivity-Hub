# Productivity Hub Roadmap

This roadmap is a step-by-step checklist for building your productivity assistant. Each version milestone is a focused, bite-sized release leading up to v1.0. Celebrate every step! Check off each task as you complete it!

---

## Versioning Guide

- **Format:** vX.Y.Z (e.g., v0.1.0, v0.2.0, v0.10.0, v0.11.0)
  - **Major (X):** Big changes or breaking changes
  - **Minor (Y):** Small, focused, and rewarding feature sets (increments by 1 for each new version, goes to double digits as needed)
  - **Patch (Z):** Bug fixes or tiny tweaks (can go to double digits as needed)
- **Pre-1.0:** Use v0.Y.0 for alpha/beta releases. Each version is a personal milestone—make them as small and rewarding as you like!
- **API Change Summary Requirement:** For every stable, alpha, or beta release, summarize all API changes (new endpoints, deleted endpoints, changes to endpoints, etc.) in the changelog, even if they were already documented in dev releases. This ensures the release notes provide a complete overview of API evolution for each version.

---

## v0.1.0-alpha: Project Initialization

- [x] Initialize Git repository
- [x] Create project folders: `frontend/`, `backend/`, `docs/`
- [x] Set up README, ROADMAP, and FEATURES docs

## v0.2.0-alpha: Backend Environment

- [x] Set up Python virtual environment
- [x] Initialize Flask app
- [x] Set up SQLite database

## v0.3.0-alpha: Basic Models

- [x] Create User, Task, and Project models in Flask

## v0.4.0-alpha: User Authentication

- [x] Implement user registration
- [x] Implement user login
- [x] Implement user logout

## v0.5.0-alpha: Core API Endpoints

- [x] Create REST API endpoints for Tasks (CRUD)
- [x] Create REST API endpoints for Projects (CRUD)
- [x] Create REST API endpoints for User profile

## v0.6.0-alpha: Task Scheduling Fields

- [x] Add due date and priority fields to Task model
- [x] Add start date and recurrence fields to Task model

## v0.7.0-alpha: API Testing

- [x] Write basic tests for API endpoints

## v0.8.0-alpha: Password Reset (Backend)

- [x] Implement password reset endpoint (backend)
- [x] Add email sending for password reset (backend)
- [x] Add tests for password reset

## v0.9.0-alpha: Frontend Environment

- [x] Initialize React app with TypeScript
- [x] Set up Tailwind CSS
- [x] Set up routing (React Router)

## v0.10.0-alpha: Auth UI

- [x] Create login page
- [x] Create registration page
- [x] Add password reset UI (frontend)

## v0.11.0-beta: Main Page

- [x] Create a main landing page that serves as the entry point for all users
  - [x] If not authenticated, show options to register or log in
  - [x] If authenticated, show a placeholder dashboard or welcome message

# v0.12.0-beta: Project Management UI & UI/UX Overhaul

- [x] Comprehensive UI/UX redesign: dynamic backgrounds, modern forms, responsive layout
- [x] Background theme system (10 themes: Ocean, Sunset, Forest, Space, etc.)
- [x] Multiple form design systems (Creative, Productivity Focused, Modern, etc.)
- [x] Authentication improvements: CSRF, error handling, session management
- [x] Toast notification system
- [x] ErrorBoundary and fallback UI
- [x] Accessibility improvements (ARIA, keyboard, screen readers)
- [x] Automated accessibility tests (ongoing)
- [x] Project management UI (completed)
- [x] Refactored component structure and test organization
- [x] Added/expanded frontend and backend tests (high coverage)
- [x] CI/CD workflow improvements
- [x] Documentation updates
- [ ] Accessibility: audit for color contrast, focus management, screen reader output; expand automated accessibility tests for keyboard navigation, tab order, edge cases; review accessibility coverage after each major UI/UX change
- [ ] Add forms for creating/editing tasks and projects

## v0.13.0-beta: The Great Refactor - Foundation (Current)

**Goal:** Initialize the new Server-Side Rendered architecture without breaking the database.

- [ ] Initialize `app_simple.py` (New lightweight Flask entry point)
- [ ] Configure Tailwind CLI for standalone usage (No Node.js runtime dependency)
- [ ] Create `templates/base.html` (Port AppHeader/Sidebar/Background components to Jinja2)
- [ ] Create `templates/login.html` (Port Login design to Jinja2)
- [ ] Implement `GET /login` route (Render login template)
- [ ] Implement `POST /login` route (Handle form submission without JSON)

## v0.14.0-beta: The Great Refactor - Task Visualization

**Goal:** Rebuild the core "All Tasks" view using the new architecture.

- [ ] Create `templates/tasks.html` (Port Task Card HTML from React)
- [ ] Implement `GET /tasks` route (Server-side render incomplete tasks)
- [ ] Implement `GET /tasks/completed` route (Server-side render completed tasks)
- [ ] Verify Tailwind styles match the original React design pixel-perfectly

## v0.15.0-beta: The Great Refactor - Interactions (HTMX)

**Goal:** Restore interactivity (checking boxes, deleting) using HTMX instead of React state.

- [ ] Add HTMX CDN to `base.html`
- [ ] Implement `POST /api/tasks/<id>/toggle` (Return swapped HTML row)
- [ ] Add "Quick Add" form to top of task list (Append row via HTMX)
- [ ] Implement Inline Editing (Click title -> Swap with Input -> Save on Enter key or with an explicit save button)

## v0.16.0-beta: The Great Refactor - Parity & Cleanup

**Goal:** Full feature parity with the old frontend and removal of legacy code.

- [ ] Migrate Projects Page (Templates + Routes)
- [ ] Migrate Settings Page (Templates + Routes)
- [ ] **The Purge:** Delete `frontend/` directory
- [ ] **The Unshackling:** Remove `docker-compose.yml` and complex Nginx configs
- [ ] Update documentation to reflect new `python app.py` workflow

## v0.17.0-beta: Advanced List View & Filtering

**Goal:** A powerful, customizable list view that replaces the need for Kanban.

- [ ] Implement advanced sorting (Sort by Priority, Due Date, Project) with backend query parameters
- [ ] Implement advanced filtering (Filter by Tag, Status, Priority)
- [ ] Add bulk actions (Select multiple -> Delete/Complete)
- [ ] Implement list view density toggles (Compact/Comfortable)

## v0.18.0-beta: Calendar & Timeline Views

**Goal:** Visualizing tasks over time using lightweight JS libraries.

- [ ] Implement Calendar view (using FullCalendar + HTMX)
- [ ] Implement basic Timeline view for Projects

## v0.19.0-beta: Analytics & Charts

**Goal:** Visualizing productivity data.

- [ ] Add analytics/charts (using a lightweight chart library like Chart.js)
- [ ] Create "Productivity Pulse" chart (Tasks completed over time)

## v0.20.0-beta: Dashboard Core

**Goal:** A centralized hub for productivity status.

- [ ] Dashboard Overview: Show tasks due today, active projects, and productivity stats
- [ ] Dashboard Quick Links: Add navigation shortcuts to common actions

## v0.21.0-beta: Dashboard Customization

**Goal:** User-controlled dashboard layout.

- [ ] Implement "Widget Toggle" system (Show/Hide sections via User Settings)
- [ ] Allow reordering of dashboard sections (if feasible without heavy JS)

## v0.22.0-beta: Day Planner

**Goal:** A focused view for daily execution.

- [ ] Implement "My Day" view (Select tasks from backlog to work on today)
- [ ] Add "Day Review" mode (end-of-day summary)

## v0.23.0-beta: Settings & Customization

**Goal:** Deep user control over the experience.

- [ ] Settings Page: Theme selection (Light/Dark/System), Notification preferences
- [ ] Profile Management

## v0.24.0-beta: Notifications & Data Export

**Goal:** Keeping the user informed and safe.

- [ ] Add notifications/reminders (browser, email)
- [ ] Add data export/import (CSV, JSON)

## v0.25.0-beta: Info & Help Pages

- [ ] Add info pages (About, Features, Development, Contact) - _See docs/temp/info-pages-plan.md_
- [ ] Add footer with links to GitHub, roadmap, and documentation
- [ ] Add help/FAQ section

## v0.26.0-beta: Admin Dashboard & Developer Tools

- [ ] Admin Dashboard: manage users, settings, and content
- [ ] Visual test coverage map: See which templates and backend routes have test coverage
- [ ] Performance dashboard: Track server-side render times, API/DB latency, and resource usage
- [ ] Codebase health report: Generate a summary of linting status, testing coverage, and accessibility scores

## v1.0.0: First Stable Release 🎉

## Core Productivity Platform - Ready for Production

- [ ] Final testing and bug fixes
- [ ] Prepare backend for production (env vars, security, etc.)
- [ ] Set up simplified deployment (Docker-less or minimal Docker)
- [ ] Create release notes and user documentation
- [ ] Celebrate the first stable release! 🚀

---

## Post-v1.0.0: Advanced Features & Integrations

## v1.1.0: External API & Mobile Integration

**Goal:** Open the platform to the TravelBlock companion app.

- [ ] Implement API Key generation for users
- [ ] Create standardized JSON API endpoints (`/api/v1/...`) alongside HTML routes
- [ ] Implement endpoints specifically for "TravelBlock" (Fetch tasks by tag, update status)
- [ ] Write API documentation for the external developer (you!)

## v1.2.0: Gamification System - Badges & Streaks

**Goal:** Make productivity rewarding.

- [ ] Design gamification system (define goals, rewards, and progression)
- [ ] Implement badge system (e.g., for task streaks, project completions)
- [ ] Implement streak tracking (daily/weekly task completion)

## v1.3.0: Gamification System - Achievements & XP

**Goal:** Deepen the reward system.

- [ ] Add achievement system (e.g., milestones, productivity challenges)
- [ ] Add points/XP system for completing tasks and projects
- [ ] Add progress bar or level system (visualize user progress)
- [ ] Add gamification UI components and notifications

## v1.4.0: Google Drive Integration

**Goal:** Better organization for attachments.

- [ ] Add Google Drive/Docs integration endpoints (backend)
- [ ] Add Google Drive/Docs UI integration (frontend)
- [ ] Add file attachment support for tasks and projects

## v1.5.0: Email Notification Improvements

**Goal:** Better communication.

- [ ] Add email notification improvements (Digest emails, specific alerts)

## v2.0.0+: Long-Term Maintenance & Stability

**Goal:** Keeping the platform stable and adding high-value features only as needed.

- [ ] **Maintenance Mode:** Focus on security updates, bug fixes, and performance tuning.
- [ ] **Feature Freeze:** No new major modules unless strictly requested or identified as high-value.
- [ ] **Desktop App:** Optional Electron wrapper if a standalone desktop experience is desired.
- [ ] **Advanced Integrations:** Integration with other tools (Notion, Trello) only if you personally adopt them.

---

**Tip:** Make each version a celebration! Adjust, split, or combine versions as you see fit for your own rewarding progress. Keep versions small and focused for faster progress and more frequent releases. Testing and documentation time should be considered when planning each version.
