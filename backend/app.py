import os
import sys
import re
import secrets
import logging
import warnings
import smtplib
import threading
import calendar
import zoneinfo
from dotenv import load_dotenv
from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from email_validator import validate_email, EmailNotValidError
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import datetime, timezone, timedelta
from email.message import EmailMessage
from string import Template
from dateutil.rrule import rrule, rrulestr, DAILY, WEEKLY, MONTHLY

# Explicitly check for .env file and load success
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DOTENV_PATH = os.path.join(BASE_DIR, '.env')
if not os.path.exists(DOTENV_PATH):
    print(f"ERROR: .env file not found at {DOTENV_PATH}. Application will exit.")
    sys.exit(1)
if not load_dotenv(DOTENV_PATH):
    print(f"ERROR: Failed to load .env file at {DOTENV_PATH}. Application will exit.")
    sys.exit(1)

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
db_path = os.path.join(BASE_DIR, 'productivity_hub.db')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', f'sqlite:///{db_path}')
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent JavaScript access to session cookies
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Set SameSite policy for session cookies

# Production warning if running in production environment
if os.environ.get("FLASK_ENV") == "production" or os.environ.get("ENVIRONMENT") == "production":
    warnings.warn("WARNING: This app is running in production mode! Ensure all security settings are properly configured, including CSRF protection.", RuntimeWarning)

logger.info("Flask app configuration is set up.")

db = SQLAlchemy(app)
migrate = Migrate(app, db)

logger.info("SQLAlchemy is set up.")

# Association table for task dependencies (blocked by/blocking)
task_dependencies = db.Table(
    'task_dependencies',
    db.Column('blocker_id', db.Integer, db.ForeignKey('task.id', ondelete='CASCADE'), primary_key=True),
    db.Column('blocked_id', db.Integer, db.ForeignKey('task.id', ondelete='CASCADE'), primary_key=True)
)

# Association table for linked/related tasks (non-blocking relationships)
task_links = db.Table(
    'task_links',
    db.Column('task_a_id', db.Integer, db.ForeignKey('task.id', ondelete='CASCADE'), primary_key=True),
    db.Column('task_b_id', db.Integer, db.ForeignKey('task.id', ondelete='CASCADE'), primary_key=True)
)

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
    parent_id = db.Column(db.Integer, db.ForeignKey('task.id', ondelete='CASCADE'), nullable=True)  # Subtask support
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    # Subtasks relationship
    subtasks = db.relationship('Task', backref=db.backref('parent', remote_side=[id]), lazy=True, cascade='all, delete-orphan')

    # Task dependencies (blocked by/blocking)
    blocked_by = db.relationship(
        'Task', secondary=task_dependencies,
        primaryjoin=id==task_dependencies.c.blocked_id,
        secondaryjoin=id==task_dependencies.c.blocker_id,
        backref=db.backref('blocking', lazy='dynamic'),
        lazy='dynamic'
    )

    # Linked/related tasks (non-blocking relationships)
    linked_tasks = db.relationship(
        'Task', secondary=task_links,
        primaryjoin=id==task_links.c.task_a_id,
        secondaryjoin=id==task_links.c.task_b_id,
        lazy='dynamic'
    )

    # Reminder fields
    reminder_time = db.Column(db.DateTime, nullable=True)
    reminder_recurring = db.Column(db.String, nullable=True)  # e.g., 'DAILY', 'WEEKLY', rrule string, etc.
    reminder_snoozed_until = db.Column(db.DateTime, nullable=True)
    reminder_enabled = db.Column(db.Boolean, default=True, nullable=False)

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

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=True)
    title = db.Column(db.String(100), nullable=True)  # Optional title for notifications
    message = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    read = db.Column(db.Boolean, default=False, nullable=False)
    snoozed_until = db.Column(db.DateTime, nullable=True)
    type = db.Column(db.String(32), default='reminder', nullable=False)
    show_at = db.Column(db.DateTime, nullable=True)  # When the notification should appear

    user = db.relationship('User', backref=db.backref('notifications', lazy=True))
    task = db.relationship('Task', backref=db.backref('notifications', lazy=True))

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

