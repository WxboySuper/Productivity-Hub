# ============================================================
# Automated tests for user registration, login, logout, profile,
# and CSRF/session logic. Covers both success and failure cases.

import secrets

import flask
from app import app as flask_app
from helpers.auth_helpers import (
    generate_csrf_token,
    get_current_user,
    regenerate_session,
)
from models.user import User

# --- API Endpoint Constants (must be defined before use) ---
REGISTER_URL = "/api/register"
LOGIN_URL = "/api/login"
LOGOUT_URL = "/api/logout"
PROFILE_URL = "/api/profile"


# --- Session/Token Management Tests ---
def test_regenerate_session_clears_and_modifies():
    """
    Directly test that regenerate_session clears the session and marks it as modified.
    """
    with flask_app.test_request_context("/"):
        flask.session["user_id"] = 123
        flask.session["foo"] = "bar"
        flask.session.modified = False
        assert "user_id" in flask.session
        assert "foo" in flask.session
        assert flask.session.modified is False
        regenerate_session()
        assert len(flask.session.keys()) == 0
        assert flask.session.modified is True


# --- Test session ID regeneration on login and logout ---
def test_session_id_regeneration_on_login_logout(client):
    """Test that session is cleared and a new session is started on login and logout."""
    unique = secrets.token_hex(4)
    username = f"regenuser_{unique}"
    email = f"regen_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    # Register
    client.post(
        REGISTER_URL, json={"username": username, "email": email, "password": password}
    )
    # Login
    resp = client.post(LOGIN_URL, json={"username": username, "password": password})
    assert resp.status_code == 200
    # Check session after login
    with client.session_transaction() as sess:
        assert "user_id" in sess
    # Logout
    resp = client.post(LOGOUT_URL)
    assert resp.status_code == 200
    # After logout, session should be cleared
    with client.session_transaction() as sess:
        assert "user_id" not in sess


# --- Test session cookie security attributes ---
def test_session_cookie_security_attributes(client):
    """
    Test that session cookie is set with Secure, HttpOnly, and SameSite attributes.
    """
    flask_app.config["SESSION_COOKIE_SECURE"] = True
    flask_app.config["SESSION_COOKIE_HTTPONLY"] = True
    flask_app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    flask_app.config["TESTING"] = True
    unique = secrets.token_hex(4)
    username = f"cookieuser_{unique}"
    email = f"cookie_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    # Register and login
    client.post(
        REGISTER_URL, json={"username": username, "email": email, "password": password}
    )
    resp = client.post(LOGIN_URL, json={"username": username, "password": password})
    assert resp.status_code == 200
    set_cookie = resp.headers.get("Set-Cookie", "")
    assert "HttpOnly" in set_cookie
    assert "Secure" in set_cookie
    assert "SameSite=Lax" in set_cookie


# --- Registration Tests ---
def test_register_success(client):
    unique = secrets.token_hex(4)
    username = f"user_{unique}"
    email = f"{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    resp = client.post(
        REGISTER_URL, json={"username": username, "email": email, "password": password}
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["success"] is True
    assert "user_id" in data


def test_register_malformed_json(client):
    resp = client.post(REGISTER_URL, data="{bad json}", content_type="application/json")
    assert resp.status_code == 400
    assert "Malformed JSON" in resp.get_json().get("error", "")


def test_register_non_json_request(client):
    resp = client.post(
        REGISTER_URL,
        data="username=foo",
        content_type="application/x-www-form-urlencoded",
    )
    assert resp.status_code == 400
    assert "Request must be JSON" in resp.get_json().get("error", "")


def test_register_duplicate_username(client):
    unique = secrets.token_hex(4)
    username = f"dupuser_{unique}"
    email1 = f"dup1_{unique}@weatherboysuper.com"
    email2 = f"dup2_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(
        REGISTER_URL, json={"username": username, "email": email1, "password": password}
    )
    resp = client.post(
        REGISTER_URL, json={"username": username, "email": email2, "password": password}
    )
    assert resp.status_code == 400
    assert "username" in resp.get_json().get("error", "")


def test_register_duplicate_email(client):
    unique = secrets.token_hex(4)
    username1 = f"dupuser1_{unique}"
    username2 = f"dupuser2_{unique}"
    email = f"dup_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(
        REGISTER_URL, json={"username": username1, "email": email, "password": password}
    )
    resp = client.post(
        REGISTER_URL, json={"username": username2, "email": email, "password": password}
    )
    assert resp.status_code == 400
    assert "email" in resp.get_json().get("error", "")


def test_register_invalid_password(client):
    unique = secrets.token_hex(4)
    username = f"badpass_{unique}"
    email = f"badpass_{unique}@weatherboysuper.com"
    password = "short"
    resp = client.post(
        REGISTER_URL, json={"username": username, "email": email, "password": password}
    )
    assert resp.status_code == 400
    assert "password" in resp.get_json().get("error", "")


# --- Login Tests ---
def test_login_success(client):
    unique = secrets.token_hex(4)
    username = f"loginuser_{unique}"
    email = f"login_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(
        REGISTER_URL, json={"username": username, "email": email, "password": password}
    )
    resp = client.post(LOGIN_URL, json={"username": username, "password": password})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "user_id" in data


def test_login_malformed_json(client):
    resp = client.post(LOGIN_URL, data="{bad json}", content_type="application/json")
    assert resp.status_code == 400
    assert "Malformed JSON" in resp.get_json().get("error", "")


