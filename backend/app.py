# ========================
# Imports
# ========================

import logging
import os
import re
import secrets
import smtplib
import sys
import warnings
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from functools import wraps
from string import Template

import bleach
from dotenv import load_dotenv
from email_validator import EmailNotValidError, validate_email
from flask import Flask, jsonify, request, session
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

# =========================
# Configuration & App Setup
# =========================

# --- Environment Loading ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DOTENV_PATH = os.path.join(BASE_DIR, ".env")
if not os.path.exists(DOTENV_PATH):
    print(f"ERROR: .env file not found at {DOTENV_PATH}. " "Application will exit.")
    sys.exit(1)
if not load_dotenv(DOTENV_PATH):
    print(
        f"ERROR: Failed to load .env file at {DOTENV_PATH}. " "Application will exit."
    )
    sys.exit(1)

# --- Logging Configuration ---
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(threadName)s : %(message)s",
)
logger = logging.getLogger(__name__)
logger.info("Logging configured at level: %s", LOG_LEVEL)
logger.info("Starting Productivity Hub Backend...")
logger.info("Logging is configured.")

# --- Flask App & Database Setup ---
app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY", "dev-secret-key-change-in-production"
)
db_path = os.path.join(BASE_DIR, "productivity_hub.db")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", f"sqlite:///{db_path}"
)
app.config["SESSION_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
app.config["SESSION_COOKIE_HTTPONLY"] = (
    True  # Prevent JavaScript access to session cookies
)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"  # Set SameSite policy for session cookies
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=8)  # Absolute timeout
app.config["SESSION_REFRESH_EACH_REQUEST"] = True  # Sliding expiration

# --- Production Warning ---
if (
    os.environ.get("FLASK_ENV") == "production"
    or os.environ.get("ENVIRONMENT") == "production"
):
    warnings.warn(
        "WARNING: This app is running in production mode! "
        "Ensure all security settings are properly configured, "
        "including CSRF protection.",
        RuntimeWarning,
    )

logger.info("Flask app configuration is set up.")
db = SQLAlchemy(app)
migrate = Migrate(app, db)
logger.info("SQLAlchemy is set up.")


# ========================
# Association Tables
# ========================

