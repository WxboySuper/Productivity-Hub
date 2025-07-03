from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import logging
from email_validator import validate_email, EmailNotValidError
from werkzeug.security import generate_password_hash, check_password_hash
import re
from functools import wraps
from datetime import datetime, timezone, timedelta
import warnings
import zoneinfo
import secrets
import smtplib
from email.message import EmailMessage
from string import Template

# Logging Configuration
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format='%(asctime)s %(levelname)s %(threadName)s : %(message)s'
)
logger = logging.getLogger(__name__)
logger.info("Logging configured at level: %s", LOG_LEVEL)

logger.info("Starting Productivity Hub Backend...")
logger.info("Logging is configured.")

# Flask Application Setup
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
# Set database path to be in the same directory as this file
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, 'productivity_hub.db')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', f'sqlite:///{db_path}')
app.config['SESSION_COOKIE_SECURE'] = True  # Use secure cookies in production
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent JavaScript access to session cookies
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Set SameSite policy for session cookies

# Production warning if running in production environment
if os.environ.get("FLASK_ENV") == "production" or os.environ.get("ENVIRONMENT") == "production":
    warnings.warn("WARNING: This app is running in production mode! Ensure all security settings are properly configured, including CSRF protection.", RuntimeWarning)

logger.info("Flask app configuration is set up.")

db = SQLAlchemy(app)
migrate = Migrate(app, db)

logger.info("SQLAlchemy is set up.")

# Model Definitions
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(225), nullable=False)

    tasks = db.relationship('Task', backref='user', lazy=True, cascade='all, delete-orphan')
    projects = db.relationship('Project', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime)
    start_date = db.Column(db.DateTime)  # New: optional start date
    priority = db.Column(db.Integer, default=1, nullable=False)
    recurrence = db.Column(db.String)  # New: optional recurrence rule (string or JSON)
    completed = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')

class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(128), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)  # New: expiration timestamp
    used = db.Column(db.Boolean, default=False, nullable=False)

    user = db.relationship('User', backref=db.backref('password_reset_tokens', lazy=True))

# Helper Functions
def init_db():
    """
    Initialize the database tables for the Flask app.
    Should be called within an app context.
    """
    logger.info("Initializing the database.")
    with app.app_context():
        db.create_all()
    logger.info("Database tables created.")


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


def get_current_user():
    """
    Retrieve the current user from the session.
    Returns the User object if logged in, else None. Logs user lookup events.
    """
    user_id = session.get('user_id')
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


def serialize_task(task):
    """
    Serialize a Task SQLAlchemy object to a dictionary for API responses.
    Converts datetime fields to ISO 8601 strings. Logs serialization event.
    """
    logger.debug("Serializing task: %s", task.id)
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "start_date": task.start_date.isoformat() if task.start_date else None,  # New
        "priority": task.priority,
        "recurrence": task.recurrence,  # New
        "completed": task.completed,
        "project_id": task.project_id,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }


def serialize_project(project):
    """
    Serialize a Project SQLAlchemy object to a dictionary for API responses.
    Converts datetime fields to ISO 8601 strings. Logs serialization event.
    """
    logger.debug("Serializing project: %s", project.id)
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "user_id": project.user_id,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }


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
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function


def generate_csrf_token():
    """
    Generate a CSRF token and store it in the session if not present.
    Returns the CSRF token string.
    """
    if "_csrf_token" not in session:
        logger.info("Generating new CSRF token.")
        session["_csrf_token"] = secrets.token_hex(16)
    return session["_csrf_token"]


def csrf_protect():
    """
    Flask before_request handler to enforce CSRF protection on state-changing requests.
    - Skips protection in testing mode and for login/register endpoints.
    - Checks for a valid CSRF token in session and headers.
    Returns a JSON error response if the token is missing or invalid.
    """
    if app.config.get('TESTING', False):
        logger.debug("CSRF protection is disabled in TESTING mode.")
        return
    if request.method in ("POST", "PUT", "DELETE"):
        logger.debug("CSRF protection check for endpoint: %s", request.endpoint)
        if request.endpoint in ("login", "register"):
            logger.debug("CSRF check skipped for login/register endpoint.")
            return
        token = session.get("_csrf_token")
        header_token = request.headers.get("X-CSRF-Token")
        if not token or token != header_token:
            logger.warning("CSRF token missing or invalid.")
            return error_response("Invalid or missing CSRF token", 403)

