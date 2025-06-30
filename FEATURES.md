# Productivity Hub Features

A high-level list of features for reference. For the step-by-step development checklist, see `ROADMAP.md`.

## Core Features
- User authentication (register, login, logout) using Flask sessions, with optional social login (Google, Discord) via Flask-Dance/Authlib
- Task management (CRUD, categories, priorities, deadlines, recurrence)
- Project management (CRUD, progress tracking)
- Task scheduling (calendar, reminders, drag-and-drop)
- Smart scheduling/prioritization (auto-schedule based on user input)
- Dashboards and analytics (customizable, charts, stats)
- Multiple views (list, kanban, calendar, timeline)
- Google Drive/Docs integration (highest priority)
- Alexa integration (next priority)
- Discord integration (planned)
- Customization (themes, custom fields, widget-based dashboard)
- User settings (notifications, integrations, data export/import)
- Gamification (badges, streaks, achievements, etc.)

## Advanced/Future Features
- Multiplatform support (responsive web, desktop, Android)
- AI/ML features (smart suggestions, productivity insights)
- Collaboration/team features
- Voice assistant integration (other than Alexa)
- Offline support
- Public API
- Pomodoro timer/focus mode
- Habit tracking
- Integration with other productivity tools (Notion, Trello, Microsoft To Do, etc.)

---

## Implementation Status

### Implemented (as of v0.4.0-dev6)
- User registration, login, and logout endpoints using Flask session (not Flask-Login)
- Secure password hashing and constant-time password validation to prevent timing attacks
- Session-based authentication: user ID stored in session on login, cleared on logout
- Helper function to retrieve the current user from the session
- Input validation for registration and login (including email and password strength)
- Logging for all authentication events and errors

### Planned
- Social login (Google, Discord) via Flask-Dance/Authlib
- Task management (CRUD, categories, priorities, deadlines, recurrence)
- Project management (CRUD, progress tracking)
- Task scheduling (calendar, reminders, drag-and-drop)
- Smart scheduling/prioritization (auto-schedule based on user input)
- Dashboards and analytics (customizable, charts, stats)
- Multiple views (list, kanban, calendar, timeline)
- Google Drive/Docs, Alexa, and Discord integrations
- Customization (themes, custom fields, widget-based dashboard)
- User settings (notifications, integrations, data export/import)
- Gamification (badges, streaks, achievements, etc.)

---

**Note:** This is a living document. Add or remove features as your needs evolve!
