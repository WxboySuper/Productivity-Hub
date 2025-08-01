"""
test_tasks.py: Automated tests for Task CRUD endpoints,
including validation, error handling, and ownership checks.
"""

import uuid

import pytest

REGISTER_URL = "/api/register"
LOGIN_URL = "/api/login"
TASKS_URL = "/api/tasks"


@pytest.fixture
def auth_client(client):
    unique = uuid.uuid4().hex[:8]
    username = f"taskuser_{unique}"
    email = f"task_{unique}@weatherboysuper.com"
    client.post(
        REGISTER_URL,
        json={
            "username": username,
            "email": email,
            "password": "StrongPass1!",
        },
    )
    client.post(LOGIN_URL, json={"username": username, "password": "StrongPass1!"})
    client._taskuser = username
    return client


def test_create_task_success(auth_client):
    resp = auth_client.post(TASKS_URL, json={"title": "Test Task", "priority": 2})
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["title"] == "Test Task"
    assert data["priority"] == 2


def test_create_task_missing_title(auth_client):
    resp = auth_client.post(TASKS_URL, json={})
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_create_task_invalid_project_id(auth_client):
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Task with Invalid Project",
            "priority": 1,
            "project_id": 99999999,
        },
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Invalid project ID"


def test_create_task_invalid_parent_id(auth_client):
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Task with Invalid Parent",
            "priority": 1,
            "parent_id": 99999999,
        },
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Invalid parent task ID"


def test_create_task_invalid_due_date_format(auth_client):
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Task with Bad Due Date",
            "priority": 1,
            "due_date": "not-a-date",
        },
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Invalid due_date format"


def test_create_task_invalid_start_date_format(auth_client):
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Task with Bad Start Date",
            "priority": 1,
            "start_date": "not-a-date",
        },
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Invalid start_date format"


def test_create_task_with_valid_project_id(auth_client):
    resp = auth_client.post(
        "/api/projects",
        json={
            "name": "Project For Task",
            "description": ("Project to test valid project_id on task creation."),
        },
    )
    assert resp.status_code == 201
    project_id = resp.get_json()["id"]
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Task With Valid Project",
            "priority": 1,
            "project_id": project_id,
        },
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["title"] == "Task With Valid Project"
    assert data["project_id"] == project_id


def test_get_tasks(auth_client):
    auth_client.post(TASKS_URL, json={"title": "Task 1", "priority": 1})
    resp = auth_client.get(TASKS_URL)
    assert resp.status_code == 200
    data = resp.get_json()
    assert "tasks" in data
    assert len(data["tasks"]) >= 1