app.before_request(csrf_protect)

# Helper for configurable timezone
DEFAULT_TIMEZONE = os.environ.get("DEFAULT_TIMEZONE", "UTC")
try:
    # Accept both 'UTC' and 'Etc/UTC' for compatibility
    try:
        local_tz = zoneinfo.ZoneInfo(DEFAULT_TIMEZONE)
    except Exception:
        local_tz = zoneinfo.ZoneInfo("Etc/UTC")
except Exception:
    local_tz = None


def parse_local_datetime(dt_str):
    """
    Parse an ISO 8601 datetime string, applying the configured timezone if missing.
    Returns a timezone-aware datetime object. Logs parsing events.
    """
    logger.debug("Parsing datetime string: %s", dt_str)
    dt = datetime.fromisoformat(dt_str)
    if dt.tzinfo is None and local_tz:
        dt = dt.replace(tzinfo=local_tz)
    logger.debug("Parsed datetime: %s", dt)
    return dt

# --- Global Helper Functions for Validation and Updates ---
def validate_and_update_username(user, username):
    """
    Validate and update a user's username.
    - Ensures the username is not empty and is unique.
    - Updates the user object if valid and changed.
    Returns True if updated, False if unchanged, or (jsonify, code) tuple on error.
    """
    logger.debug("Validating and updating username.")
    if not username or not username.strip():
        return error_response("Username is required and cannot be empty.", 400)
    if username != user.username:
        if User.query.filter_by(username=username).first():
            return error_response("Username already exists.", 400)
        logger.info("Username updated from %s to %s.", user.username, username.strip())
        user.username = username.strip()
        return True
    logger.debug("Username unchanged.")
    return False


def validate_and_update_email(user, email):
    """
    Validate and update a user's email address.
    - Ensures the email is not empty, valid, and unique.
    - Updates the user object if valid and changed.
    Returns True if updated, False if unchanged, or (jsonify, code) tuple on error.
    """
    logger.debug("Validating and updating email.")
    if not email or not email.strip():
        return error_response("Email is required and cannot be empty.", 400)
    try:
        validate_email(email)
    except EmailNotValidError as e:
        return error_response(str(e), 400)
    if email != user.email:
        if User.query.filter_by(email=email).first():
            return error_response("Email already exists.", 400)
        logger.info("Email updated from %s to %s.", user.email, email.strip())
        user.email = email.strip()
        return True
    logger.debug("Email unchanged.")
    return False


def validate_and_update_password(user, password):
    """
    Validate and update a user's password.
    - Ensures the password is not empty and meets strength requirements.
    - Updates the user object if valid.
    Returns True if updated, or (jsonify, code) tuple on error.
    """
    logger.debug("Validating and updating password.")
    if not password or not password.strip():
        return error_response("Password is required and cannot be empty.", 400)
    if not is_strong_password(password):
        return error_response("Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.", 400)
    logger.info("Password updated for user: %s (ID: %s)", user.username, user.id)
    user.set_password(password)
    return True


def validate_and_update_task_title(task, title):
    """
    Validate and update a task's title.
    - Ensures the title is not empty.
    - Updates the task object if valid.
    Returns True if updated, or (jsonify, code) tuple on error.
    """
    if not title or not title.strip():
        return error_response("Title is required and cannot be empty.", 400)
    logger.info("Updating title for task_id=%s", task.id)
    task.title = title.strip()
    return True


def validate_and_update_task_priority(task, priority):
    """
    Validate and update a task's priority.
    - Ensures the priority is an integer between 0 and 3.
    - Updates the task object if valid.
    Returns True if updated, or (jsonify, code) tuple on error.
    """
    if not isinstance(priority, int) or not (0 <= priority <= 3):
        return error_response("Priority must be an integer between 0 and 3.", 400)
    logger.info("Updating priority for task_id=%s", task.id)
    task.priority = priority
    return True


def validate_and_update_task_due_date(task, due_date_str):
    """
    Validate and update a task's due date.
    - Parses the due date string as ISO 8601, applies timezone if missing.
    - Updates the task object if valid, or clears if empty.
    Returns True if updated, or (jsonify, code) tuple on error.
    """
    if due_date_str:
        try:
            task.due_date = parse_local_datetime(due_date_str)
        except Exception:
            return error_response("Invalid due_date format. Use ISO 8601 with or without timezone.", 400)
    else:
        logger.info("Clearing due_date for task_id=%s", task.id)
        task.due_date = None
    return True


