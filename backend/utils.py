# --- Task Validation/Parsing Helpers ---
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


# --- Recreated Task Validation Helpers ---
def validate_title(data):
    title = data.get("title", "")
    if not isinstance(title, str) or not title.strip():
        return None, "Title is required."
    if len(title.strip()) > 255:
        return None, "Title must be 255 characters or less."
    return title.strip(), None


def validate_project_id(data, user=None):
    project_id = data.get("project_id")
    if project_id is None:
        return None, None
    try:
        project_id = int(project_id)
    except (ValueError, TypeError):
        return None, "Invalid project ID"
    if user:
        from models import Project

        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return None, "Invalid project ID"
    return project_id, None


def validate_parent_id(data, user):
    parent_id = data.get("parent_id")
    if parent_id is None:
        return None, None
    try:
        parent_id = int(parent_id)
    except (ValueError, TypeError):
        return None, "Invalid parent task ID"
    from models import Task

    task = Task.query.filter_by(id=parent_id, user_id=user.id).first()
    if not task:
        return None, "Invalid parent task ID"
    return parent_id, None


from datetime import datetime


def parse_date(date_str, field_name):
    if not date_str:
        return None, None
    try:
        # Accept ISO 8601 format
        return datetime.fromisoformat(date_str), None
    except Exception:
        return None, f"Invalid {field_name} format"


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


def update_task_title(task, data):
    if "title" in data:
        title = data["title"]
        if not isinstance(title, str) or not title.strip():
            return "Task title is required"
        if len(title.strip()) > 255:
            return "Title must be 255 characters or less."
        task.title = title.strip()
    return None


def update_task_description(task, data):
    if "description" in data:
        desc = data["description"]
        if desc is not None:
            task.description = str(desc).strip()
    return None


def update_task_completed(task, data):
    if "completed" in data:
        task.completed = bool(data["completed"])
    return None


def update_task_priority(task, data):
    if "priority" in data:
        try:
            task.priority = int(data["priority"])
        except (ValueError, TypeError):
            return "Invalid priority value."
    return None


def update_task_project(task, data, user):
    if "project_id" in data:
        project_id = data["project_id"]
        if project_id is None:
            task.project_id = None
            return None
        try:
            project_id = int(project_id)
        except (ValueError, TypeError):
            return "Invalid project ID"
        from models import Project

        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return "Invalid project ID"
        task.project_id = project_id
    return None


def update_task_due_date(task, data):
    if "due_date" in data:
        due_date_str = data["due_date"]
        if due_date_str:
            try:
                task.due_date = datetime.fromisoformat(due_date_str)
            except Exception:
                return "Invalid due_date format"
        else:
            task.due_date = None
    return None


def update_task_start_date(task, data):
    if "start_date" in data:
        start_date_str = data["start_date"]
        if start_date_str:
            try:
                task.start_date = datetime.fromisoformat(start_date_str)
            except Exception:
                return "Invalid start_date format"
        else:
            task.start_date = None
    return None


def update_task_recurrence(task, data):
    if "recurrence" in data:
        task.recurrence = data["recurrence"]
    return None


def _validate_dates(start_date, due_date):
    if start_date and due_date and start_date > due_date:
        return "start_date cannot be after due_date"
    return None


import re
import secrets
from functools import wraps

from flask import jsonify, request, session
from models import User, db


def error_response(message, code):
    from models import logger

    logger.error(message)
    if code >= 500:
        return (
            jsonify(
                {"error": "An internal server error occurred. Please try again later."}
            ),
            code,
        )
    # For 400-level errors, return the specific message
    return jsonify({"error": message}), code


def get_current_user():
    from models import logger

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


def login_required(f):
    from models import logger

    @wraps(f)
    def decorated_function(*args, **kwargs):
        logger.debug("Checking if user is logged in.")
        user = get_current_user()
        if not user:
            logger.warning("Unauthorized access attempt.")
            return error_response("Authentication required", 401)
        return f(*args, **kwargs)

    return decorated_function


def is_strong_password(password):
    from models import logger

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


def generate_csrf_token():
    from models import logger

    existing_token = request.cookies.get("_csrf_token")
    if existing_token and re.fullmatch(r"[a-f0-9]{32}", existing_token):
        logger.debug("Using existing CSRF token from cookie.")
        return existing_token
    logger.info("Generating new CSRF token.")
    return secrets.token_hex(16)


def regenerate_session():
    session.clear()
    session.modified = True
