# ========================
# Imports
# ========================

import logging
import os
import sys
import warnings
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_migrate import Migrate
from models import db, logger, Task, Project, Notification
from utils import error_response, get_current_user, login_required
from routes.auth import auth_bp

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
db.init_app(app)
migrate = Migrate(app, db)
logger.info("SQLAlchemy is set up.")


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
        # Accept both blueprint and non-blueprint endpoint names
        if request.endpoint in ("login", "register", "auth.login", "auth.register"):
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
app.register_blueprint(auth_bp)


@app.route("/")
def home():
    """Home route."""
    logger.info("Home route accessed.")
    return "Welcome to the Productivity Hub Backend!"


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

# ==================
# Project Endpoints
# ==================


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


# --- Create Task ---


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


# --- Update Task ---


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


# --- Delete Task ---


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
