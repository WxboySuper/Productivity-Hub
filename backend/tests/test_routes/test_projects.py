"""
test_projects.py: Automated tests for Project CRUD endpoints,
including validation, error handling, and ownership checks.
"""

import secrets

from models.user import User

REGISTER_URL = "/api/register"
LOGIN_URL = "/api/login"
PROJECTS_URL = "/api/projects"


# --- Helper to register and login a user, returns client and user_id ---
def register_and_login(client, username=None, email=None, password="StrongPass1!"):
    unique = secrets.token_hex(4)
    if not username:
        username = f"projuser_{unique}"
    if not email:
        email = f"proj_{unique}@weatherboysuper.com"
    client.post(
        REGISTER_URL, json={"username": username, "email": email, "password": password}
    )
    resp = client.post(LOGIN_URL, json={"username": username, "password": password})
    assert resp.status_code == 200
    user = User.query.filter_by(username=username).first()
    return user


# --- Project CRUD Tests ---
def test_create_project_success(client):
    register_and_login(client)
    resp = client.post(
        PROJECTS_URL, json={"name": "Test Project", "description": "A test project."}
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["success"] is True
    assert "project_id" in data


def test_create_project_missing_name(client):
    register_and_login(client)
    resp = client.post(PROJECTS_URL, json={"description": "No name."})
    assert resp.status_code == 400
    assert "name" in resp.get_json().get("error", "")


def test_get_projects_list(client):
    register_and_login(client)
    # Create two projects
    client.post(PROJECTS_URL, json={"name": "Proj1", "description": "Desc1"})
    client.post(PROJECTS_URL, json={"name": "Proj2", "description": "Desc2"})
    resp = client.get(PROJECTS_URL)
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) >= 2
    names = [proj["name"] for proj in data]
    assert "Proj1" in names and "Proj2" in names


def test_get_project_by_id(client):
    register_and_login(client)
    resp = client.post(PROJECTS_URL, json={"name": "SingleProj", "description": "Desc"})
    project_id = resp.get_json()["project_id"]
    resp = client.get(f"{PROJECTS_URL}/{project_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["name"] == "SingleProj"


def test_update_project_success(client):
    register_and_login(client)
    resp = client.post(PROJECTS_URL, json={"name": "ToUpdate", "description": "Desc"})
    project_id = resp.get_json()["project_id"]
    resp = client.put(
        f"{PROJECTS_URL}/{project_id}",
        json={"name": "UpdatedName", "description": "UpdatedDesc"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    # Fetch and check
    resp = client.get(f"{PROJECTS_URL}/{project_id}")
    assert resp.get_json()["name"] == "UpdatedName"


def test_update_project_not_owner(client):
    # User1 creates project
    register_and_login(
        client, username="owner1", email="owner1@weatherboysuper.com"
    )
    resp = client.post(PROJECTS_URL, json={"name": "OwnerProj", "description": "Desc"})
    project_id = resp.get_json()["project_id"]
    # Switch to user2 by logging in as user2 (not a true logout)
    register_and_login(
        client, username="owner2", email="owner2@weatherboysuper.com"
    )
    resp = client.put(f"{PROJECTS_URL}/{project_id}", json={"name": "HackerProj"})
    assert resp.status_code == 403
    assert "Not authorized" in resp.get_json().get("error", "")


def test_delete_project_success(client):
    register_and_login(client)
    resp = client.post(PROJECTS_URL, json={"name": "ToDelete", "description": "Desc"})
    project_id = resp.get_json()["project_id"]
    resp = client.delete(f"{PROJECTS_URL}/{project_id}")
    assert resp.status_code == 200
    assert resp.get_json()["success"] is True
    # Confirm deletion
    resp = client.get(f"{PROJECTS_URL}/{project_id}")
    assert resp.status_code == 404


def test_delete_project_not_owner(client):
    # User1 creates project
    register_and_login(
        client, username="owner3", email="owner3@weatherboysuper.com"
    )
    resp = client.post(PROJECTS_URL, json={"name": "OwnerProj2", "description": "Desc"})
    project_id = resp.get_json()["project_id"]
    # Switch to user4 by logging in as user4 (not a true logout)
    register_and_login(
        client, username="owner4", email="owner4@weatherboysuper.com"
    )
    resp = client.delete(f"{PROJECTS_URL}/{project_id}")
    assert resp.status_code == 403
    assert "Not authorized" in resp.get_json().get("error", "")


def test_create_project_unauthenticated(client):
    resp = client.post(PROJECTS_URL, json={"name": "NoAuth", "description": "Desc"})
    assert resp.status_code == 401
    assert "Not authenticated" in resp.get_json().get("error", "")


def test_get_projects_unauthenticated(client):
    resp = client.get(PROJECTS_URL)
    assert resp.status_code == 401
    assert "Not authenticated" in resp.get_json().get("error", "")