def validate_and_update_task_start_date(task, start_date_str):
    """
    Validate and update a task's start date.
    - Parses the start date string as ISO 8601, applies timezone if missing.
    - Updates the task object if valid, or clears if empty.
    Returns True if updated, or (jsonify, code) tuple on error.
    """
    if start_date_str:
        try:
            task.start_date = parse_local_datetime(start_date_str)
        except Exception:
            return error_response("Invalid start_date format. Use ISO 8601 with or without timezone.", 400)
    else:
        logger.info("Clearing start_date for task_id=%s", task.id)
        task.start_date = None
    return True


def validate_and_update_task_recurrence(task, recurrence):
    """
    Validate and update a task's recurrence rule.
    - Accepts a string (e.g., 'daily', 'weekly', 'custom') or JSON string.
    - Updates the task object if valid, or clears if empty.
    Returns True if updated, or (jsonify, code) tuple on error.
    """
    if recurrence:
        if not isinstance(recurrence, str):
            return error_response("Recurrence must be a string.", 400)
        logger.info("Updating recurrence for task_id=%s", task.id)
        task.recurrence = recurrence.strip()
    else:
        logger.info("Clearing recurrence for task_id=%s", task.id)
        task.recurrence = None
    return True


def validate_and_update_task_project(task, user, project_id):
    """
    Validate and update a task's project assignment.
    - Ensures the project exists and is owned by the user, or clears if None.
    - Updates the task object if valid.
    Returns True if updated, or (jsonify, code) tuple on error.
    """
    if project_id is not None:
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return error_response("Project not found or does not belong to the current user.", 404)
        logger.info("Updating project_id for task_id=%s", task.id)
        task.project_id = project_id
    else:
        logger.info("Clearing project_id for task_id=%s", task.id)
        task.project_id = None
    return True

# --- Pure validation helpers for task creation ---
def validate_task_start_date(start_date_str):
    """
    Validate and parse a start date string (ISO 8601, applies timezone if missing).
    Returns (parsed_datetime, None) if valid, or (None, (jsonify, code)) on error.
    """
    if start_date_str:
        try:
            dt = parse_local_datetime(start_date_str)
            return dt, None
        except Exception:
            return None, error_response("Invalid start_date format. Use ISO 8601 with or without timezone.", 400)
    return None, None


def validate_task_recurrence(recurrence):
    """
    Validate and clean a recurrence value (string or None).
    Returns (cleaned_value, None) if valid, or (None, (jsonify, code)) on error.
    """
    if recurrence:
        if not isinstance(recurrence, str):
            return None, error_response("Recurrence must be a string.", 400)
        return recurrence.strip(), None
    return None, None


def error_response(message, code):
    """
    Return a JSON error response with logging.
    - Logs the error message.
    - Returns a tuple (jsonify, code) for Flask endpoints.
    """
    logger.error(message)
    return jsonify({"error": message}), code


def get_object_or_404(model, object_id, user_id=None):
    """
    Retrieve a SQLAlchemy model instance by id (and user_id if provided).
    Returns the object if found, or a JSON error response with 404 if not found.
    """
    query = model.query.filter_by(id=object_id)
    if user_id is not None and hasattr(model, 'user_id'):
        query = query.filter_by(user_id=user_id)
    obj = query.first()
    if not obj:
        return error_response(f"{model.__name__} not found", 404)
    return obj


def paginate_query(query, page, per_page, serializer):
    """
    Paginate a SQLAlchemy query and serialize the results.
    Returns a dict with items, total, pages, current_page, and per_page.
    """
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    items = [serializer(item) for item in pagination.items]
    return {
        "items": items,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": pagination.page,
        "per_page": pagination.per_page
    }

# Route Definitions
@app.route('/')
def home():
    """Home route."""
    logger.info("Home route accessed.")
    return "Welcome to the Productivity Hub Backend!"