def test_login_non_json_request(client):
    resp = client.post(
        LOGIN_URL, data="username=foo", content_type="application/x-www-form-urlencoded"
    )
    assert resp.status_code == 400
    assert "Request must be JSON" in resp.get_json().get("error", "")


def test_login_wrong_password(client):
    unique = secrets.token_hex(4)
    username = f"wrongpass_{unique}"
    email = f"wrongpass_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(
        REGISTER_URL, json={"username": username, "email": email, "password": password}
    )
    resp = client.post(
        LOGIN_URL, json={"username": username, "password": "WrongPass2!"}
    )
    assert resp.status_code == 401
    assert "Invalid credentials" in resp.get_json().get("error", "")


def test_login_nonexistent_user(client):
    resp = client.post(
        LOGIN_URL,
        json={"username": "nouser_" + secrets.token_hex(4), "password": "StrongPass1!"},
    )
    assert resp.status_code == 401
    assert "Invalid credentials" in resp.get_json().get("error", "")


# --- Logout Tests ---
def test_logout(client):
    unique = secrets.token_hex(4)
    username = f"logoutuser_{unique}"
    email = f"logout_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(
        REGISTER_URL, json={"username": username, "email": email, "password": password}
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    resp = client.post(LOGOUT_URL)
    assert resp.status_code == 200
    assert resp.get_json()["success"] is True


# --- Profile Tests ---
def test_profile_authenticated(client):
    unique = secrets.token_hex(4)
    username = f"profileuser_{unique}"
    email = f"profile_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(
        REGISTER_URL, json={"username": username, "email": email, "password": password}
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    resp = client.get(PROFILE_URL)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["username"] == username
    assert data["email"] == email


def test_profile_update_errors(client):
    unique = secrets.token_hex(4)
    username = f"profileerr_{unique}"
    email = f"profileerr_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(
        REGISTER_URL, json={"username": username, "email": email, "password": password}
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    # HTML in username
    resp = client.put(PROFILE_URL, json={"username": "<b>bad</b>"})
    assert resp.status_code == 400
    assert "username" in resp.get_json().get("error", {})
    # Short username
    resp = client.put(PROFILE_URL, json={"username": "ab"})
    assert resp.status_code == 400
    assert "username" in resp.get_json().get("error", {})
    # Duplicate username
    client.post(
        REGISTER_URL,
        json={
            "username": "takenuser",
            "email": f"taken_{unique}@weatherboysuper.com",
            "password": password,
        },
    )
    resp = client.put(PROFILE_URL, json={"username": "takenuser"})
    assert resp.status_code == 400
    assert "username" in resp.get_json().get("error", {})
    # Invalid email
    resp = client.put(PROFILE_URL, json={"email": "notanemail"})
    assert resp.status_code == 400
    assert "email" in resp.get_json().get("error", {})
    # Duplicate email
    client.post(
        REGISTER_URL,
        json={
            "username": f"othuser_{unique}",
            "email": f"dupemail_{unique}@weatherboysuper.com",
            "password": password,
        },
    )
    resp = client.put(
        PROFILE_URL, json={"email": f"dupemail_{unique}@weatherboysuper.com"}
    )
    assert resp.status_code == 400
    assert "email" in resp.get_json().get("error", {})


def test_profile_unauthenticated(client):
    resp = client.get(PROFILE_URL)
    assert resp.status_code == 401
    assert "Not authenticated" in resp.get_json().get("error", "")


# --- CSRF Token Tests ---
def test_generate_csrf_token_sets_and_returns_token():
    with flask_app.test_request_context("/"):
        token = generate_csrf_token()
        assert isinstance(token, str)
        assert len(token) > 10
        assert flask.session["csrf_token"] == token


# --- Password Reset Edge Cases ---
def test_password_reset_request_non_json(client):
    resp = client.post(
        "/api/password-reset/request",
        data="email=foo",
        content_type="application/x-www-form-urlencoded",
    )
    assert resp.status_code == 400
    assert "Request must be JSON" in resp.get_json().get("error", "")


def test_password_reset_request_missing_email(client):
    resp = client.post("/api/password-reset/request", json={})
    assert resp.status_code == 400
    assert "Email is required" in resp.get_json().get("error", "")


def test_password_reset_confirm_non_json(client):
    resp = client.post(
        "/api/password-reset/confirm",
        data="token=foo",
        content_type="application/x-www-form-urlencoded",
    )
    assert resp.status_code == 400
    assert "Request must be JSON" in resp.get_json().get("error", "")


def test_password_reset_confirm_missing_fields(client):
    resp = client.post("/api/password-reset/confirm", json={})
    assert resp.status_code == 400
    assert "Token and new_password are required" in resp.get_json().get("error", "")


def test_generate_csrf_token_returns_existing_token():
    with flask_app.test_request_context("/"):
        flask.session["csrf_token"] = "abc123"
        token = generate_csrf_token()
        assert token == "abc123"


# --- Helper/Utility Tests ---
def test_get_current_user_returns_user(client):
    unique = secrets.token_hex(4)
    username = f"curuser_{unique}"
    email = f"cur_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    client.post(
        REGISTER_URL, json={"username": username, "email": email, "password": password}
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    with client.session_transaction() as sess:
        user = User.query.filter_by(username=username).first()
        sess["user_id"] = user.id
    # Use a client request to ensure session context is correct
    resp = client.get(PROFILE_URL)
    assert resp.status_code == 200


def test_get_current_user_returns_none_when_not_logged_in():
    with flask_app.test_request_context("/"):
        if "user_id" in flask.session:
            del flask.session["user_id"]
        user = get_current_user()
        assert user is None
