"""
Project helper functions for Productivity Hub backend.
"""


def serialize_project(project):
    """Serialize a Project SQLAlchemy object to a dict for API response."""
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
    }


def validate_project_name(data):
    """Validate and extract project name from request data."""
    name = data.get("name")
    if not name or not name.strip():
        return None, "Project name is required"
    return name.strip(), None