# --- Task Dependencies (blocked by/blocking) ---
task_dependencies = db.Table(
    "task_dependencies",
    db.Column(
        "blocker_id",
        db.Integer,
        db.ForeignKey("task.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "blocked_id",
        db.Integer,
        db.ForeignKey("task.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# --- Linked/Related Tasks (non-blocking relationships) ---
task_links = db.Table(
    "task_links",
    db.Column(
        "task_a_id",
        db.Integer,
        db.ForeignKey("task.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "task_b_id",
        db.Integer,
        db.ForeignKey("task.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


##
# Model Definitions
##
# --- User Model ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(225), nullable=False)

    tasks = db.relationship(
        "Task", backref="user", lazy=True, cascade="all, delete-orphan"
    )
    projects = db.relationship(
        "Project", backref="user", lazy=True, cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


# --- Task Model ---
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime)
    start_date = db.Column(db.DateTime)  # New: optional start date
    priority = db.Column(db.Integer, default=1, nullable=False)
    recurrence = db.Column(db.String)  # New: optional recurrence rule (string or JSON)
    completed = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("project.id", ondelete="SET NULL"),
        nullable=True,
    )
    parent_id = db.Column(
        db.Integer, db.ForeignKey("task.id", ondelete="CASCADE"), nullable=True
    )  # Subtask support
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )

    # Subtasks relationship
    subtasks = db.relationship(
        "Task",
        backref=db.backref("parent", remote_side=[id]),
        lazy=True,
        cascade="all, delete-orphan",
    )

    # Task dependencies (blocked by/blocking)
    blocked_by = db.relationship(
        "Task",
        secondary=task_dependencies,
        primaryjoin=id == task_dependencies.c.blocked_id,
        secondaryjoin=id == task_dependencies.c.blocker_id,
        backref=db.backref("blocking", lazy="dynamic"),
        lazy="dynamic",
    )

    # Linked/related tasks (non-blocking relationships)
    linked_tasks = db.relationship(
        "Task",
        secondary=task_links,
        primaryjoin=id == task_links.c.task_a_id,
        secondaryjoin=id == task_links.c.task_b_id,
        lazy="dynamic",
    )

    # Reminder fields
    reminder_time = db.Column(db.DateTime, nullable=True)
    reminder_recurring = db.Column(
        db.String, nullable=True
    )  # e.g., 'DAILY', 'WEEKLY', rrule string, etc.
    reminder_snoozed_until = db.Column(db.DateTime, nullable=True)
    reminder_enabled = db.Column(db.Boolean, default=True, nullable=False)


# --- Project Model ---
class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )

    tasks = db.relationship(
        "Task", backref="project", lazy=True, cascade="all, delete-orphan"
    )


# --- PasswordResetToken Model ---
class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    token = db.Column(db.String(128), unique=True, nullable=False)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    expires_at = db.Column(db.DateTime, nullable=False)  # New: expiration timestamp
    used = db.Column(db.Boolean, default=False, nullable=False)

    user = db.relationship(
        "User", backref=db.backref("password_reset_tokens", lazy=True)
    )


# --- Notification Model ---
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey("task.id"), nullable=True)
    title = db.Column(db.String(100), nullable=True)  # Optional title for notifications
    message = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    read = db.Column(db.Boolean, default=False, nullable=False)
    snoozed_until = db.Column(db.DateTime, nullable=True)
    type = db.Column(db.String(32), default="reminder", nullable=False)
    show_at = db.Column(
        db.DateTime, nullable=True
    )  # When the notification should appear

    user = db.relationship("User", backref=db.backref("notifications", lazy=True))
    task = db.relationship("Task", backref=db.backref("notifications", lazy=True))


##
# Helper Functions
##
# --- Database Initialization ---
def init_db():
    """
    Initialize the database tables for the Flask app.
    Should be called within an app context.
    """
    logger.info("Initializing the database.")
    with app.app_context():
        db.create_all()
    logger.info("Database tables created.")


# --- Session Regeneration Helper ---
def regenerate_session():
    """Regenerate the session ID to prevent fixation attacks."""
    session.clear()
    session.modified = True


# --- Password Strength Validation ---
def is_strong_password(password):
    """
    Check if the provided password meets strength requirements.
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    Returns True if strong, False otherwise. Logs reasons for failure.
    """
    logger.debug("Checking password strength.")
    if len(password) < 8:
        logger.warning("Password too short.")
        return False
    if not re.search(r"[A-Z]", password):
        logger.warning("Password missing uppercase letter.")
        return False
    if not re.search(r"[a-z]", password):
        logger.warning("Password missing lowercase letter.")
        return False
    if not re.search(r"[0-9]", password):
        logger.warning("Password missing number.")
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        logger.warning("Password missing special character.")
        return False
    logger.debug("Password is strong.")
    return True


# --- Get Current User from Session ---
def get_current_user():
    """
    Retrieve the current user from the session.
    Returns the User object if logged in, else None. Logs user lookup events.
    """
    user_id = session.get("user_id")
    logger.debug("Fetching current user from session: user_id=%s", user_id)
    if user_id:
        user = db.session.get(User, user_id)
        if user:
            logger.info("Current user found: %s (ID: %s)", user.username, user.id)
        else:
            logger.warning("User ID %s not found in database.", user_id)
        return user
    logger.info("No user_id in session.")
    return None


# --- Error Response Helper ---
def error_response(message, code):
    """
    Return a JSON error response with logging.
    - Logs the error message.
    - Returns a tuple (jsonify, code) for Flask endpoints.
    """
    logger.error(message)
    # Only expose generic error messages for 500-level errors
    if code >= 500:
        return (
            jsonify(
                {"error": "An internal server error occurred. Please try again later."}
            ),
            code,
        )
    return jsonify({"error": message}), code


# --- Login Required Decorator ---
def login_required(f):
    """
    Decorator to ensure the user is logged in before accessing the endpoint.
    Returns 401 if not authenticated. Logs access attempts.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        logger.debug("Checking if user is logged in.")
        user = get_current_user()
        if not user:
            logger.warning("Unauthorized access attempt.")
            return error_response("Authentication required", 401)
        return f(*args, **kwargs)

    return decorated_function


# --- CSRF Token Generation ---
def generate_csrf_token():
    """
    Generate a CSRF token and return it.
    The token should be set as a cookie by the caller.
    Returns the CSRF token string.
    """
    existing_token = request.cookies.get("_csrf_token")
    if existing_token and re.fullmatch(r"[a-f0-9]{32}", existing_token):
        logger.debug("Using existing CSRF token from cookie.")
        return existing_token
    logger.info("Generating new CSRF token.")
    return secrets.token_hex(16)


# --- CSRF Protection Handler ---
def csrf_protect():
    """
    Flask before_request handler for CSRF protection on state-changing requests
    Skips protection in testing mode and for login/register endpoints.
    Checks for a valid CSRF token in session and headers.
    Returns a JSON error response if the token is missing or invalid.
    """
    if app.config.get("TESTING", False):
        logger.debug("CSRF protection is disabled in TESTING mode.")
        return
    if request.method in ("POST", "PUT", "DELETE"):
        logger.debug("CSRF check")  # Short message to avoid E501
        if request.endpoint in ("login", "register"):
            logger.debug("CSRF check skipped for login/register endpoint.")
            return

        # Get CSRF token from cookie (not session)
        token = request.cookies.get("_csrf_token")
        header_token = request.headers.get("X-CSRF-Token")

        cookie_str = token[:10] + "..." if token else "None"
        header_str = header_token[:10] + "..." if header_token else "None"
        logger.debug("CSRF cookie:")
        logger.debug(cookie_str)
        logger.debug("CSRF header:")
        logger.debug(header_str)
        if not token or token != header_token:
            logger.warning(
                "CSRF token missing or invalid. Cookie: %s, Header: %s",
                token,
                header_token,
            )
            return error_response("Invalid or missing CSRF token", 403)


# --- Task Validation/Parsing Helpers ---
def validate_title(data):
    title = data.get("title")
    if not title or not title.strip():
        return None, "Task title is required"
    return title.strip(), None


def validate_project_id(data, user=None):
    if user is None:
        user = get_current_user()
    project_id = data.get("project_id")
    if project_id:
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return None, "Invalid project ID"
    return project_id, None


def validate_parent_id(data, user):
    parent_id = data.get("parent_id")
    if parent_id:
        parent_task = Task.query.filter_by(id=parent_id, user_id=user.id).first()
        if not parent_task:
            return None, "Invalid parent task ID"
    return parent_id, None


def parse_date(date_str, field_name):
    if date_str:
        try:
            return (
                datetime.fromisoformat(date_str.replace("Z", "+00:00")),
                None,
            )
        except ValueError:
            return None, f"Invalid {field_name} format"

    return None, None


# --- Task Creation/Serialization Helpers ---
def _extract_task_fields(data, user):
    """Helper to extract and validate all fields for task creation."""
    title, err = validate_title(data)
    if err:
        return None, err
    description = data.get("description", "")
    project_id, err = validate_project_id(data, user)
    if err:
        return None, err
    parent_id, err = validate_parent_id(data, user)
    if err:
        return None, err
    priority = data.get("priority", 1)
    due_date_str = data.get("due_date")
    start_date_str = data.get("start_date")
    recurrence = data.get("recurrence")
    due_date, err = parse_date(due_date_str, "due_date")
    if err:
        return None, err
    start_date, err = parse_date(start_date_str, "start_date")
    if err:
        return None, err
    if start_date and due_date and start_date > due_date:
        return None, "start_date cannot be after due_date"
    return {
        "title": title,
        "description": description.strip() if description else "",
        "project_id": project_id,
        "parent_id": parent_id,
        "priority": priority,
        "due_date": due_date,
        "start_date": start_date,
        "recurrence": recurrence,
    }, None


def _serialize_task(task):
    """Helper to serialize a Task object to dict."""
    d = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "priority": task.priority,
        "project_id": task.project_id,
        "parent_id": task.parent_id,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
        "subtasks": [],
    }
    if task.due_date:
        d["due_date"] = task.due_date.isoformat()
    if task.start_date:
        d["start_date"] = task.start_date.isoformat()
    if task.recurrence:
        d["recurrence"] = task.recurrence
    return d


def _validate_title(title):
    if not title or not title.strip():
        return "Task title is required"
    return None


def _validate_project_id(project_id, user):
    if project_id:
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return "Invalid project ID"
    return None


def _validate_dates(start_date, due_date):
    if start_date and due_date and start_date > due_date:
        return "start_date cannot be after due_date"
    return None


# --- Task Update Helpers ---
def update_task_title(task, data):
    if "title" in data:
        err = _validate_title(data["title"])
        if err:
            return err
        task.title = data["title"].strip()
    return None


def update_task_description(task, data):
    if "description" in data:
        task.description = data["description"].strip() if data["description"] else ""


def update_task_completed(task, data):
    if "completed" in data:
        task.completed = bool(data["completed"])


def update_task_priority(task, data):
    if "priority" in data:
        task.priority = data["priority"]


def update_task_project(task, data, user):
    if "project_id" in data:
        err = _validate_project_id(data["project_id"], user)
        if err:
            return err
        task.project_id = data["project_id"] if data["project_id"] else None
    return None


def update_task_due_date(task, data):
    if "due_date" in data:
        if data["due_date"]:
            due_date, err = parse_date(data["due_date"], "due_date")
            if err:
                return err
            task.due_date = due_date
        else:
            task.due_date = None
    return None


def update_task_start_date(task, data):
    if "start_date" in data:
        if data["start_date"]:
            start_date, err = parse_date(data["start_date"], "start_date")
            if err:
                return err
            task.start_date = start_date
        else:
            task.start_date = None
    return None


def update_task_recurrence(task, data):
    if "recurrence" in data:
        task.recurrence = data["recurrence"]


def _validate_and_update_task_fields(task, data, user):
    """Validate and update task fields. Returns error string or None."""
    for updater in [
        lambda: update_task_title(task, data),
        lambda: update_task_description(task, data),
        lambda: update_task_completed(task, data),
        lambda: update_task_priority(task, data),
        lambda: update_task_project(task, data, user),
        lambda: update_task_due_date(task, data),
        lambda: update_task_start_date(task, data),
        lambda: update_task_recurrence(task, data),
    ]:
        err = updater()
        if err:
            return err

    err = _validate_dates(task.start_date, task.due_date)
    if err:
        return err
    return None


##
# Route Definitions
##
app.before_request(csrf_protect)  # Register CSRF protection as a before_request handler


@app.route("/")
def home():
    """Home route."""
    logger.info("Home route accessed.")
    return "Welcome to the Productivity Hub Backend!"


# User Endpoints (Registration, Login, Logout, Profile)
# ========================
# User Endpoints (Registration, Login, Logout, Profile)
# ========================


@app.route("/api/register", methods=["POST"])
def register():
    """User registration endpoint."""
    logger.info("Register endpoint accessed.")

    if not request.is_json:
        logger.error("Request must be JSON.")
        return error_response("Request must be JSON", 400)

    try:
        data = request.get_json()
    except Exception as e:
        logger.error("Malformed JSON: %s", e)
        return error_response("Malformed JSON in request body", 400)
    if not isinstance(data, dict):
        logger.error("Request JSON body is not an object.")
        return error_response("Request JSON body must be an object", 400)

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    # Validate Input
    if (
        not username
        or not email
        or not password
        or not username.strip()
        or not email.strip()
        or not password.strip()
    ):
        logger.error("Missing required fields: username, email, or password.")
        return error_response(
            "Missing required fields: username, email, or password",
            400,
        )

    # Validate Email
    try:
        validate_email(email)
        logger.info("Email %s is valid.", email)
    except EmailNotValidError as e:
        logger.error("Invalid email: %s", e)
        return error_response(f"Invalid email: {e}", 400)

    # Validate Password Strength
    if not is_strong_password(password):
        logger.error("Weak password provided.")
        return error_response(
            "Password must be at least 8 characters long and include "
            "uppercase, lowercase, numbers, and special characters.",
            400,
        )

    # Remove pre-check for existing user and rely on DB constraints
    try:
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error("User registration failed: %s", e)
        # Check for unique constraint violation
        if "UNIQUE constraint failed" in str(e):
            return error_response("Username or email already exists", 400)
        return error_response("Registration failed", 500)

    logger.info("User %s registered successfully.", username)
    return jsonify({"message": "User registered successfully"}), 201


# --- User Login ---


@app.route("/api/login", methods=["POST"])
def login():
    """User login endpoint."""
    logger.info("Login endpoint accessed.")

    if not request.is_json:
        logger.error("Request must be JSON.")
        return error_response("Request must be JSON", 400)

    data = request.get_json()
    username_or_email = data.get("username") or data.get("email")
    password = data.get("password")

    # Validate Input
    if (
        not username_or_email
        or not password
        or not username_or_email.strip()
        or not password.strip()
    ):
        logger.error("Missing required fields: username/email or password.")
        return error_response(
            "Missing required fields: username/email or password", 400
        )

    # Find user by username or email
    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

    # Always perform password check to prevent timing attacks
    if user:
        password_valid = user.check_password(password)
    else:
        # Perform dummy hash check to maintain consistent timing
        check_password_hash("dummy hash", password)
        password_valid = False

    if not user or not password_valid:
        # Log the invalid login attempt
        logger.warning("Invalid login attempt for user: %s", username_or_email)
        return error_response("Invalid username/email or password", 401)

    # Set session on successful login
    session["user_id"] = user.id

    # Force session to be saved
    session.permanent = True
    session.modified = True

    # Debug session after login
    logger.debug("Session after login: %s", dict(session))
    logger.debug("Session ID after login: %s", session.get("_id", "No session ID"))

    logger.info("User %s logged in successfully.", user.username)
    return (
        jsonify(
            {
                "message": "Login successful",
                "session_debug": {
                    "user_id": session.get("user_id"),
                    "has_session_id": bool(session.get("_id")),
                    "session_keys": list(session.keys()),
                },
            }
        ),
        200,
    )


# --- User Logout ---


@app.route("/api/logout", methods=["POST"])
def logout():
    """
    User logout endpoint.
    Clears the user's session, effectively logging them out.
    """
    logger.info("Logout endpoint accessed.")
    regenerate_session()  # Regenerate session ID and clear session
    logger.info("User logged out successfully.")
    return jsonify({"message": "Logout successful"}), 200


# --- Check Authentication ---


@app.route("/api/auth/check", methods=["GET"])
def check_auth():
    """
    Check if the user is currently authenticated.
    Returns authentication status and user info if logged in.
    """
    # Debug session information
    logger.debug("Session contents: %s", dict(session))
    logger.debug("Session ID: %s", session.get("_id", "No session ID"))
    logger.debug("User ID from session: %s", session.get("user_id", "No user ID"))

    user = get_current_user()
    if user:
        logger.info(
            "Auth check: User %s (ID: %s) is authenticated",
            user.username,
            user.id,
        )
        return (
            jsonify(
                {
                    "authenticated": True,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                    "session_info": {
                        "has_session_id": bool(session.get("_id")),
                        "has_user_id": bool(session.get("user_id")),
                        "session_keys": list(session.keys()),
                    },
                }
            ),
            200,
        )
    logger.info("Auth check: No authenticated user")
    return (
        jsonify(
            {
                "authenticated": False,
                "user": None,
                "session_info": {
                    "has_session_id": bool(session.get("_id")),
                    "has_user_id": bool(session.get("user_id")),
                    "session_keys": list(session.keys()),
                },
            }
        ),
        200,
    )


# --- Get User Profile ---


@app.route("/api/profile", methods=["GET"])
@login_required
def get_profile():
    """Get the current user's profile."""
    logger.info("Profile GET endpoint accessed.")
    user = get_current_user()
    if not user:
        logger.warning(
            "Profile requested for missing user (unauthenticated or deleted)."
        )
        return error_response("Authentication required", 401)
    logger.info("Returning profile for user: %s (ID: %s)", user.username, user.id)
    return (
        jsonify({"id": user.id, "username": user.username, "email": user.email}),
        200,
    )


# --- Update User Profile ---


@app.route("/api/profile", methods=["PUT"])
@login_required
def update_profile():
    """Update the current user's profile (username and/or email)."""
    user = get_current_user()
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    errors = {}
    if username is not None:
        sanitized_username = bleach.clean(username, tags=[], strip=True)
        if sanitized_username != username:
            errors["username"] = "Username cannot contain HTML or special tags."
        elif not sanitized_username.strip() or len(sanitized_username) < 3:
            errors["username"] = "Username must be at least 3 characters and not empty after removing HTML."
        elif (
            User.query.filter_by(username=sanitized_username).first()
            and sanitized_username != user.username
        ):
            errors["username"] = "Username already taken."
        else:
            user.username = sanitized_username
    if email:
        try:
            validate_email(email)
        except EmailNotValidError:
            errors["email"] = "Invalid email address."
        else:
            if User.query.filter_by(email=email).first() and email != user.email:
                errors["email"] = "Email already in use."
            else:
                user.email = email
    if errors:
        return jsonify({"error": errors}), 400
    db.session.commit()
    logger.info("Profile updated for user: %s (ID: %s)", user.username, user.id)
    return jsonify({"message": "Profile updated successfully."}), 200


# ========================
# Notification Endpoints
# ========================


@app.route("/api/notifications", methods=["GET"])
@login_required
def get_notifications():
    """Get all notifications for the current user."""
    logger.info("Notifications GET endpoint accessed.")
    user = get_current_user()
    notifications = (
        Notification.query.filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    notifications_data = []
    for notification in notifications:
        notification_dict = {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "read": notification.read,
            "created_at": notification.created_at.isoformat(),
            "task_id": notification.task_id,
        }
        # Include show_at if it exists
        if notification.show_at:
            notification_dict["show_at"] = notification.show_at.isoformat()
        # Include snoozed_until if it exists
        if hasattr(notification, "snoozed_until") and notification.snoozed_until:
            notification_dict["snoozed_until"] = notification.snoozed_until.isoformat()

        notifications_data.append(notification_dict)

    logger.info(
        "Returning %d notifications for user: %s",
        len(notifications_data),
        user.username,
    )
    return jsonify(notifications_data), 200


# --- Dismiss Notification ---


@app.route(
    "/api/notifications/<int:notification_id>/dismiss",
    methods=["POST"],
)
@login_required
def dismiss_notification(notification_id):
    """Mark a notification as read/dismissed."""
    logger.info(
        "Notification dismiss endpoint accessed for notification ID: %s",
        notification_id,
    )
    user = get_current_user()

    notification = Notification.query.filter_by(
        id=notification_id, user_id=user.id
    ).first()
    if not notification:
        logger.warning(
            "Notification not found or doesn't belong to user: %s",
            notification_id,
        )
        return jsonify({"error": "Notification not found"}), 404

    notification.read = True
    db.session.commit()

    logger.info("Notification %s dismissed by user: %s", notification_id, user.username)
    return jsonify({"success": True}), 200


# --- Snooze Notification ---


@app.route("/api/notifications/<int:notification_id>/snooze", methods=["POST"])
@login_required
def snooze_notification(notification_id):
    """Snooze a notification for a specified duration."""
    logger.info(
        "Notification snooze endpoint accessed for notification ID: %s",
        notification_id,
    )
    user = get_current_user()

    notification = Notification.query.filter_by(
        id=notification_id, user_id=user.id
    ).first()
    if not notification:
        logger.warning(
            "Notification not found or doesn't belong to user: %s",
            notification_id,
        )
        return jsonify({"error": "Notification not found"}), 404

    data = request.get_json()
    if not data or "minutes" not in data:
        return jsonify({"error": "Minutes parameter is required"}), 400

    try:
        minutes = int(data["minutes"])
        if minutes <= 0:
            return jsonify({"error": "Minutes must be positive"}), 400

        # Calculate snooze time
        snooze_until = datetime.now(timezone.utc) + timedelta(minutes=minutes)

        # Update notification with snooze time
        if not hasattr(notification, "snoozed_until"):
            # If the column doesn't exist, we'll need to add it to the model
            logger.warning("Notification model missing snoozed_until field")
            return (
                jsonify({"error": "Snooze functionality not available"}),
                500,
            )

        notification.snoozed_until = snooze_until
        db.session.commit()

        logger.info(
            "Notification %s snoozed for %d minutes by user: %s",
            notification_id,
            minutes,
            user.username,
        )
        return (
            jsonify({"success": True, "snoozed_until": snooze_until.isoformat()}),
            200,
        )

    except (ValueError, TypeError):
        return jsonify({"error": "Invalid minutes value"}), 400


@app.route("/api/csrf-token", methods=["GET"])
def get_csrf_token():
    """
    Public endpoint to generate and set a CSRF token for the current session.
    Returns the CSRF token in JSON and sets it in the session/cookie.
    This allows unauthenticated users to get a CSRF token for password reset
    and other flows.
    """
    logger.info("CSRF token endpoint accessed.")
    token = generate_csrf_token()
    response = jsonify({"csrf_token": token})
    # Set cookie for frontend JS with a secure, server-generated token
    response.set_cookie(
        "_csrf_token", token, secure=True, httponly=True, samesite="Lax"
    )
    return response


# ========================
# Password Reset Endpoints
# ========================
# --- Password Reset Request ---


@app.route("/api/password-reset/request", methods=["POST"])
def password_reset_request():
    """Request password reset: email, token, store, send (timing equalized)."""
    import time

    logger.info("Password reset request endpoint accessed.")
    if not request.is_json:
        logger.error("Password reset request failed: Request must be JSON.")
        return error_response("Request must be JSON", 400)

    data = request.get_json()
    email = data.get("email")
    if not email or not email.strip():
        logger.error("Password reset request failed: Email is required.")
        # Always perform dummy email send for timing equalization
        send_email(
            "dummy@localhost",
            "Password Reset Request",
            "If this were real, you'd get a reset link.",
        )
        time.sleep(0.5)  # Simulate token generation delay
        return error_response("Email is required", 400)

    user = User.query.filter_by(email=email.strip()).first()
    # Always generate token and send email, even if user does not exist
    token = secrets.token_urlsafe(48)
    expiration_minutes = int(
        os.environ.get("PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES", 60)
    )
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiration_minutes)
    if user:
        prt = PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at)
        db.session.add(prt)
        db.session.commit()
        msg = (
            f"Password reset token generated for user_id={user.id} "
            f"(expires at {expires_at.isoformat()})"
        )
        logger.info(msg)
        frontend_base_url = os.environ.get("FRONTEND_BASE_URL", "http://localhost:3000")
        reset_link = (
            f"{frontend_base_url.rstrip('/')}/password-reset/confirm?token={token}"
        )
        email_body = render_password_reset_email(reset_link, expiration_minutes)
        email_sent = send_email(user.email, "Password Reset Request", email_body)
        if not email_sent:
            logger.error("Failed to send password reset email")
    else:
        # Simulate token generation and email send for non-existent user
        send_email(
            "dummy@localhost",
            "Password Reset Request",
            "If this were real, you'd get a reset link.",
        )
        time.sleep(0.5)  # Simulate token generation delay
    # Always return generic message
    if app.config.get("DEBUG", False) or app.config.get("TESTING", False):
        return (
            jsonify(
                {
                    "message": (
                        f"Password reset email sent to {email}"
                        if user
                        else "Email not found, no reset sent"
                    ),
                    "token": (
                        token if user else None
                    ),  # Include token in test/debug mode
                }
            ),
            200,
        )
    return (
        jsonify(
            {"message": "If the email exists, a password reset link will be sent."}
        ),
        200,
    )


# --- Password Reset Confirm ---


@app.route("/api/password-reset/confirm", methods=["POST"])
def password_reset_confirm():
    """Confirm password reset: token, new_password, validate, update."""
    logger.info("Password reset confirmation endpoint accessed.")
    if not request.is_json:
        logger.error("Password reset confirm failed: " "Request must be JSON.")
        return error_response("Request must be JSON", 400)

    data = request.get_json()
    token = data.get("token")
    new_password = data.get("new_password")
    if not token or not new_password:
        logger.error(
            "Password reset confirm failed: " "Token and new_password are required."
        )
        return error_response("Token and new_password are required", 400)

    prt = PasswordResetToken.query.filter_by(token=token).first()
    if not prt:
        logger.warning("Password reset confirm failed: Invalid token.")
        return error_response("Invalid or expired token", 400)
    if prt.used:
        logger.warning("Password reset confirm failed: Token already used.")
        return error_response("Invalid or expired token", 400)

    # Ensure expires_at is always timezone-aware (UTC)
    if prt.expires_at.tzinfo is None:
        expires_at_aware = prt.expires_at.replace(tzinfo=timezone.utc)
    else:
        expires_at_aware = prt.expires_at
    if expires_at_aware < datetime.now(timezone.utc):
        logger.warning("Password reset confirm failed: Token expired.")
        return error_response("Invalid or expired token", 400)

    user = db.session.get(User, prt.user_id)
    if not user:
        logger.error("Password reset confirm failed: User not found.")
        return error_response("Invalid or expired token", 400)

    if not is_strong_password(new_password):
        logger.error("Password reset confirm failed: Weak password.")
        return error_response(
            "Password must be at least 8 characters long and include "
            "uppercase, lowercase, numbers, and special characters.",
            400,
        )

    user.set_password(new_password)
    prt.used = True
    db.session.commit()
    logger.info("Password reset successful for user_id=%s", user.id)
    return jsonify({"message": "Password reset successful"}), 200


# Email configuration (set these as environment variables)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 1025))  # Default to local debug SMTP
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "false").lower() == "true"
EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@localhost")


def send_email(to_address, subject, body):
    """Send an email using SMTP. Logs success or failure."""
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = EMAIL_FROM
    msg["To"] = to_address
    msg.set_content(body)
    try:
        if EMAIL_USE_TLS:
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)  # pragma: no cover
        if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(
            "Password reset email sent to %s",
            to_address,
        )
        return True
    except Exception as e:
        logger.error(
            "Failed to send email to %s: %s",
            to_address,
            e,
        )
        return False


# Helper for password reset email template
def render_password_reset_email(reset_link, expiration_minutes=60):
    """Render the password reset email body using a template."""
    template = Template(
        "Hello,\n\nA password reset was requested for your account. "
        "If this was you, click the link below to reset your password.\n\n"
        "$reset_link\n\nExpires in $expiration_minutes minutes.\n\n"
        "If you did not request this, you can ignore this email.\n\n"
        "Thanks,\nProductivity Hub Team"
    )
    return template.substitute(
        reset_link=reset_link, expiration_minutes=expiration_minutes
    )


# Project Endpoints
# --- Get All Projects ---


@app.route("/api/projects", methods=["GET"])
@login_required
def get_projects():
    """Get all projects for the current user, paginated."""
    logger.info("Projects GET endpoint accessed.")
    user = get_current_user()

    # Parse pagination parameters
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
    except ValueError:
        logger.warning("Invalid pagination parameters for projects GET.")
        return error_response("Invalid pagination parameters.", 400)

    per_page = max(1, min(per_page, 100))  # Limit per_page to reasonable range
    logger.debug("Paginating projects: page=%s, per_page=%s", page, per_page)

    # Build query
    query = Project.query.filter_by(user_id=user.id).order_by(Project.created_at.desc())

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    projects_data = []
    for project in pagination.items:
        projects_data.append(
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "created_at": project.created_at.isoformat(),
                "updated_at": project.updated_at.isoformat(),
            }
        )

    logger.info("Returning %d projects for user: %s", len(projects_data), user.username)
    return (
        jsonify(
            {
                "projects": projects_data,
                "total": pagination.total,
                "pages": pagination.pages,
                "current_page": pagination.page,
                "per_page": pagination.per_page,
            }
        ),
        200,
    )


