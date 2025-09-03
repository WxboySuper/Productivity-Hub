from datetime import datetime

from models.task import Task


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
        "blocked_by": [task.id for task in task.blocked_by] if task.blocked_by else [],
        "blocking": [task.id for task in task.blocking] if task.blocking else [],
        "reminder_enabled": task.reminder_enabled,
    }
    if task.due_date:
        d["due_date"] = task.due_date.isoformat()
    if task.start_date:
        d["start_date"] = task.start_date.isoformat()
    if task.recurrence:
        d["recurrence"] = task.recurrence
    if task.reminder_time:
        d["reminder_time"] = task.reminder_time.isoformat()
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
        lambda: update_task_blocked_by(task, data, user),
        lambda: update_task_blocking(task, data, user),
        lambda: update_task_reminder_enabled(task, data),
        lambda: update_task_reminder_time(task, data),
        lambda: update_task_subtasks(task, data, user),
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


def update_task_completed(task, data):
    if "completed" in data:
        task.completed = bool(data["completed"])


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


def update_task_blocked_by(task, data, user):
    """Update the tasks that block this task."""
    if "blocked_by" in data:
        blocked_by_ids = data["blocked_by"]
        if blocked_by_ids is None:
            # Clear all blocking relationships
            task.blocked_by = []
        elif isinstance(blocked_by_ids, list):
            # Validate that all blocking task IDs exist and belong to the user
            blocking_tasks = []
            for task_id in blocked_by_ids:
                if not isinstance(task_id, int):
                    return f"Invalid blocking task ID: {task_id}"
                blocking_task = Task.query.filter_by(
                    id=task_id, user_id=user.id
                ).first()
                if not blocking_task:
                    return f"Blocking task not found: {task_id}"
                if blocking_task.id == task.id:
                    return "Task cannot block itself"
                blocking_tasks.append(blocking_task)
            task.blocked_by = blocking_tasks
        else:
            return "blocked_by must be a list of task IDs"
    return None


def update_task_blocking(task, data, user):
    """Update the tasks that this task blocks."""
    if "blocking" in data:
        blocking_ids = data["blocking"]
        if blocking_ids is None:
            # Clear all blocked relationships
            task.blocking = []
        elif isinstance(blocking_ids, list):
            # Validate that all blocked task IDs exist and belong to the user
            blocked_tasks = []
            for task_id in blocking_ids:
                if not isinstance(task_id, int):
                    return f"Invalid blocked task ID: {task_id}"
                blocked_task = Task.query.filter_by(id=task_id, user_id=user.id).first()
                if not blocked_task:
                    return f"Blocked task not found: {task_id}"
                if blocked_task.id == task.id:
                    return "Task cannot block itself"
                blocked_tasks.append(blocked_task)
            task.blocking = blocked_tasks
        else:
            return "blocking must be a list of task IDs"
    return None


def update_task_reminder_enabled(task, data):
    """Update the reminder enabled flag."""
    if "reminder_enabled" in data:
        reminder_enabled = data["reminder_enabled"]
        if isinstance(reminder_enabled, bool):
            task.reminder_enabled = reminder_enabled
        else:
            return "reminder_enabled must be a boolean"
    return None


def update_task_reminder_time(task, data):
    """Update the reminder time."""
    if "reminder_time" in data:
        reminder_time = data["reminder_time"]
        if reminder_time is None:
            task.reminder_time = None
        elif isinstance(reminder_time, str):
            try:
                task.reminder_time = datetime.fromisoformat(reminder_time)
            except Exception:
                return "Invalid reminder_time format"
        else:
            return "reminder_time must be a valid ISO datetime string"
    return None


def update_task_subtasks(task, data, user):
    """Update subtasks for this task."""
    if "subtasks" in data:
        subtasks_data = data["subtasks"]
        if subtasks_data is None:
            # Clear all subtasks by setting their parent_id to None
            for subtask in task.subtasks:
                subtask.parent_id = None
        elif isinstance(subtasks_data, list):
            # For simplicity, we'll just update existing subtasks
            # Adding/removing subtasks should be done through separate endpoints
            for subtask_data in subtasks_data:
                if not isinstance(subtask_data, dict) or "id" not in subtask_data:
                    continue
                subtask_id = subtask_data["id"]
                subtask = Task.query.filter_by(
                    id=subtask_id, user_id=user.id, parent_id=task.id
                ).first()
                if subtask:
                    # Update subtask fields
                    if "title" in subtask_data:
                        subtask.title = str(subtask_data["title"]).strip()
                    if "completed" in subtask_data:
                        subtask.completed = bool(subtask_data["completed"])
        else:
            return "subtasks must be a list"
    return None


def _validate_dates(start_date, due_date):
    if start_date and due_date and start_date > due_date:
        return "start_date cannot be after due_date"
    return None
