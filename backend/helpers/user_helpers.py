# User-related helper functions for the backend
from models.project import Project
from models.task import Task

def validate_project_id(data, user=None):
    project_id = data.get("project_id")
    if project_id is None:
        return None, None
    try:
        project_id = int(project_id)
    except (ValueError, TypeError):
        return None, "Invalid project ID"
    if user:
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
    task = Task.query.filter_by(id=parent_id, user_id=user.id).first()
    if not task:
        return None, "Invalid parent task ID"
    return parent_id, None