# User Endpoints (Registration, Login, Logout, Profile)
# Route for User Registration
@app.route('/api/register', methods=['POST'])
def register():
    """User registration endpoint."""
    logger.info("Register endpoint accessed.")

    if not request.is_json:
        logger.error("Request must be JSON.")
        return jsonify({"error": "Content-Type must be application/json"}), 400

    data = request.get_json()

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Validate Input
    if not username or not email or not password or not username.strip() or not email.strip() or not password.strip():
        logger.error("Missing required fields: username, email, or password.")
        return jsonify({"error": "Missing required fields"}), 400

    # Validate Email
    try:
        validate_email(email)
        logger.info("Email %s is valid.", email)
    except EmailNotValidError as e:
        logger.error("Invalid email: %s", e)
        return jsonify({"error": str(e)}), 400

    # Validate Password Strength
    if not is_strong_password(password):
        logger.error("Weak password provided.")
        return jsonify({"error": "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters."}), 400

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
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({"error": "username or email already exists"}), 400
        return jsonify({"error": "Registration failed"}), 500

    logger.info("User %s registered successfully.", username)
    return jsonify({"message": "User registered successfully"}), 201

# Route for User Login/Logout
@app.route('/api/login', methods=['POST'])
def login():
    """User login endpoint."""
    logger.info("Login endpoint accessed.")

    if not request.is_json:
        logger.error("Request must be JSON.")
        return jsonify({"error": "Content-Type must be application/json"}), 400

    data = request.get_json()
    username_or_email = data.get('username') or data.get('email')
    password = data.get('password')

    # Validate Input
    if not username_or_email or not password or not username_or_email.strip() or not password.strip():
        logger.error("Missing required fields: username/email or password.")
        return jsonify({"error": "Missing required fields"}), 400

    # Find user by username or email
    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

    # Always perform password check to prevent timing attacks
    if user:
        password_valid = user.check_password(password)
    else:
        # Perform dummy hash check to maintain consistent timing
        check_password_hash('dummy hash', password)
        password_valid = False

    if not user or not password_valid:
        # Log the invalid login attempt
        logger.warning("Invalid login attempt for user: %s", username_or_email)
        return jsonify({"error": "Invalid username/email or password"}), 401

    # Set session on successful login
    session['user_id'] = user.id
    logger.info("User %s logged in successfully.", user.username)
    return jsonify({"message": "Login successful"}), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    """
    User logout endpoint.
    Clears the user's session, effectively logging them out.
    """
    logger.info("Logout endpoint accessed.")
    session.pop('user_id', None)
    logger.info("User logged out successfully.")
    return jsonify({"message": "Logout successful"}), 200

@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    """Get the current user's profile."""
    logger.info("Profile GET endpoint accessed.")
    user = get_current_user()
    logger.info("Returning profile for user: %s (ID: %s)", user.username, user.id)
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email
    }), 200