# --- Create Project ---


@app.route("/api/projects", methods=["POST"])
@login_required
def create_project():
    """Create a new project for the current user."""
    logger.info("Projects POST endpoint accessed.")
    user = get_current_user()

    if not request.is_json:
        return error_response("Request must be JSON", 400)

    data = request.get_json()
    name = data.get("name")
    description = data.get("description", "")

    if not name or not name.strip():
        return error_response("Project name is required", 400)

    try:
        project = Project(
            name=name.strip(),
            description=description.strip() if description else "",
            user_id=user.id,
        )
        db.session.add(project)
        db.session.commit()

        logger.info(
            "Project '%s' created successfully for user: %s",
            project.name,
            user.username,
        )
        return (
            jsonify(
                {
                    "id": project.id,
                    "name": project.name,
                    "description": project.description,
                    "created_at": project.created_at.isoformat(),
                    "updated_at": project.updated_at.isoformat(),
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error("Project creation failed: %s", e)
        return error_response("Failed to create project", 500)


# --- Get Project by ID ---


@app.route("/api/projects/<int:project_id>", methods=["GET"])
@login_required
def get_project(project_id):
    """Get a specific project by ID."""
    logger.info("Projects GET endpoint accessed for project ID: %s", project_id)
    user = get_current_user()

    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return error_response("Project not found", 404)

    logger.info("Returning project '%s' for user: %s", project.name, user.username)
    return (
        jsonify(
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "created_at": project.created_at.isoformat(),
                "updated_at": project.updated_at.isoformat(),
            }
        ),
        200,
    )


# --- Update Project ---


@app.route("/api/projects/<int:project_id>", methods=["PUT"])
@login_required
def update_project(project_id):
    """Update an existing project."""
    logger.info("Projects PUT endpoint accessed for project ID: %s", project_id)
    user = get_current_user()

    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return error_response("Project not found", 404)

    if not request.is_json:
        return error_response("Request must be JSON", 400)

    data = request.get_json()
    name = data.get("name")
    description = data.get("description")

    if not name or not name.strip():
        return error_response("Project name is required", 400)

    try:
        project.name = name.strip()
        if description is not None:
            project.description = description.strip()

        db.session.commit()

        logger.info(
            "Project '%s' updated successfully for user: %s",
            project.name,
            user.username,
        )
        return (
            jsonify(
                {
                    "id": project.id,
                    "name": project.name,
                    "description": project.description,
                    "created_at": project.created_at.isoformat(),
                    "updated_at": project.updated_at.isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error("Project update failed: %s", e)
        return error_response("Failed to update project", 500)


# --- Delete Project ---


@app.route("/api/projects/<int:project_id>", methods=["DELETE"])
@login_required
def delete_project(project_id):
    """Delete an existing project and all its tasks."""
    logger.info("Projects DELETE endpoint accessed for project ID: %s", project_id)
    user = get_current_user()

    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return error_response("Project not found", 404)

    try:
        project_name = project.name
        db.session.delete(project)
        db.session.commit()

        logger.info(
            "Project '%s' deleted successfully for user: %s",
            project_name,
            user.username,
        )
        return jsonify({"message": "Project deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error("Project deletion failed: %s", e)
        return error_response("Failed to delete project", 500)


# --- List Tasks ---
@app.route("/api/tasks", methods=["GET"])
@login_required
def list_tasks():
    """List all tasks for the current user, paginated."""
    logger.info("Tasks GET endpoint accessed.")
    user = get_current_user()
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
    except ValueError:
        logger.warning("Invalid pagination parameters for tasks GET.")
        return error_response("Invalid pagination parameters.", 400)
    per_page = max(1, min(per_page, 100))
    logger.debug("Paginating tasks: page=%s, per_page=%s", page, per_page)
    query = Task.query.filter_by(user_id=user.id).order_by(Task.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    tasks_data = []
    for task in pagination.items:
        task_dict = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "priority": task.priority,
            "project_id": task.project_id,
            "parent_id": task.parent_id,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
            "subtasks": [],
        }
        if task.due_date:
            task_dict["due_date"] = task.due_date.isoformat()
        if task.start_date:
            task_dict["start_date"] = task.start_date.isoformat()
        if task.recurrence:
            task_dict["recurrence"] = task.recurrence
        # Add subtasks
        for subtask in task.subtasks:
            subtask_dict = {
                "id": subtask.id,
                "title": subtask.title,
                "description": subtask.description,
                "completed": subtask.completed,
                "priority": subtask.priority,
                "created_at": subtask.created_at.isoformat(),
                "updated_at": subtask.updated_at.isoformat(),
            }
            if subtask.due_date:
                subtask_dict["due_date"] = subtask.due_date.isoformat()
            if subtask.start_date:
                subtask_dict["start_date"] = subtask.start_date.isoformat()
            task_dict["subtasks"].append(subtask_dict)
        tasks_data.append(task_dict)
    logger.info("Returning %d tasks for user: %s", len(tasks_data), user.username)
    return (
        jsonify(
            {
                "tasks": tasks_data,
                "total": pagination.total,
                "pages": pagination.pages,
                "current_page": pagination.page,
                "per_page": pagination.per_page,
            }
        ),
        200,
    )


@app.route("/api/tasks", methods=["POST"])
@login_required
def create_task():
    """Create a new task for the current user."""
    logger.info("Tasks POST endpoint accessed.")
    user = get_current_user()
    if not request.is_json:
        return error_response("Request must be JSON", 400)
    data = request.get_json()
    fields, err = _extract_task_fields(data, user)
    if err:
        return error_response(err, 400)
    try:
        task = Task(
            title=fields["title"],
            description=fields["description"],
            user_id=user.id,
            project_id=fields["project_id"],
            parent_id=fields["parent_id"],
            priority=fields["priority"],
        )
        if fields["due_date"]:
            task.due_date = fields["due_date"]
        if fields["start_date"]:
            task.start_date = fields["start_date"]
        if fields["recurrence"]:
            task.recurrence = fields["recurrence"]
        db.session.add(task)
        db.session.commit()
        logger.info(
            "Task '%s' created successfully for user: %s",
            task.title,
            user.username,
        )
        return jsonify(_serialize_task(task)), 201
    except Exception as e:
        db.session.rollback()
        logger.error("Task creation failed: %s", e)
        return error_response("Failed to create task", 500)


# --- Get Task by ID ---
@app.route("/api/tasks/<int:task_id>", methods=["GET"])
@login_required
def get_task(task_id):
    """Get a specific task by ID."""
    logger.info("Tasks GET endpoint accessed for task ID: %s", task_id)
    user = get_current_user()
    task = Task.query.filter_by(id=task_id, user_id=user.id).first()
    if not task:
        return error_response("Task not found", 404)
    task_dict = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "priority": task.priority,
        "project_id": task.project_id,
        "parent_id": task.parent_id,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }
    if task.due_date:
        task_dict["due_date"] = task.due_date.isoformat()
    if task.start_date:
        task_dict["start_date"] = task.start_date.isoformat()
    if task.recurrence:
        task_dict["recurrence"] = task.recurrence
    # Add subtasks
    subtasks = []
    for subtask in task.subtasks:
        subtask_dict = {
            "id": subtask.id,
            "title": subtask.title,
            "description": subtask.description,
            "completed": subtask.completed,
            "priority": subtask.priority,
            "created_at": subtask.created_at.isoformat(),
            "updated_at": subtask.updated_at.isoformat(),
        }
        if subtask.due_date:
            subtask_dict["due_date"] = subtask.due_date.isoformat()
        if subtask.start_date:
            subtask_dict["start_date"] = subtask.start_date.isoformat()
        subtasks.append(subtask_dict)
    task_dict["subtasks"] = subtasks
    logger.info("Returning task '%s' for user: %s", task.title, user.username)
    return jsonify(task_dict), 200


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
@login_required
def update_task(task_id):
    """Update an existing task."""
    logger.info("Tasks PUT endpoint accessed for task ID: %s", task_id)
    user = get_current_user()
    task = Task.query.filter_by(id=task_id, user_id=user.id).first()
    if not task:
        return error_response("Task not found", 404)
    if not request.is_json:
        return error_response("Request must be JSON", 400)
    data = request.get_json()

    try:
        err = _validate_and_update_task_fields(task, data, user)
        if err:
            return error_response(err, 400)
        db.session.commit()
        logger.info(
            "Task '%s' updated successfully for user: %s",
            task.title,
            user.username,
        )
        task_dict = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "priority": task.priority,
            "project_id": task.project_id,
            "parent_id": task.parent_id,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
            "subtasks": [],
        }
        if task.due_date:
            task_dict["due_date"] = task.due_date.isoformat()
        if task.start_date:
            task_dict["start_date"] = task.start_date.isoformat()
        if task.recurrence:
            task_dict["recurrence"] = task.recurrence
        return jsonify(task_dict), 200
    except Exception as e:
        db.session.rollback()
        logger.error("Task update failed: %s", e)
        return error_response("Failed to update task", 500)


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    """Delete an existing task and all its subtasks."""
    logger.info("Tasks DELETE endpoint accessed for task ID: %s", task_id)
    user = get_current_user()

    task = Task.query.filter_by(id=task_id, user_id=user.id).first()
    if not task:
        return error_response("Task not found", 404)

    try:
        task_title = task.title
        db.session.delete(task)
        db.session.commit()

        logger.info(
            "Task '%s' deleted successfully for user: %s",
            task_title,
            user.username,
        )
        return jsonify({"message": "Task deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error("Task deletion failed: %s", e)
        return error_response("Failed to delete task", 500)


if __name__ == "__main__":  # pragma: no cover
    init_db()  # pragma: no cover
    logger.info("Database initialized.")  # pragma: no cover
    logger.info("Starting Flask app...")  # pragma: no cover
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"  # pragma: no cover
    app.run(debug=debug_mode)  # pragma: no cover
