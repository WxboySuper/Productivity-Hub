# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/), with personal tweaks for rewarding milestones and highly detailed dev versions.

## [Unreleased]
-

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