@app.route('/api/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update the current user's profile (username, email, password)."""
    logger.info("Profile PUT endpoint accessed.")
    user = get_current_user()
    data = request.get_json()
    updated = False

    if "username" in data:
        result = validate_and_update_username(user, data["username"])
        if isinstance(result, tuple):
            return result
        if result:
            updated = True
    if "email" in data:
        result = validate_and_update_email(user, data["email"])
        if isinstance(result, tuple):
            return result
        if result:
            updated = True
    if "password" in data:
        result = validate_and_update_password(user, data["password"])
        if isinstance(result, tuple):
            return result
        if result:
            updated = True

    if not updated:
        return error_response("No valid fields to update.", 400)
    db.session.commit()
    logger.info("Profile updated successfully for user: %s (ID: %s)", user.username, user.id)
    return jsonify({"message": "Profile updated successfully."}), 200

# Routes for Task Management
@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    """Get all tasks for the current user, paginated."""
    logger.info("Tasks GET endpoint accessed.")
    user = get_current_user()
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
    except ValueError:
        logger.warning("Invalid pagination parameters for tasks GET.")
        return error_response("Invalid pagination parameters.", 400)
    per_page = max(1, min(per_page, 100))
    logger.debug("Paginating tasks: page=%s, per_page=%s", page, per_page)
    result = paginate_query(Task.query.filter_by(user_id=user.id).order_by(Task.id.desc()), page, per_page, serialize_task)
    logger.info("Returning %s tasks for user: %s (ID: %s)", len(result['items']), user.username, user.id)
    return jsonify({
        "tasks": result['items'],
        "total": result['total'],
        "pages": result['pages'],
        "current_page": result['current_page'],
        "per_page": result['per_page']
    }), 200

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
@login_required
def get_task(task_id):
    """Get a specific task by ID."""
    logger.info("Task GET endpoint accessed for task_id=%s", task_id)
    user = get_current_user()
    task = get_object_or_404(Task, task_id, user.id)
    if isinstance(task, tuple):
        return task
    logger.info("Returning task: %s for user: %s (ID: %s)", task.id, user.username, user.id)
    return jsonify(serialize_task(task)), 200

@app.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    """Create a new task."""
    logger.info("Task POST endpoint accessed.")
    user = get_current_user()
    data = request.get_json()
    title = data.get('title')

    if not title or not title.strip():
        logger.error("Task creation failed: Title is required and cannot be empty.")
        return error_response("Title is required and cannot be empty.", 400)

    # Validate and parse priority
    priority = data.get('priority', 1)
    if not isinstance(priority, int) or not (0 <= priority <= 3):
        logger.error("Task creation failed: Invalid priority value.")
        return error_response("Priority must be an integer between 0 and 3.", 400)

    # Parse due_date if provided
    due_date = None
    due_date_str = data.get('due_date')
    if due_date_str:
        try:
            due_date = parse_local_datetime(due_date_str)
        except Exception:
            logger.error("Task creation failed: Invalid due_date format.")
            return error_response("Invalid due_date format. Use ISO 8601 with or without timezone.", 400)

    # Validate start_date and recurrence using helpers
    start_date = None
    start_date_str = data.get('start_date')
    start_date, err = validate_task_start_date(start_date_str)
    if err:
        return err
    recurrence = data.get('recurrence')
    recurrence, err = validate_task_recurrence(recurrence)
    if err:
        return err

    # Validation: if both start_date and due_date are set, start_date must be <= due_date
    if start_date and due_date and start_date > due_date:
        logger.error("Task creation failed: start_date cannot be after due_date.")
        return error_response("start_date cannot be after due_date.", 400)

    # Validate and check project ownership if project_id is provided
    project_id = data.get('project_id')
    if project_id is not None:
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            logger.error("Task creation failed: Project not found or not owned by user. project_id=%s", project_id)
            return error_response("Project not found or does not belong to the current user.", 404)

    task = Task(
        title=title.strip(),
        description=data.get('description'),
        due_date=due_date,
        start_date=start_date,  # Include new field
        priority=priority,
        recurrence=recurrence,  # Include new field
        completed=data.get('completed', False),
        user_id=user.id,
        project_id=project_id
    )

    db.session.add(task)
    db.session.commit()
    logger.info("Task created successfully: task_id=%s for user: %s (ID: %s)", task.id, user.username, user.id)
    return jsonify(serialize_task(task)), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    """Update an existing task."""
    logger.info("Task PUT endpoint accessed for task_id=%s", task_id)
    user = get_current_user()
    task = Task.query.filter_by(id=task_id, user_id=user.id).first()

    if not task:
        return error_response("Task not found", 404)

    data = request.get_json()

    # Map of field name to (validator function, value)
    field_validators = [
        ("title", validate_and_update_task_title),
        ("due_date", validate_and_update_task_due_date),
        ("priority", validate_and_update_task_priority),
        ("project_id", lambda t, v: validate_and_update_task_project(t, user, v)),
        ("start_date", validate_and_update_task_start_date),
        ("recurrence", validate_and_update_task_recurrence),
    ]
    for field, validator in field_validators:
        if field in data:
            result = validator(task, data[field])
            if isinstance(result, tuple):
                return result

    # Direct assignments for simple fields
    if "description" in data:
        logger.info("Updating description for task_id=%s", task.id)
        task.description = data["description"]
    if "completed" in data:
        logger.info("Updating completed status for task_id=%s", task.id)
        task.completed = data["completed"]

    # Validation: if both start_date and due_date are set, start_date must be <= due_date
    if task.start_date and task.due_date and task.start_date > task.due_date:
        logger.error("Task update failed: start_date cannot be after due_date.")
        return error_response("start_date cannot be after due_date.", 400)

    db.session.commit()
    logger.info("Task updated successfully: task_id=%s", task_id)
    return jsonify(serialize_task(task)), 200

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    """Delete a task."""
    logger.info("Task DELETE endpoint accessed for task_id=%s", task_id)
    user = get_current_user()
    task = Task.query.filter_by(id=task_id, user_id=user.id).first()

    if not task:
        logger.error("Task deletion failed: Task not found. task_id=%s", task_id)
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    logger.info("Task deleted successfully: task_id=%s", task_id)
    return jsonify({"message": "Task deleted successfully"}), 200

# Routes for Project Management
@app.route('/api/projects', methods=['GET'])
@login_required
def get_projects():
    """Get all projects for the current user, paginated."""
    logger.info("Projects GET endpoint accessed.")
    user = get_current_user()
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
    except ValueError:
        logger.warning("Invalid pagination parameters for projects GET.")
        return error_response("Invalid pagination parameters.", 400)
    per_page = max(1, min(per_page, 100))
    logger.debug("Paginating projects: page=%s, per_page=%s", page, per_page)
    result = paginate_query(Project.query.filter_by(user_id=user.id).order_by(Project.id.desc()), page, per_page, serialize_project)
    logger.info("Returning %s projects for user: %s (ID: %s)", len(result['items']), user.username, user.id)
    return jsonify({
        "projects": result['items'],
        "total": result['total'],
        "pages": result['pages'],
        "current_page": result['current_page'],
        "per_page": result['per_page']
    }), 200

@app.route('/api/projects/<int:project_id>', methods=['GET'])
@login_required
def get_project(project_id):
    """Get a specific project by ID."""
    logger.info("Project GET endpoint accessed for project_id=%s", project_id)
    user = get_current_user()
    project = get_object_or_404(Project, project_id, user.id)
    if isinstance(project, tuple):
        return project
    logger.info("Returning project: %s for user: %s (ID: %s)", project.id, user.username, user.id)
    return jsonify(serialize_project(project)), 200

@app.route('/api/projects', methods=['POST'])
@login_required
def create_project():
    """Create a new project."""
    logger.info("Project POST endpoint accessed.")
    user = get_current_user()
    data = request.get_json()
    name = data.get('name')
    if not name or not name.strip():
        logger.error("Project creation failed: Name is required and cannot be empty.")
        return error_response("Name is required and cannot be empty.", 400)
    project = Project(
        name=name.strip(),
        description=data.get('description'),
        user_id=user.id
    )
    db.session.add(project)
    db.session.commit()
    logger.info("Project created successfully: project_id=%s for user: %s (ID: %s)", project.id, user.username, user.id)
    return jsonify(serialize_project(project)), 201

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
@login_required
def update_project(project_id):
    """Update an existing project."""
    logger.info("Project PUT endpoint accessed for project_id=%s", project_id)
    user = get_current_user()
    project = get_object_or_404(Project, project_id, user.id)
    if isinstance(project, tuple):
        return project
    data = request.get_json()
    if 'name' in data:
        if not data['name'] or not data['name'].strip():
            logger.error("Project update failed: Name is required and cannot be empty.")
            return error_response("Name is required and cannot be empty.", 400)
        logger.info("Updating name for project_id=%s", project_id)
        project.name = data['name'].strip()
    if 'description' in data:
        logger.info("Updating description for project_id=%s", project_id)
        project.description = data['description']
    db.session.commit()
    logger.info("Project updated successfully: project_id=%s", project_id)
    return jsonify(serialize_project(project)), 200

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@login_required
def delete_project(project_id):
    """Delete a project."""
    logger.info("Project DELETE endpoint accessed for project_id=%s", project_id)
    user = get_current_user()
    project = get_object_or_404(Project, project_id, user.id)
    if isinstance(project, tuple):
        return project
    db.session.delete(project)
    db.session.commit()
    logger.info("Project deleted successfully: project_id=%s", project_id)
    return jsonify({"message": "Project deleted successfully"}), 200

# Password Reset Routes
# Route for requesting a password reset
@app.route('/api/password-reset/request', methods=['POST'])
def password_reset_request():
    """Request a password reset: accepts email, generates token, stores it, sends email."""
    logger.info("Password reset request endpoint accessed.")
    if not request.is_json:
        logger.error("Password reset request failed: Request must be JSON.")
        return jsonify({"error": "Content-Type must be application/json"}), 400

    data = request.get_json()
    email = data.get('email')
    if not email or not email.strip():
        logger.error("Password reset request failed: Email is required.")
        # Always return generic message for security
        return jsonify({"message": "If the email exists, a password reset link will be sent."}), 200

    user = User.query.filter_by(email=email.strip()).first()
    if not user:
        logger.info("Password reset requested for non-existent email: %s", email)
        # Always return generic message for security
        return jsonify({"message": "If the email exists, a password reset link will be sent."}), 200

    # Generate secure token and expiration
    token = secrets.token_urlsafe(48)
    expiration_minutes = int(os.environ.get('PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', 60))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiration_minutes)
    prt = PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at)
    db.session.add(prt)
    db.session.commit()
    logger.info("Password reset token generated for user_id=%s (expires at %s)", user.id, expires_at.isoformat())

    # Send password reset email using template
    reset_link = f"https://yourdomain.com/reset-password?token={token}"
    email_body = render_password_reset_email(reset_link, expiration_minutes)
    email_sent = send_email(user.email, "Password Reset Request", email_body)
    if not email_sent:
        logger.error("Password reset email failed to send to %s", user.email)

    if app.config.get('DEBUG', False) or app.config.get('TESTING', False):
        return jsonify({
            "message": "If the email exists, a password reset link will be sent.",
            "token": token,
            "expires_at": expires_at.isoformat()
        }), 200
    return jsonify({"message": "If the email exists, a password reset link will be sent."}), 200

@app.route('/api/password-reset/confirm', methods=['POST'])
def password_reset_confirm():
    """
    Confirm a password reset: accepts token and new_password, validates and updates password.
    """
    logger.info("Password reset confirmation endpoint accessed.")
    if not request.is_json:
        logger.error("Password reset confirm failed: Request must be JSON.")
        return jsonify({"error": "Content-Type must be application/json"}), 400

    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')
    if not token or not new_password:
        logger.error("Password reset confirm failed: Token and new_password are required.")
        return jsonify({"error": "Token and new_password are required."}), 400

    prt = PasswordResetToken.query.filter_by(token=token).first()
    if not prt:
        logger.warning("Password reset confirm failed: Invalid token.")
        return jsonify({"error": "Invalid or expired token."}), 400
    if prt.used:
        logger.warning("Password reset confirm failed: Token already used.")
        return jsonify({"error": "This token has already been used."}), 400

    # Ensure expires_at is always timezone-aware (UTC)
    if prt.expires_at.tzinfo is None:
        expires_at_aware = prt.expires_at.replace(tzinfo=timezone.utc)
    else:
        expires_at_aware = prt.expires_at
    if expires_at_aware < datetime.now(timezone.utc):
        logger.warning("Password reset confirm failed: Token expired.")
        return jsonify({"error": "Invalid or expired token."}), 400

    user = db.session.get(User, prt.user_id)
    if not user:
        logger.error("Password reset confirm failed: User not found for token.")
        return jsonify({"error": "Invalid token."}), 400

    if not is_strong_password(new_password):
        logger.warning("Password reset confirm failed: Weak password.")
        return jsonify({"error": "Password does not meet strength requirements."}), 400

    user.set_password(new_password)
    prt.used = True
    db.session.commit()
    logger.info("Password reset successful for user_id=%s", user.id)
    return jsonify({"message": "Password has been reset successfully."}), 200

# Email configuration (set these as environment variables)
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 1025))  # Default to local debug SMTP
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'false').lower() == 'true'
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'noreply@localhost')


def send_email(to_address, subject, body):
    """
    Send an email using SMTP. Logs success or failure.
    """
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = EMAIL_FROM
    msg['To'] = to_address
    msg.set_content(body)
    try:
        if EMAIL_USE_TLS:
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info("Password reset email sent to %s", to_address)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_address, e)
        return False

# Helper for password reset email template
def render_password_reset_email(reset_link, expiration_minutes=60):
    """
    Render the password reset email body using a template.
    """
    template = Template(
        """Hello,\n\nA password reset was requested for your account. If this was you, click the link below to reset your password.\n\n$reset_link\n\nThis link will expire in $expiration_minutes minutes.\n\nIf you did not request this, you can ignore this email.\n\nThanks,\nProductivity Hub Team"""
    )
    return template.substitute(reset_link=reset_link, expiration_minutes=expiration_minutes)

if __name__ == '__main__':
    init_db()
    logger.info("Database initialized.")
    logger.info("Starting Flask app...")
    app.run(debug=True)