def error_response(message, code):
    """
    Return a JSON error response with logging.
    - Logs the error message.
    - Returns a tuple (jsonify, code) for Flask endpoints.
    """
    logger.error(message)
    return jsonify({"error": message}), code

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

def generate_csrf_token():
    """
    Generate a CSRF token and return it. 
    The token should be set as a cookie by the caller.
    Returns the CSRF token string.
    """
    # Check if token already exists in cookie
    existing_token = request.cookies.get("_csrf_token")
    if existing_token:
        logger.debug("Using existing CSRF token from cookie.")
        return existing_token
    
    # Generate new token
    logger.info("Generating new CSRF token.")
    return secrets.token_hex(16)

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
        
        # Get CSRF token from cookie (not session)
        token = request.cookies.get("_csrf_token")
        header_token = request.headers.get("X-CSRF-Token")
        
        logger.debug("CSRF token validation - Cookie: %s, Header: %s", 
                    token[:10] + "..." if token else "None",
                    header_token[:10] + "..." if header_token else "None")
        
        if not token or token != header_token:
            logger.warning("CSRF token missing or invalid. Cookie: %s, Header: %s", token, header_token)
            return error_response("Invalid or missing CSRF token", 403)

app.before_request(csrf_protect)

# Route Definitions
@app.route('/')
def home():
    """Home route."""
    logger.info("Home route accessed.")
    return "Welcome to the Productivity Hub Backend!"

# User Endpoints (Registration, Login, Logout, Profile)
@app.route('/api/register', methods=['POST'])
def register():
    """User registration endpoint."""
    logger.info("Register endpoint accessed.")

    if not request.is_json:
        logger.error("Request must be JSON.")
        return error_response("Request must be JSON", 400)

    data = request.get_json()

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Validate Input
    if not username or not email or not password or not username.strip() or not email.strip() or not password.strip():
        logger.error("Missing required fields: username, email, or password.")
        return error_response("Missing required fields: username, email, or password", 400)

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
        return error_response("Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.", 400)

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
            return error_response("Username or email already exists", 400)
        return error_response("Registration failed", 500)

    logger.info("User %s registered successfully.", username)
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    """User login endpoint."""
    logger.info("Login endpoint accessed.")

    if not request.is_json:
        logger.error("Request must be JSON.")
        return error_response("Request must be JSON", 400)

    data = request.get_json()
    username_or_email = data.get('username') or data.get('email')
    password = data.get('password')

    # Validate Input
    if not username_or_email or not password or not username_or_email.strip() or not password.strip():
        logger.error("Missing required fields: username/email or password.")
        return error_response("Missing required fields: username/email or password", 400)

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
        return error_response("Invalid username/email or password", 401)

    # Set session on successful login
    session['user_id'] = user.id
    
    # Force session to be saved
    session.permanent = True
    session.modified = True
    
    # Debug session after login
    logger.debug("Session after login: %s", dict(session))
    logger.debug("Session ID after login: %s", session.get('_id', 'No session ID'))
    
    logger.info("User %s logged in successfully.", user.username)
    return jsonify({
        "message": "Login successful",
        "session_debug": {
            "user_id": session.get('user_id'),
            "has_session_id": bool(session.get('_id')),
            "session_keys": list(session.keys())
        }
    }), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    """
    User logout endpoint.
    Clears the user's session, effectively logging them out.
    """
    logger.info("Logout endpoint accessed.")
    session.clear()  # Clear the entire session
    logger.info("User logged out successfully.")
    return jsonify({"message": "Logout successful"}), 200

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    """
    Check if the user is currently authenticated.
    Returns authentication status and user info if logged in.
    """
    # Debug session information
    logger.debug("Session contents: %s", dict(session))
    logger.debug("Session ID: %s", session.get('_id', 'No session ID'))
    logger.debug("User ID from session: %s", session.get('user_id', 'No user ID'))
    
    user = get_current_user()
    if user:
        logger.info("Auth check: User %s (ID: %s) is authenticated", user.username, user.id)
        return jsonify({
            "authenticated": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "session_info": {
                "has_session_id": bool(session.get('_id')),
                "has_user_id": bool(session.get('user_id')),
                "session_keys": list(session.keys())
            }
        }), 200
    else:
        logger.info("Auth check: No authenticated user")
        return jsonify({
            "authenticated": False,
            "user": None,
            "session_info": {
                "has_session_id": bool(session.get('_id')),
                "has_user_id": bool(session.get('user_id')),
                "session_keys": list(session.keys())
            }
        }), 200

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