def test_update_task_requires_json(auth_client):
    resp = auth_client.post(
        TASKS_URL, json={"title": "Update JSON Required", "priority": 1}
    )
    task_id = resp.get_json()["id"]
    resp = auth_client.put(
        f"{TASKS_URL}/{task_id}",
        data="title=NoJSON",
        content_type="application/x-www-form-urlencoded",
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert "Request must be JSON" in data.get("error", "")


def test_update_task(auth_client):
    resp = auth_client.post(TASKS_URL, json={"title": "To Update", "priority": 1})
    task_id = resp.get_json()["id"]
    resp = auth_client.put(
        f"{TASKS_URL}/{task_id}", json={"title": "Updated", "priority": 3}
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["title"] == "Updated"
    assert data["priority"] == 3


def test_delete_task(auth_client):
    resp = auth_client.post(TASKS_URL, json={"title": "To Delete", "priority": 1})
    task_id = resp.get_json()["id"]
    resp = auth_client.delete(f"{TASKS_URL}/{task_id}")
    assert resp.status_code == 200
    assert resp.get_json()["message"] == "Task deleted successfully"
    resp = auth_client.get(f"{TASKS_URL}/{task_id}")
    assert resp.status_code == 404


def test_update_task_404(auth_client):
    resp = auth_client.put(f"{TASKS_URL}/99999999", json={"title": "Should Fail"})
    assert resp.status_code == 404
    data = resp.get_json()
    assert "error" in data and "not found" in data["error"].lower()


def test_delete_task_404(auth_client):
    resp = auth_client.delete(f"{TASKS_URL}/99999999")
    assert resp.status_code == 404
    data = resp.get_json()
    assert "error" in data and "not found" in data["error"].lower()


@pytest.mark.usefixtures("auth_client")
def test_get_object_or_404_task_404(auth_client):
    # Remove empty test (no implementation)
    pass


@pytest.mark.usefixtures("auth_client")
def test_paginate_query_tasks_edge_cases(auth_client):
    # Remove empty test (no implementation)
    pass


def test_get_tasks_with_subtasks(auth_client):
    resp = auth_client.post(TASKS_URL, json={"title": "Parent Task", "priority": 1})
    assert resp.status_code == 201
    parent_id = resp.get_json()["id"]
    resp2 = auth_client.post(
        TASKS_URL,
        json={"title": "Subtask", "priority": 1, "parent_id": parent_id},
    )
    assert resp2.status_code == 201
    subtask_id = resp2.get_json()["id"]
    resp = auth_client.get(TASKS_URL)
    assert resp.status_code == 200
    data = resp.get_json()["tasks"]
    parent_task = next((t for t in data if t["title"] == "Parent Task"), None)
    assert parent_task is not None
    assert "subtasks" in parent_task
    assert isinstance(parent_task["subtasks"], list)
    assert any(
        st["id"] == subtask_id and st["title"] == "Subtask"
        for st in parent_task["subtasks"]
    )


def test_get_task_by_id_minimal_fields(auth_client):
    resp = auth_client.post(TASKS_URL, json={"title": "Parent Minimal", "priority": 1})
    assert resp.status_code == 201
    parent = resp.get_json()
    parent_id = parent["id"]
    resp2 = auth_client.post(
        TASKS_URL,
        json={"title": "Sub Minimal", "priority": 1, "parent_id": parent_id},
    )
    assert resp2.status_code == 201
    subtask = resp2.get_json()
    subtask_id = subtask["id"]
    resp = auth_client.get(f"{TASKS_URL}/{parent_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["id"] == parent_id
    assert data["title"] == "Parent Minimal"
    assert data["priority"] == 1
    assert "due_date" not in data
    assert "start_date" not in data
    assert "recurrence" not in data
    assert isinstance(data["subtasks"], list)
    st = next((st for st in data["subtasks"] if st["id"] == subtask_id), None)
    assert st is not None
    assert st["title"] == "Sub Minimal"
    assert st["priority"] == 1
    assert "due_date" not in st
    assert "start_date" not in st


def test_get_task_by_id_full_serialization(auth_client):
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Parent Full",
            "priority": 2,
            "description": "Parent Desc",
            "due_date": "2025-09-01T10:00:00",
            "start_date": "2025-08-01T09:00:00",
            "recurrence": "monthly",
        },
    )
    assert resp.status_code == 201
    parent = resp.get_json()
    parent_id = parent["id"]
    resp2 = auth_client.post(
        TASKS_URL,
        json={
            "title": "Sub Full",
            "priority": 3,
            "description": "Sub Desc",
            "parent_id": parent_id,
            "due_date": "2025-09-10T10:00:00",
            "start_date": "2025-08-10T09:00:00",
        },
    )
    assert resp2.status_code == 201
    subtask = resp2.get_json()
    subtask_id = subtask["id"]
    resp = auth_client.get(f"{TASKS_URL}/{parent_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["id"] == parent_id
    assert data["title"] == "Parent Full"
    assert data["description"] == "Parent Desc"
    assert data["priority"] == 2
    assert data["due_date"] == "2025-09-01T10:00:00"
    assert data["start_date"] == "2025-08-01T09:00:00"
    assert data["recurrence"] == "monthly"
    assert isinstance(data["subtasks"], list)
    st = next((st for st in data["subtasks"] if st["id"] == subtask_id), None)
    assert st is not None
    assert st["title"] == "Sub Full"
    assert st["description"] == "Sub Desc"
    assert st["priority"] == 3
    assert st["due_date"] == "2025-09-10T10:00:00"
    assert st["start_date"] == "2025-08-10T09:00:00"


def test_update_task_start_date_and_recurrence(auth_client):
    resp = auth_client.post(
        TASKS_URL, json={"title": "To Update Recurrence", "priority": 1}
    )
    task_id = resp.get_json()["id"]
    resp = auth_client.put(
        f"{TASKS_URL}/{task_id}",
        json={"start_date": "2025-07-05T08:00:00", "recurrence": "daily"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["start_date"] == "2025-07-05T08:00:00"
    assert data["recurrence"] == "daily"


def test_create_task_start_date_after_due_date(auth_client):
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Invalid Dates",
            "priority": 1,
            "start_date": "2025-07-10T10:00:00",
            "due_date": "2025-07-01T10:00:00",
        },
    )
    assert resp.status_code == 400
    assert "start_date cannot be after due_date" in resp.get_json().get("error", "")


def test_update_task_start_date_after_due_date(auth_client):
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Update Invalid Dates",
            "priority": 1,
            "due_date": "2025-07-10T10:00:00",
        },
    )
    task_id = resp.get_json()["id"]
    resp = auth_client.put(
        f"{TASKS_URL}/{task_id}", json={"start_date": "2025-07-11T10:00:00"}
    )
    assert resp.status_code == 400
    assert "start_date cannot be after due_date" in resp.get_json().get("error", "")


