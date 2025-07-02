from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import logging
from email_validator import validate_email, EmailNotValidError
from werkzeug.security import generate_password_hash, check_password_hash
import re
from functools import wraps
from datetime import datetime
import warnings
import zoneinfo
import secrets

# Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(threadName)s : %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("Starting Productivity Hub Backend...")
logger.info("Logging is configured.")

# Flask Application Setup
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///productivity_hub.db')
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
    priority = db.Column(db.Integer, default=1, nullable=False)
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

# Helper Functions
def init_db():
    """Initialize the database."""
    with app.app_context():
        db.create_all()

def is_strong_password(password):
    """Check if the password is strong."""
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True

def get_current_user():
    """Helper function to get the current user from the session."""
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    return None

def serialize_task(task):
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "priority": task.priority,
        "completed": task.completed,
        "project_id": task.project_id,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }

def serialize_project(project):
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "user_id": project.user_id,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }

# Decorator Functions
def login_required(f):
    """Decorator to ensure the user is logged in."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

# CSRF Protection for API (state-changing requests)
@app.before_request
def csrf_protect():
    if request.method in ("POST", "PUT", "DELETE"):
        # Exclude login and register endpoints from CSRF for demonstration
        if request.endpoint in ("login", "register"):
            return
        token = session.get("_csrf_token")
        header_token = request.headers.get("X-CSRF-Token")
        if not token or token != header_token:
            return jsonify({"error": "CSRF token missing or invalid"}), 400

def generate_csrf_token():
    if "_csrf_token" not in session:
        session["_csrf_token"] = secrets.token_hex(16)
    return session["_csrf_token"]

app.jinja_env.globals["csrf_token"] = generate_csrf_token

# Helper for configurable timezone
DEFAULT_TIMEZONE = os.environ.get("DEFAULT_TIMEZONE", "UTC")
try:
    local_tz = zoneinfo.ZoneInfo(DEFAULT_TIMEZONE)
except Exception:
    local_tz = zoneinfo.ZoneInfo("UTC")

def parse_local_datetime(dt_str):
    dt = datetime.fromisoformat(dt_str)
    if dt.tzinfo is None and local_tz:
        dt = dt.replace(tzinfo=local_tz)
    return dt

# Route Definitions
@app.route('/')
def home():
    """Home route."""
    logger.info("Home route accessed.")
    return "Welcome to the Productivity Hub Backend!"

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

# Routes for Task Management
@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    """Get all tasks for the current user, paginated."""
    user = get_current_user()
    # Get pagination parameters from query string
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
    except ValueError:
        return jsonify({"error": "Invalid pagination parameters."}), 400
    per_page = max(1, min(per_page, 100))  # Limit per_page to 1-100
    pagination = Task.query.filter_by(user_id=user.id).order_by(Task.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
    tasks = [serialize_task(task) for task in pagination.items]
    return jsonify({
        "tasks": tasks,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": pagination.page,
        "per_page": pagination.per_page
    }), 200

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
@login_required
def get_task(task_id):
    """Get a specific task by ID."""
    user = get_current_user()
    task = Task.query.filter_by(id=task_id, user_id=user.id).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(serialize_task(task)), 200

@app.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    """Create a new task."""
    user = get_current_user()
    data = request.get_json()
    title = data.get('title')

    if not title or not title.strip():
        return jsonify({"error": "Title is required and cannot be empty."}), 400

    # Validate and parse priority
    priority = data.get('priority', 1)
    if not isinstance(priority, int) or not (0 <= priority <= 3):
        return jsonify({"error": "Priority must be an integer between 0 and 3."}), 400

    # Parse due_date if provided
    due_date = None
    due_date_str = data.get('due_date')
    if due_date_str:
        try:
            due_date = parse_local_datetime(due_date_str)
        except Exception:
            return jsonify({"error": "Invalid due_date format. Use ISO 8601 with or without timezone."}), 400

    # Validate and check project ownership if project_id is provided
    project_id = data.get('project_id')
    if project_id is not None:
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return jsonify({"error": "Project not found or does not belong to the current user."}), 404

    task = Task(
        title=title.strip(),
        description=data.get('description'),
        due_date=due_date,
        priority=priority,
        completed=data.get('completed', False),
        user_id=user.id,
        project_id=project_id
    )

    db.session.add(task)
    db.session.commit()

    return jsonify(serialize_task(task)), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    """Update an existing task."""
    user = get_current_user()
    task = Task.query.filter_by(id=task_id, user_id=user.id).first()

    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json()

    if 'title' in data:
        if not data['title'] or not data['title'].strip():
            return jsonify({"error": "Title is required and cannot be empty."}), 400
        task.title = data['title'].strip()
    if 'description' in data:
        task.description = data['description']
    if 'due_date' in data:
        due_date_str = data['due_date']
        if due_date_str:
            try:
                task.due_date = parse_local_datetime(due_date_str)
            except Exception:
                return jsonify({"error": "Invalid due_date format. Use ISO 8601 with or without timezone."}), 400
        else:
            task.due_date = None
    if 'priority' in data:
        priority = data['priority']
        if not isinstance(priority, int) or not (0 <= priority <= 3):
            return jsonify({"error": "Priority must be an integer between 0 and 3."}), 400
        task.priority = priority
    if 'completed' in data:
        task.completed = data['completed']
    if 'project_id' in data:
        project_id = data['project_id']
        if project_id is not None:
            project = Project.query.filter_by(id=project_id, user_id=user.id).first()
            if not project:
                return jsonify({"error": "Project not found or does not belong to the current user."}), 404
            task.project_id = project_id
        else:
            task.project_id = None

    db.session.commit()

    return jsonify(serialize_task(task)), 200

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    """Delete a task."""
    user = get_current_user()
    task = Task.query.filter_by(id=task_id, user_id=user.id).first()

    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task deleted successfully"}), 200

# Routes for Project Management
@app.route('/api/projects', methods=['GET'])
@login_required
def get_projects():
    """Get all projects for the current user, paginated."""
    user = get_current_user()
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
    except ValueError:
        return jsonify({"error": "Invalid pagination parameters."}), 400
    per_page = max(1, min(per_page, 100))
    pagination = Project.query.filter_by(user_id=user.id).order_by(Project.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
    projects = [serialize_project(project) for project in pagination.items]
    return jsonify({
        "projects": projects,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": pagination.page,
        "per_page": pagination.per_page
    }), 200

@app.route('/api/projects/<int:project_id>', methods=['GET'])
@login_required
def get_project(project_id):
    """Get a specific project by ID."""
    user = get_current_user()
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(serialize_project(project)), 200

@app.route('/api/projects', methods=['POST'])
@login_required
def create_project():
    """Create a new project."""
    user = get_current_user()
    data = request.get_json()
    name = data.get('name')
    if not name or not name.strip():
        return jsonify({"error": "Name is required and cannot be empty."}), 400
    project = Project(
        name=name.strip(),
        description=data.get('description'),
        user_id=user.id
    )
    db.session.add(project)
    db.session.commit()
    return jsonify(serialize_project(project)), 201

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
@login_required
def update_project(project_id):
    """Update an existing project."""
    user = get_current_user()
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404
    data = request.get_json()
    if 'name' in data:
        if not data['name'] or not data['name'].strip():
            return jsonify({"error": "Name is required and cannot be empty."}), 400
        project.name = data['name'].strip()
    if 'description' in data:
        project.description = data['description']
    db.session.commit()
    return jsonify(serialize_project(project)), 200

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@login_required
def delete_project(project_id):
    """Delete a project."""
    user = get_current_user()
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted successfully"}), 200

if __name__ == '__main__':
    init_db()
    logger.info("Database initialized.")
    logger.info("Starting Flask app...")
    app.run(debug=True)