@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    """Get all notifications for the current user."""
    logger.info("Notifications GET endpoint accessed.")
    user = get_current_user()
    notifications = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).all()
    
    notifications_data = []
    for notification in notifications:
        notification_dict = {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "read": notification.read,
            "created_at": notification.created_at.isoformat(),
            "task_id": notification.task_id
        }
        # Include show_at if it exists
        if notification.show_at:
            notification_dict["show_at"] = notification.show_at.isoformat()
        # Include snoozed_until if it exists
        if hasattr(notification, 'snoozed_until') and notification.snoozed_until:
            notification_dict["snoozed_until"] = notification.snoozed_until.isoformat()
        
        notifications_data.append(notification_dict)
    
    logger.info("Returning %d notifications for user: %s", len(notifications_data), user.username)
    return jsonify(notifications_data), 200

@app.route('/api/notifications/<int:notification_id>/dismiss', methods=['POST'])
@login_required
def dismiss_notification(notification_id):
    """Mark a notification as read/dismissed."""
    logger.info("Notification dismiss endpoint accessed for notification ID: %s", notification_id)
    user = get_current_user()
    
    notification = Notification.query.filter_by(id=notification_id, user_id=user.id).first()
    if not notification:
        logger.warning("Notification not found or doesn't belong to user: %s", notification_id)
        return jsonify({"error": "Notification not found"}), 404
    
    notification.read = True
    db.session.commit()
    
    logger.info("Notification %s dismissed by user: %s", notification_id, user.username)
    return jsonify({"success": True}), 200

@app.route('/api/notifications/<int:notification_id>/snooze', methods=['POST'])
@login_required
def snooze_notification(notification_id):
    """Snooze a notification for a specified duration."""
    logger.info("Notification snooze endpoint accessed for notification ID: %s", notification_id)
    user = get_current_user()
    
    notification = Notification.query.filter_by(id=notification_id, user_id=user.id).first()
    if not notification:
        logger.warning("Notification not found or doesn't belong to user: %s", notification_id)
        return jsonify({"error": "Notification not found"}), 404
    
    data = request.get_json()
    if not data or 'minutes' not in data:
        return jsonify({"error": "Minutes parameter is required"}), 400
    
    try:
        minutes = int(data['minutes'])
        if minutes <= 0:
            return jsonify({"error": "Minutes must be positive"}), 400
        
        # Calculate snooze time
        snooze_until = datetime.now(timezone.utc) + timedelta(minutes=minutes)
        
        # Update notification with snooze time
        if not hasattr(notification, 'snoozed_until'):
            # If the column doesn't exist, we'll need to add it to the model
            logger.warning("Notification model missing snoozed_until field")
            return jsonify({"error": "Snooze functionality not available"}), 500
        
        notification.snoozed_until = snooze_until
        db.session.commit()
        
        logger.info("Notification %s snoozed for %d minutes by user: %s", notification_id, minutes, user.username)
        return jsonify({"success": True, "snoozed_until": snooze_until.isoformat()}), 200
        
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid minutes value"}), 400

