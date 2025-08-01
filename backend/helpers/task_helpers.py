from datetime import datetime


def validate_title(data):
    title = data.get("title", "")
    if not isinstance(title, str) or not title.strip():
        return None, "Title is required."
    if len(title.strip()) > 255:
        return None, "Title must be 255 characters or less."
    return title.strip(), None


def parse_date(date_str, field_name):
    if not date_str:
        return None, None
    try:
        return datetime.fromisoformat(date_str), None
    except Exception:
        return None, f"Invalid {field_name} format"


def _extract_task_fields(data, user):
    from helpers.user_helpers import validate_parent_id, validate_project_id

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
        from models.project import Project

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
