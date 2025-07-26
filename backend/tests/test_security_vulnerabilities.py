"""
Security Vulnerability Tests for Flask Backend
Covers: SQL Injection, XSS, IDOR, Privilege Escalation, Information Leakage
"""
import pytest
import uuid
from app import db, User, Notification, app as flask_app

REGISTER_URL = "/api/register"
LOGIN_URL = "/api/login"
PROFILE_URL = "/api/profile"
PROJECTS_URL = "/api/projects"
TASKS_URL = "/api/tasks"

@pytest.mark.usefixtures("client", "db")
def test_sql_injection_on_login(client):
    """
    Attempt SQL injection via login endpoint.
    Should not authenticate or error with stack trace.
    """
    # Register a valid user
    unique = uuid.uuid4().hex[:8]
    username = f"sqltest_{unique}"
    email = f"sqltest_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(REGISTER_URL, json={"username": username, "email": email, "password": password})
    # Attempt SQL injection in username
    payload = {"username": "' OR '1'='1", "password": "wrongpass"}
    resp = client.post(LOGIN_URL, json=payload)
    assert resp.status_code in (400, 401)
    data = resp.get_json()
    assert "error" in data
    # Should not leak SQL error or stack trace
    assert "sql" not in data["error"].lower()
    assert "trace" not in data["error"].lower()

@pytest.mark.usefixtures("client", "db")
def test_xss_in_profile_update(client):
    """
    Attempt XSS via profile update (username field).
    Should not reflect script tags in response.
    """
    unique = uuid.uuid4().hex[:8]
    username = f"xsstest_{unique}"
    email = f"xsstest_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(REGISTER_URL, json={"username": username, "email": email, "password": password})
    client.post(LOGIN_URL, json={"username": username, "password": password})
    xss_payload = "<script>alert('xss')</script>"
    resp = client.put(PROFILE_URL, json={"username": xss_payload})
    # Should not reflect payload in response
    assert xss_payload not in resp.get_data(as_text=True)
    # Should return error or sanitize
    assert resp.status_code in (400, 422)

@pytest.mark.usefixtures("client", "db")
def test_idor_on_profile_access(client):
    """
    Attempt to access another user's profile (IDOR).
    Should not allow access to another user's data.
    """
    # Register two users
    unique = uuid.uuid4().hex[:8]
    username1 = f"idor1_{unique}"
    email1 = f"idor1_{unique}@weatherboysuper.com"
    username2 = f"idor2_{unique}"
    email2 = f"idor2_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(REGISTER_URL, json={"username": username1, "email": email1, "password": password})
    client.post(REGISTER_URL, json={"username": username2, "email": email2, "password": password})
    # Login as user1
    client.post(LOGIN_URL, json={"username": username1, "password": password})
    # Try to access user2's profile by guessing (should not be possible, but test for endpoint leaks)
    # If you have a /api/users/<id> endpoint, test it here. For now, just check /api/profile returns only user1's data
    resp = client.get(PROFILE_URL)
    data = resp.get_json()
    assert data["username"] == username1
    assert data["email"] == email1

@pytest.mark.usefixtures("client", "db")
def test_privilege_escalation_on_admin_route(client):
    """
    Attempt to access admin route as normal user.
    Should return 403 or 401.
    """
    # Register and login as normal user
    unique = uuid.uuid4().hex[:8]
    username = f"notadmin_{unique}"
    email = f"notadmin_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(REGISTER_URL, json={"username": username, "email": email, "password": password})
    client.post(LOGIN_URL, json={"username": username, "password": password})
    # Try to access admin route (if exists)
    resp = client.get("/api/admin")
    assert resp.status_code in (401, 403, 404)

@pytest.mark.usefixtures("client", "db")
def test_error_message_information_leakage(client):
    """
    Ensure error messages do not leak stack traces or sensitive info.
    """
    # Send malformed JSON to endpoint
    resp = client.post(REGISTER_URL, data="notjson", content_type="application/json")
    data = resp.get_json()
    assert resp.status_code in (400, 422)
    assert "error" in data
    # Should not leak stack trace
    assert "trace" not in data["error"].lower()
    assert "line" not in data["error"].lower()
    assert "file" not in data["error"].lower()