@app.route('/api/csrf-token', methods=['GET'])
def get_csrf_token():
    """
    Public endpoint to generate and set a CSRF token for the current session.
    Returns the CSRF token in JSON and sets it in the session/cookie.
    This allows unauthenticated users to obtain a CSRF token for password reset and other flows.
    """
    logger.info("CSRF token endpoint accessed.")
    token = generate_csrf_token()
    response = jsonify({"csrf_token": token})
    # Set cookie explicitly for frontend JS if needed (optional, Flask session cookie is usually enough)
    response.set_cookie('_csrf_token', token, httponly=False, samesite='Lax')
    return response

# Project Endpoints
@app.route('/api/projects', methods=['GET'])
@login_required
def get_projects():
    """Get all projects for the current user."""
    logger.info("Projects GET endpoint accessed.")
    user = get_current_user()
    projects = Project.query.filter_by(user_id=user.id).order_by(Project.created_at.desc()).all()
    
    projects_data = []
    for project in projects:
        projects_data.append({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "created_at": project.created_at.isoformat(),
            "updated_at": project.updated_at.isoformat()
        })
    
    logger.info("Returning %d projects for user: %s", len(projects_data), user.username)
    return jsonify({"projects": projects_data}), 200

@app.route('/api/projects', methods=['POST'])
@login_required
def create_project():
    """Create a new project for the current user."""
    logger.info("Projects POST endpoint accessed.")
    user = get_current_user()
    
    if not request.is_json:
        return error_response("Request must be JSON", 400)
    
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    
    if not name or not name.strip():
        return error_response("Project name is required", 400)
    
    try:
        project = Project(
            name=name.strip(),
            description=description.strip() if description else '',
            user_id=user.id
        )
        db.session.add(project)
        db.session.commit()
        
        logger.info("Project '%s' created successfully for user: %s", project.name, user.username)
        return jsonify({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "created_at": project.created_at.isoformat(),
            "updated_at": project.updated_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error("Project creation failed: %s", e)
        return error_response("Failed to create project", 500)

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
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
    name = data.get('name')
    description = data.get('description')
    
    if not name or not name.strip():
        return error_response("Project name is required", 400)
    
    try:
        project.name = name.strip()
        if description is not None:
            project.description = description.strip()
        
        db.session.commit()
        
        logger.info("Project '%s' updated successfully for user: %s", project.name, user.username)
        return jsonify({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "created_at": project.created_at.isoformat(),
            "updated_at": project.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error("Project update failed: %s", e)
        return error_response("Failed to update project", 500)

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
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
        
        logger.info("Project '%s' deleted successfully for user: %s", project_name, user.username)
        return jsonify({"message": "Project deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error("Project deletion failed: %s", e)
        return error_response("Failed to delete project", 500)

# Task Endpoints
@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    """Get all tasks for the current user."""
    logger.info("Tasks GET endpoint accessed.")
    user = get_current_user()
    tasks = Task.query.filter_by(user_id=user.id).order_by(Task.created_at.desc()).all()
    
    tasks_data = []
    for task in tasks:
        task_dict = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "priority": task.priority,
            "project_id": task.project_id,
            "parent_id": task.parent_id,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        }
        
        # Include optional fields if they exist
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
                "updated_at": subtask.updated_at.isoformat()
            }
            if subtask.due_date:
                subtask_dict["due_date"] = subtask.due_date.isoformat()
            if subtask.start_date:
                subtask_dict["start_date"] = subtask.start_date.isoformat()
            subtasks.append(subtask_dict)
        
        task_dict["subtasks"] = subtasks
        tasks_data.append(task_dict)
    
    logger.info("Returning %d tasks for user: %s", len(tasks_data), user.username)
    return jsonify(tasks_data), 200

@app.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    """Create a new task for the current user."""
    logger.info("Tasks POST endpoint accessed.")
    user = get_current_user()
    
    if not request.is_json:
        return error_response("Request must be JSON", 400)
    
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    project_id = data.get('project_id')
    parent_id = data.get('parent_id')
    priority = data.get('priority', 1)
    due_date = data.get('due_date')
    start_date = data.get('start_date')
    recurrence = data.get('recurrence')
    
    if not title or not title.strip():
        return error_response("Task title is required", 400)
    
    # Validate project_id belongs to user
    if project_id:
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return error_response("Invalid project ID", 400)
    
    # Validate parent_id belongs to user
    if parent_id:
        parent_task = Task.query.filter_by(id=parent_id, user_id=user.id).first()
        if not parent_task:
            return error_response("Invalid parent task ID", 400)
    
    try:
        task = Task(
            title=title.strip(),
            description=description.strip() if description else '',
            user_id=user.id,
            project_id=project_id,
            parent_id=parent_id,
            priority=priority
        )
        
        # Parse dates if provided
        if due_date:
            try:
                task.due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            except ValueError:
                return error_response("Invalid due_date format", 400)
                
        if start_date:
            try:
                task.start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except ValueError:
                return error_response("Invalid start_date format", 400)
                
        if recurrence:
            task.recurrence = recurrence
        
        db.session.add(task)
        db.session.commit()
        
        logger.info("Task '%s' created successfully for user: %s", task.title, user.username)
        
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
            "subtasks": []
        }
        
        if task.due_date:
            task_dict["due_date"] = task.due_date.isoformat()
        if task.start_date:
            task_dict["start_date"] = task.start_date.isoformat()
        if task.recurrence:
            task_dict["recurrence"] = task.recurrence
            
        return jsonify(task_dict), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error("Task creation failed: %s", e)
        return error_response("Failed to create task", 500)

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
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
        "updated_at": task.updated_at.isoformat()
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
            "updated_at": subtask.updated_at.isoformat()
        }
        if subtask.due_date:
            subtask_dict["due_date"] = subtask.due_date.isoformat()
        if subtask.start_date:
            subtask_dict["start_date"] = subtask.start_date.isoformat()
        subtasks.append(subtask_dict)
    
    task_dict["subtasks"] = subtasks
    
    logger.info("Returning task '%s' for user: %s", task.title, user.username)
    return jsonify(task_dict), 200

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
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
        # Update fields if provided
        if 'title' in data:
            if not data['title'] or not data['title'].strip():
                return error_response("Task title is required", 400)
            task.title = data['title'].strip()
            
        if 'description' in data:
            task.description = data['description'].strip() if data['description'] else ''
            
        if 'completed' in data:
            task.completed = bool(data['completed'])
            
        if 'priority' in data:
            task.priority = data['priority']
            
        if 'project_id' in data:
            if data['project_id']:
                project = Project.query.filter_by(id=data['project_id'], user_id=user.id).first()
                if not project:
                    return error_response("Invalid project ID", 400)
            task.project_id = data['project_id']
            
        if 'due_date' in data:
            if data['due_date']:
                try:
                    task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except ValueError:
                    return error_response("Invalid due_date format", 400)
            else:
                task.due_date = None
                
        if 'start_date' in data:
            if data['start_date']:
                try:
                    task.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
                except ValueError:
                    return error_response("Invalid start_date format", 400)
            else:
                task.start_date = None
                
        if 'recurrence' in data:
            task.recurrence = data['recurrence']
        
        db.session.commit()
        
        logger.info("Task '%s' updated successfully for user: %s", task.title, user.username)
        
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
            "subtasks": []
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

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
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
        
        logger.info("Task '%s' deleted successfully for user: %s", task_title, user.username)
        return jsonify({"message": "Task deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error("Task deletion failed: %s", e)
        return error_response("Failed to delete task", 500)

if __name__ == '__main__':
    init_db()
    logger.info("Database initialized.")
    logger.info("Starting Flask app...")
    app.run(debug=True)