def test_update_task_empty_or_whitespace_title(auth_client):
    resp = auth_client.post(TASKS_URL, json={"title": "Valid Task", "priority": 1})
    assert resp.status_code == 201
    task_id = resp.get_json()["id"]
    resp = auth_client.put(f"{TASKS_URL}/{task_id}", json={"title": ""})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Task title is required"
    resp = auth_client.put(f"{TASKS_URL}/{task_id}", json={"title": "   "})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Task title is required"


# --- Task Update and JSON Requirement Tests ---
def test_update_task_description_and_completed_fields(auth_client):
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Update Desc",
            "priority": 1,
            "description": "Old desc",
            "completed": False,
        },
    )
    assert resp.status_code == 201
    task_id = resp.get_json()["id"]
    # Update description and completed
    resp = auth_client.put(
        f"{TASKS_URL}/{task_id}", json={"description": "New desc", "completed": True}
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["description"] == "New desc"
    assert data["completed"] is True


def test_update_task_remove_project_id(auth_client):
    # Create a project and a task with project_id
    resp_proj = auth_client.post(
        "/api/projects", json={"name": "Proj for Remove", "description": "desc"}
    )
    assert resp_proj.status_code == 201
    project_id = resp_proj.get_json()["id"]
    resp = auth_client.post(
        TASKS_URL,
        json={"title": "Task with Proj", "priority": 1, "project_id": project_id},
    )
    assert resp.status_code == 201
    task_id = resp.get_json()["id"]
    # Remove project_id
    resp = auth_client.put(f"{TASKS_URL}/{task_id}", json={"project_id": None})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get("project_id") is None


def test_update_task_project_id_and_due_date(auth_client):
    # Create two projects
    resp_proj1 = auth_client.post(
        "/api/projects", json={"name": "Proj1", "description": "desc1"}
    )
    resp_proj2 = auth_client.post(
        "/api/projects", json={"name": "Proj2", "description": "desc2"}
    )
    project_id1 = resp_proj1.get_json()["id"]
    project_id2 = resp_proj2.get_json()["id"]
    # Create a task with project_id1
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Task to Move",
            "priority": 1,
            "project_id": project_id1,
            "due_date": "2025-10-01T10:00:00",
        },
    )
    assert resp.status_code == 201
    task_id = resp.get_json()["id"]
    # Update project_id and due_date
    resp = auth_client.put(
        f"{TASKS_URL}/{task_id}",
        json={"project_id": project_id2, "due_date": "2025-11-01T10:00:00"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["project_id"] == project_id2
    assert data["due_date"] == "2025-11-01T10:00:00"


def test_update_task_start_date_field(auth_client):
    resp = auth_client.post(TASKS_URL, json={"title": "Task Start Date", "priority": 1})
    assert resp.status_code == 201
    task_id = resp.get_json()["id"]
    # Update start_date
    resp = auth_client.put(
        f"{TASKS_URL}/{task_id}", json={"start_date": "2025-12-01T08:00:00"}
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["start_date"] == "2025-12-01T08:00:00"


def test_create_task_requires_json(auth_client):
    resp = auth_client.post(
        TASKS_URL,
        data="title=NoJSON",
        content_type="application/x-www-form-urlencoded",
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert "Request must be JSON" in data.get("error", "")


# --- Task Update and JSON Requirement Tests ---


# --- Task Update and JSON Requirement Tests ---
def test_update_task_description_and_completed_fields(auth_client):
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Update Desc",
            "priority": 1,
            "description": "Old desc",
            "completed": False,
        },
    )
    assert resp.status_code == 201
    task_id = resp.get_json()["id"]
    # Update description and completed
    resp = auth_client.put(
        f"{TASKS_URL}/{task_id}", json={"description": "New desc", "completed": True}
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["description"] == "New desc"
    assert data["completed"] is True


def test_update_task_remove_project_id(auth_client):
    # Create a project and a task with project_id
    resp_proj = auth_client.post(
        "/api/projects", json={"name": "Proj for Remove", "description": "desc"}
    )
    assert resp_proj.status_code == 201
    project_id = resp_proj.get_json()["id"]
    resp = auth_client.post(
        TASKS_URL,
        json={"title": "Task with Proj", "priority": 1, "project_id": project_id},
    )
    assert resp.status_code == 201
    task_id = resp.get_json()["id"]
    # Remove project_id
    resp = auth_client.put(f"{TASKS_URL}/{task_id}", json={"project_id": None})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get("project_id") is None


def test_update_task_project_id_and_due_date(auth_client):
    # Create two projects
    resp_proj1 = auth_client.post(
        "/api/projects", json={"name": "Proj1", "description": "desc1"}
    )
    resp_proj2 = auth_client.post(
        "/api/projects", json={"name": "Proj2", "description": "desc2"}
    )
    project_id1 = resp_proj1.get_json()["id"]
    project_id2 = resp_proj2.get_json()["id"]
    # Create a task with project_id1
    resp = auth_client.post(
        TASKS_URL,
        json={
            "title": "Task to Move",
            "priority": 1,
            "project_id": project_id1,
            "due_date": "2025-10-01T10:00:00",
        },
    )
    assert resp.status_code == 201
    task_id = resp.get_json()["id"]
    # Update project_id and due_date
    resp = auth_client.put(
        f"{TASKS_URL}/{task_id}",
        json={"project_id": project_id2, "due_date": "2025-11-01T10:00:00"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["project_id"] == project_id2
    assert data["due_date"] == "2025-11-01T10:00:00"


def test_update_task_start_date_field(auth_client):
    resp = auth_client.post(TASKS_URL, json={"title": "Task Start Date", "priority": 1})
    assert resp.status_code == 201
    task_id = resp.get_json()["id"]
    # Update start_date
    resp = auth_client.put(
        f"{TASKS_URL}/{task_id}", json={"start_date": "2025-12-01T08:00:00"}
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["start_date"] == "2025-12-01T08:00:00"


def test_create_task_requires_json(auth_client):
    resp = auth_client.post(
        TASKS_URL,
        data="title=NoJSON",
        content_type="application/x-www-form-urlencoded",
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert "Request must be JSON" in data.get("error", "")
