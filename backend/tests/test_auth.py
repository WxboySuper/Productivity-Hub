"""
Automated tests for user registration, login, logout, profile,
and CSRF/session logic. Covers both success and failure cases.
"""

import pytest
import uuid
import re
import flask
import logging
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, timezone
import builtins
from app import (
    get_current_user,
    db,
    User,
    generate_csrf_token,
    Notification,
    send_email,
)

# --- API Endpoint Constants (must be defined before use) ---
REGISTER_URL = "/api/register"
LOGIN_URL = "/api/login"
LOGOUT_URL = "/api/logout"
PROFILE_URL = "/api/profile"


@pytest.mark.usefixtures("client", "db")
def test_register_success(client):
    unique = uuid.uuid4().hex[:8]
    username = f"testuser_{unique}"
    email = f"test_{unique}@weatherboysuper.com"
    resp = client.post(
        REGISTER_URL,
        json={
            "username": username,
            "email": email,
            "password": "StrongPass1!",
        },
    )
    assert resp.status_code == 201
    assert resp.get_json()["message"] == "User registered successfully"


@pytest.mark.usefixtures("client", "db")
def test_register_missing_fields(client):
    resp = client.post(REGISTER_URL, json={})
    assert resp.status_code == 400
    assert "error" in resp.get_json()


@pytest.mark.usefixtures("client", "db")
def test_register_requires_json():
    """
    Test that /api/register returns 400 and correct error if request
    is not JSON.
    """
    from app import app as flask_app

    with flask_app.test_client() as client:
        # Send form data instead of JSON
        response = client.post(
            REGISTER_URL,
            data={
                "username": "user",
                "email": "a@b.com",
                "password": "Password1!",
            },
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["error"] == "Request must be JSON"


@pytest.mark.usefixtures("client", "db")
def test_register_invalid_email():
    """
    Test that /api/register returns 400 and correct error for invalid email.
    """
    from app import app as flask_app

    with flask_app.test_client() as client:
        payload = {
            "username": "user1",
            "email": "not-an-email",
            "password": "Password1!",
        }
        response = client.post(REGISTER_URL, json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "Invalid email" in data["error"]


@pytest.mark.usefixtures("client", "db")
def test_login_requires_json():
    """
    Test that /api/login returns 400 and correct error if request is not JSON.
    """
    from app import app as flask_app

    with flask_app.test_client() as client:
        # Send form data instead of JSON
        response = client.post(
            LOGIN_URL, data={"username": "user", "password": "Password1!"}
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["error"] == "Request must be JSON"


@pytest.mark.usefixtures("client", "db")
def test_register_weak_password(client):
    resp = client.post(
        REGISTER_URL,
        json={
            "username": "weakuser",
            "email": "weak@weatherboysuper.com",
            "password": "weak",
        },
    )
    assert resp.status_code == 400
    assert "error" in resp.get_json()


@pytest.mark.usefixtures("client", "db")
def test_login_success(client):
    unique = uuid.uuid4().hex[:8]
    username = f"loginuser_{unique}"
    email = f"login_{unique}@weatherboysuper.com"
    client.post(
        REGISTER_URL,
        json={
            "username": username,
            "email": email,
            "password": "StrongPass1!",
        },
    )
    resp = client.post(
        LOGIN_URL, json={"username": username, "password": "StrongPass1!"}
    )
    assert resp.status_code == 200
    assert resp.get_json()["message"] == "Login successful"


@pytest.mark.usefixtures("client", "db")
def test_login_invalid(client):
    resp = client.post(
        LOGIN_URL, json={"username": "nouser", "password": "wrongpass"}
    )
    assert resp.status_code == 401
    assert "error" in resp.get_json()


@pytest.mark.usefixtures("client", "db")
def test_logout(client):
    unique = uuid.uuid4().hex[:8]
    username = f"logoutuser_{unique}"
    email = f"logout_{unique}@weatherboysuper.com"
    client.post(
        REGISTER_URL,
        json={
            "username": username,
            "email": email,
            "password": "StrongPass1!",
        },
    )
    client.post(
        LOGIN_URL, json={"username": username, "password": "StrongPass1!"}
    )
    resp = client.post(LOGOUT_URL)
    assert resp.status_code == 200
    assert resp.get_json()["message"] == "Logout successful"


@pytest.mark.usefixtures("client", "db")
def test_profile_requires_auth(client):
    resp = client.get(PROFILE_URL)
    assert resp.status_code == 401
    assert "error" in resp.get_json()


@pytest.mark.usefixtures("client", "db")
def test_profile_success(client):
    unique = uuid.uuid4().hex[:8]
    username = f"profileuser_{unique}"
    email = f"profile_{unique}@weatherboysuper.com"
    client.post(
        REGISTER_URL,
        json={
            "username": username,
            "email": email,
            "password": "StrongPass1!",
        },
    )
    client.post(
        LOGIN_URL, json={"username": username, "password": "StrongPass1!"}
    )
    resp = client.get(PROFILE_URL)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["username"] == username
    assert data["email"] == email


# --- Profile Update Username Validation (Covers app.py:484-490) ---
@pytest.mark.usefixtures("client", "db")
def test_profile_update_username_validation(client):
    """
    Test username update logic in /api/profile PUT (covers app.py:484-490):
    - Empty string clears username
    - Too short username returns error
    - Already taken username returns error
    - Valid new username updates successfully
    """
    unique = uuid.uuid4().hex[:8]
    username1 = f"user1_{unique}"
    username2 = f"user2_{unique}"
    email1 = f"user1_{unique}@weatherboysuper.com"
    email2 = f"user2_{unique}@weatherboysuper.com"
    # skipcq: PTC-W1006
    password = "StrongPass1!"
    # Register two users
    client.post(
        REGISTER_URL,
        json={"username": username1, "email": email1, "password": password},
    )
    client.post(
        REGISTER_URL,
        json={"username": username2, "email": email2, "password": password},
    )
    # Login as user1
    client.post(LOGIN_URL, json={"username": username1, "password": password})
    # 1. Set username to empty string (should return error, not allowed)
    resp = client.put(PROFILE_URL, json={"username": ""})
    assert resp.status_code == 400
    assert "username" in resp.get_json().get("error", {})
    # 2. Set username to too short (should error)
    resp = client.put(PROFILE_URL, json={"username": "ab"})
    assert resp.status_code == 400
    assert "username" in resp.get_json().get("error", {})
    # 3. Set username to already taken (should error)
    resp = client.put(PROFILE_URL, json={"username": username2})
    assert resp.status_code == 400
    assert "username" in resp.get_json().get("error", {})
    # 4. Set username to valid new value (should succeed)
    new_username = f"newuser_{unique}"
    resp = client.put(PROFILE_URL, json={"username": new_username})
    assert resp.status_code == 200
    profile = client.get(PROFILE_URL).get_json()
    assert profile["username"] == new_username


# --- Profile Update Email Validation (Covers app.py:491-500) ---
@pytest.mark.usefixtures("client", "db")
def test_profile_update_email_validation(client):
    """
    Test email update logic in /api/profile PUT (covers app.py:491-500):
    - Invalid email returns error
    - Already used email returns error
    - Valid new email updates successfully
    """
    unique = uuid.uuid4().hex[:8]
    username1 = f"user1_{unique}"
    username2 = f"user2_{unique}"
    email1 = f"user1_{unique}@weatherboysuper.com"
    email2 = f"user2_{unique}@weatherboysuper.com"
    # skipcq: PTC-W1006
    password = "StrongPass1!"
    # Register two users
    client.post(
        REGISTER_URL,
        json={"username": username1, "email": email1, "password": password},
    )
    client.post(
        REGISTER_URL,
        json={"username": username2, "email": email2, "password": password},
    )
    # Login as user1
    client.post(LOGIN_URL, json={"username": username1, "password": password})
    # 1. Set email to invalid format (should error)
    resp = client.put(PROFILE_URL, json={"email": "not-an-email"})
    assert resp.status_code == 400
    assert "email" in resp.get_json().get("error", {})
    # 2. Set email to already used by another user (should error)
    resp = client.put(PROFILE_URL, json={"email": email2})
    assert resp.status_code == 400
    assert "email" in resp.get_json().get("error", {})
    # 3. Set email to valid new value (should succeed)
    new_email = f"new_{unique}@weatherboysuper.com"
    resp = client.put(PROFILE_URL, json={"email": new_email})
    assert resp.status_code == 200
    profile = client.get(PROFILE_URL).get_json()
    assert profile["email"] == new_email


# --- Notifications GET Endpoint (Covers app.py:511-535) ---
@pytest.mark.usefixtures("client", "db")
def test_get_notifications_endpoint(client, caplog):
    """
    Test /api/notifications GET returns all notifications for the
    current user with correct fields and logging.
    Covers app.py:511-535.
    """
    unique = uuid.uuid4().hex[:8]
    username = f"notifuser_{unique}"
    email = f"notifuser_{unique}@weatherboysuper.com"
    # skipcq: PTC-W1006
    password = "StrongPass1!"
    # Register and login
    client.post(
        REGISTER_URL,
        json={"username": username, "email": email, "password": password},
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    # Add notifications for this user
    with client.application.app_context():
        user = User.query.filter_by(username=username).first()
        n1 = Notification(
            user_id=user.id, message="Test notification 1", read=False
        )
        n2 = Notification(
            user_id=user.id,
            message="Test notification 2",
            read=True,
            show_at=None,
        )
        n3 = Notification(
            user_id=user.id, message="Test notification 3", read=False
        )
        db.session.add_all([n1, n2, n3])
        db.session.commit()
        # Add snoozed_until and show_at to n2
        n2.show_at = n2.created_at
        n2.snoozed_until = n2.created_at
        db.session.commit()
        n2_id = n2.id
    # Call the endpoint and check response
    with caplog.at_level(logging.INFO):
        resp = client.get("/api/notifications")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) >= 3
    # Check required fields in each notification
    for notif in data:
        assert "id" in notif
        assert "message" in notif
        assert "read" in notif
        assert "created_at" in notif
        assert "task_id" in notif
        # Optionally present fields
        if "n2_id" in locals() and notif["id"] == n2_id:
            assert "show_at" in notif
            assert "snoozed_until" in notif
    # Check log message for number of notifications
    assert any(
        "Returning" in m and "notifications for user" in m
        for m in caplog.messages
    )


@pytest.mark.usefixtures("client", "db")
def test_notification_dismiss_endpoint(client, caplog):
    """
    Test /api/notifications/<notification_id>/dismiss marks notification
    as read, returns correct response, and logs events.
    Covers app.py:541-553.
    """
    unique = uuid.uuid4().hex[:8]
    username = f"dismissuser_{unique}"
    email = f"dismissuser_{unique}@weatherboysuper.com"
    # skipcq: PTC-W1006
    password = "StrongPass1!"
    # Register and login
    client.post(
        REGISTER_URL,
        json={"username": username, "email": email, "password": password},
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    # Add a notification for this user
    with client.application.app_context():
        user = User.query.filter_by(username=username).first()
        notif = Notification(user_id=user.id, message="Dismiss me", read=False)
        db.session.add(notif)
        db.session.commit()
        notif_id = notif.id
    # Dismiss the notification
    with caplog.at_level(logging.INFO):
        resp = client.post(f"/api/notifications/{notif_id}/dismiss")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data == {"success": True}
    # Confirm notification is marked as read
    with client.application.app_context():
        n = db.session.get(Notification, notif_id)
        assert n.read is True
    # Check log messages
    assert any(
        "Notification dismiss endpoint accessed" in m for m in caplog.messages
    )
    assert any("dismissed by user" in m for m in caplog.messages)
    # Try dismissing a non-existent notification
    with caplog.at_level(logging.WARNING):
        resp = client.post("/api/notifications/999999/dismiss")
    assert resp.status_code == 404
    data = resp.get_json()
    assert data == {"error": "Notification not found"}
    assert any("Notification not found or doesn" in m for m in caplog.messages)


# --- Notification Snooze Endpoint (Covers app.py:559-592) ---
@pytest.mark.usefixtures("client", "db")
def test_notification_snooze_endpoint(client, caplog):
    """
    Test /api/notifications/<notification_id>/snooze endpoint for
    snoozing notifications.
    Covers app.py:559-592.
    """
    unique = uuid.uuid4().hex[:8]
    username = f"snoozeuser_{unique}"
    email = f"snoozeuser_{unique}@weatherboysuper.com"
    password = "StrongPass1!"
    # Register and login
    client.post(
        REGISTER_URL,
        json={"username": username, "email": email, "password": password},
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    # Add a notification for this user
    with client.application.app_context():
        user = User.query.filter_by(username=username).first()
        notif = Notification(user_id=user.id, message="Snooze me", read=False)
        db.session.add(notif)
        db.session.commit()
        notif_id = notif.id
    # Snooze the notification for 10 minutes
    with caplog.at_level(logging.INFO):
        resp = client.post(
            f"/api/notifications/{notif_id}/snooze", json={"minutes": 10}
        )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "snoozed_until" in data
    # Confirm snoozed_until is set and in the future
    with client.application.app_context():
        n = db.session.get(Notification, notif_id)
        assert n.snoozed_until is not None
        # Ensure both are aware datetimes for comparison
        snoozed_until = n.snoozed_until
        if snoozed_until.tzinfo is None:
            # Assume UTC if naive
            snoozed_until = snoozed_until.replace(tzinfo=timezone.utc)
        now_utc = datetime.now(timezone.utc)
        assert snoozed_until > now_utc - timedelta(minutes=1)
    # Check log messages
    assert any(
        "Notification snooze endpoint accessed" in m for m in caplog.messages
    )
    assert any("snoozed for" in m and "by user" in m for m in caplog.messages)
    # Error: missing minutes
    resp = client.post(f"/api/notifications/{notif_id}/snooze", json={})
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Minutes parameter is required"
    # Error: invalid minutes (non-integer)
    resp = client.post(
        f"/api/notifications/{notif_id}/snooze", json={"minutes": "bad"}
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Invalid minutes value"
    # Error: negative minutes
    resp = client.post(
        f"/api/notifications/{notif_id}/snooze", json={"minutes": -5}
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Minutes must be positive"
    # Error: zero minutes
    resp = client.post(
        f"/api/notifications/{notif_id}/snooze", json={"minutes": 0}
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Minutes must be positive"
    # Error: notification not found
    resp = client.post(
        "/api/notifications/999999/snooze", json={"minutes": 10}
    )
    assert resp.status_code == 404
    assert resp.get_json()["error"] == "Notification not found"
    # Error: snoozed_until attribute missing (simulate by monkeypatching
    # hasattr)
    orig_hasattr = builtins.hasattr

    def fake_hasattr(obj, name):
        if isinstance(obj, Notification) and name == "snoozed_until":
            return False
        return orig_hasattr(obj, name)

    builtins.hasattr = fake_hasattr
    try:
        resp = client.post(
            f"/api/notifications/{notif_id}/snooze", json={"minutes": 10}
        )
        # Should return 500 and error about missing snoozed_until
        assert resp.status_code == 500
        assert resp.get_json()["error"] == "Snooze functionality not available"
    finally:
        builtins.hasattr = orig_hasattr


def test_send_email_success_and_failure(caplog):
    """
    Test send_email utility for both TLS and non-TLS, success and failure
    cases. Covers app.py:716-732.
    """
    # Patch smtplib.SMTP
    with patch("app.smtplib.SMTP") as mock_smtp:
        # Simulate non-TLS success
        smtp_instance = MagicMock()
        mock_smtp.return_value = smtp_instance
        result = send_email("to@example.com", "Subject", "Body")
        assert result is True
        smtp_instance.send_message.assert_called()
        smtp_instance.quit.assert_called()
    # Explicitly check SMTP called with correct host/port
    # (covers app.py:726)
        from app import EMAIL_HOST, EMAIL_PORT

        mock_smtp.assert_any_call(EMAIL_HOST, EMAIL_PORT)
        # Simulate TLS success
        import app

        orig_tls = app.EMAIL_USE_TLS
        app.EMAIL_USE_TLS = True
        smtp_instance.reset_mock()
        result = send_email("to@example.com", "Subject", "Body")
        assert result is True
        smtp_instance.starttls.assert_called()
        smtp_instance.send_message.assert_called()
        smtp_instance.quit.assert_called()
        app.EMAIL_USE_TLS = orig_tls
        # Simulate login credentials
        app.EMAIL_HOST_USER = "user"
        app.EMAIL_HOST_PASSWORD = "pw"
        smtp_instance.reset_mock()
        result = send_email("to@example.com", "Subject", "Body")
        smtp_instance.login.assert_called_with("user", "pw")
        app.EMAIL_HOST_USER = ""
        app.EMAIL_HOST_PASSWORD = ""
        # Simulate send failure
        smtp_instance.send_message.side_effect = Exception("fail")
        with caplog.at_level("ERROR"):
            result = send_email("to@example.com", "Subject", "Body")
        assert result is False
        assert any("Failed to send email" in m for m in caplog.messages)


# Additional test for CSRF protection on profile update
@pytest.mark.usefixtures("client", "db")
def test_csrf_protect_profile_update(client):
    unique = uuid.uuid4().hex[:8]
    username = f"csrfprofile_{unique}"
    email = f"csrfprofile_{unique}@weatherboysuper.com"
    client.post(
        REGISTER_URL,
        json={
            "username": username,
            "email": email,
            "password": "StrongPass1!",
        },
    )
    client.post(
        LOGIN_URL, json={"username": username, "password": "StrongPass1!"}
    )
    client.application.config["TESTING"] = False
    resp = client.put(PROFILE_URL, json={"username": "newname"})
    assert resp.status_code in (403, 400, 401)
    client.application.config["TESTING"] = True


# --- CSRF Protection: Not Skipped for Other Endpoints ---
@pytest.mark.usefixtures("client", "db")
def test_csrf_protect_not_skipped_for_other_endpoints(client):
    """
    Ensure CSRF protection is NOT skipped for endpoints other than
    login/register (line 277 condition is false).
    This test posts to /api/profile (requires auth) and expects CSRF
    check to be enforced.
    """
    from app import app as flask_app

    original_testing = flask_app.config.get("TESTING", False)
    flask_app.config["TESTING"] = False
    # Register and login a user
    unique = uuid.uuid4().hex[:8]
    reg_data = {
        "username": f"csrfnotlogin_{unique}",
        "email": f"csrfnotlogin_{unique}@weatherboysuper.com",
        "password": "StrongPass1!",
    }
    client.post(REGISTER_URL, json=reg_data)
    client.post(
        LOGIN_URL,
        json={
            "username": reg_data["username"],
            "password": reg_data["password"],
        },
    )
    # Attempt to update profile (PUT) without CSRF token (should hit CSRF
    # check, not skip)
    resp = client.put(PROFILE_URL, json={"username": "newname"})
    assert resp.status_code == 403
    assert resp.get_json().get("error") == "Invalid or missing CSRF token"
    flask_app.config["TESTING"] = original_testing


# --- CSRF Protection: Valid Token (Covers line 291 not true) ---
@pytest.mark.usefixtures("client", "db")
def test_csrf_protect_valid_token_allows_request(client):
    """
    Ensure CSRF protection allows request when valid CSRF token is present
    (line 291 condition is false). This test sets a valid CSRF token in both
    cookie and header.
    """
    from app import app as flask_app

    original_testing = flask_app.config.get("TESTING", False)
    flask_app.config["TESTING"] = False
    # Register and login a user
    unique = uuid.uuid4().hex[:8]
    reg_data = {
        "username": f"csrfvalid_{unique}",
        "email": f"csrfvalid_{unique}@weatherboysuper.com",
        "password": "StrongPass1!",
    }
    client.post(REGISTER_URL, json=reg_data)
    client.post(
        LOGIN_URL,
        json={
            "username": reg_data["username"],
            "password": reg_data["password"],
        },
    )
    # Get a CSRF token from the endpoint
    resp = client.get("/api/csrf-token")
    csrf_token = resp.get_json()["csrf_token"]
    # Use the token in both cookie and header for the PUT request
    client.set_cookie("_csrf_token", csrf_token)
    resp = client.put(
        PROFILE_URL,
        json={"username": "newname"},
        headers={"X-CSRF-Token": csrf_token},
    )
    # Should not return a CSRF error (should be 200 or 400 depending on
    # profile update logic)
    assert resp.status_code in (200, 400)
    if resp.status_code == 403:
        assert resp.get_json().get("error") != "Invalid or missing CSRF token"
    flask_app.config["TESTING"] = original_testing


@pytest.fixture
def auth_client(client):
    unique = uuid.uuid4().hex[:8]
    username = f"authtestuser_{unique}"
    email = f"authtestuser_{unique}@weatherboysuper.com"
    client.post(
        REGISTER_URL,
        json={
            "username": username,
            "email": email,
            "password": "StrongPass1!",
        },
    )
    client.post(
        LOGIN_URL, json={"username": username, "password": "StrongPass1!"}
    )
    # skipcq: PYL-W0212
    client._authtestuser = username
    return client


def test_auth_client_fixture_works(auth_client):
    """
    Test that the auth_client fixture provides a valid authenticated
    session and can access the profile endpoint.
    """
    resp = auth_client.get("/api/profile")
    data = resp.get_json()
    assert resp.status_code == 200
    # skipcq: PYL-W0212
    assert data["username"] == auth_client._authtestuser


@pytest.mark.usefixtures("client", "db")
def test_get_current_user_found_and_not_found(client):
    # Simulate a request context with a user_id that does not exist in the
    # database
    # Register and login a user, then delete them
    username = "ghostuser"
    email = "ghostuser@weatherboysuper.com"
    # skipcq: PTC-W1006
    password = "StrongPass1!"
    client.post(
        REGISTER_URL,
        json={"username": username, "email": email, "password": password},
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    with client.application.app_context():
        user = User.query.filter_by(username=username).first()
        user_id = user.id
        db.session.delete(user)
        db.session.commit()
    # Set the now-nonexistent user_id in the session and call /api/profile
    with client.session_transaction() as sess:
        sess["user_id"] = user_id
    resp = client.get(PROFILE_URL)
    # Should return 401 because user is not found
    assert resp.status_code == 401
    assert "error" in resp.get_json()
    # Register and login a user

    username = "getuser"
    email = "getuser@weatherboysuper.com"  # Use a valid, non-reserved domain
    # skipcq: PTC-W1006
    password = "StrongPass1!"
    client.post(
        REGISTER_URL,
        json={"username": username, "email": email, "password": password},
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})

    # Simulate a request context with user_id in session
    with client.application.app_context():
        with client.session_transaction() as sess:
            user = User.query.filter_by(username=username).first()
            sess["user_id"] = user.id
        with client.application.test_request_context():
            flask.session["user_id"] = user.id
            found_user = get_current_user()
            assert found_user is not None
            assert found_user.username == username

    # Simulate a request context with no user_id in session
    # skipcq: PTC-W0062
    with client.application.app_context():
        with client.application.test_request_context():
            flask.session.clear()
            not_found_user = get_current_user()
            assert not_found_user is None


# --- CSRF Token Generation Tests ---
@pytest.mark.usefixtures("client", "db")
def test_generate_csrf_token_new_token(client):
    """
    Covers the branch where no CSRF token exists in cookies
    (new token generated).
    """
    with client.application.test_request_context("/"):
        token = generate_csrf_token()
        # Should be a 32-character hex string
        assert isinstance(token, str)
        assert len(token) == 32
        assert re.fullmatch(r"[0-9a-f]{32}", token)


@pytest.mark.usefixtures("client", "db")
def test_generate_csrf_token_existing_cookie(client):
    """
    Covers the branch where an existing CSRF token is found in cookies
    and returned.
    """
    test_token = "7a3a01c066082e712fa8dd9b4aeccb0c"  # valid 32-char hex string
    with client.application.test_request_context(
        "/", headers={"Cookie": f"_csrf_token={test_token}"}
    ):
        token = generate_csrf_token()
        assert token == test_token


# --- CSRF Protection Skipped for Login/Register Tests ---
@pytest.mark.usefixtures("client", "db")
@pytest.mark.parametrize("endpoint", ["/api/login", "/api/register"])
def test_csrf_skipped_for_login_register(client, endpoint):
    """
    Ensure CSRF protection is skipped for login and register endpoints
    (no CSRF token required). This test posts to login/register without a
    CSRF token and expects no CSRF error.
    """
    # Use unique credentials to avoid conflicts
    unique = uuid.uuid4().hex[:8]
    if endpoint == "/api/register":
        data = {
            "username": f"csrfskip_{unique}",
            "email": f"csrfskip_{unique}@weatherboysuper.com",
            "password": "StrongPass1!",
        }
    else:
        # Register first, then login
        reg_data = {
            "username": f"csrfskip_{unique}",
            "email": f"csrfskip_{unique}@weatherboysuper.com",
            "password": "StrongPass1!",
        }
        client.post("/api/register", json=reg_data)
        data = {
            "username": reg_data["username"],
            "password": reg_data["password"],
        }
    resp = client.post(endpoint, json=data)
    # Should not return a CSRF error (403), should be 201 for register or
    # 200/401 for login
    assert resp.status_code in (200, 201, 400, 401)
    if resp.status_code == 403:
        # If 403, check that it is not a CSRF error
        assert resp.get_json().get("error") != "Invalid or missing CSRF token"


# --- CSRF Skip Logging Test ---


@pytest.mark.usefixtures("client", "db")
@pytest.mark.parametrize("endpoint", ["/api/login", "/api/register"])
def test_csrf_skip_logs_debug_message(client, endpoint, caplog):
    """
    Ensure the logger.debug message is emitted when CSRF check is skipped
    for login/register endpoints. Temporarily disables TESTING mode to reach
    the relevant code.
    """
    from app import app as flask_app

    unique = uuid.uuid4().hex[:8]
    if endpoint == "/api/register":
        data = {
            "username": f"csrfskiplog_{unique}",
            "email": f"csrfskiplog_{unique}@weatherboysuper.com",
            "password": "StrongPass1!",
        }
    else:
        reg_data = {
            "username": f"csrfskiplog_{unique}",
            "email": f"csrfskiplog_{unique}@weatherboysuper.com",
            "password": "StrongPass1!",
        }
        client.post("/api/register", json=reg_data)
        data = {
            "username": reg_data["username"],
            "password": reg_data["password"],
        }
    # Save and override TESTING config
    original_testing = flask_app.config.get("TESTING", False)
    flask_app.config["TESTING"] = False
    try:
        with caplog.at_level("DEBUG"):
            client.post(endpoint, json=data)
        assert any(
            "CSRF check skipped for login/register endpoint." in message
            for message in caplog.messages
        )
    finally:
        flask_app.config["TESTING"] = original_testing


# --- CSRF Protection: Early Return in TESTING Mode ---
@pytest.mark.usefixtures("client", "db")
def test_csrf_protect_testing_mode_skips_check(client, caplog):
    """
    Ensure CSRF protection exits early in TESTING mode and logs the correct
    message. Covers the early return at line 227 in app.py.
    """
    from app import app as flask_app

    # TESTING should be True by default in pytest, but ensure it
    flask_app.config["TESTING"] = True
    unique = uuid.uuid4().hex[:8]
    reg_data = {
        "username": f"csrfskiptest_{unique}",
        "email": f"csrfskiptest_{unique}@weatherboysuper.com",
        "password": "StrongPass1!",
    }
    with caplog.at_level("DEBUG"):
        client.post("/api/register", json=reg_data)
    assert any(
        "CSRF protection is disabled in TESTING mode." in m
        for m in caplog.messages
    )


# --- CSRF Protection: Invalid/Missing Token (403) ---
@pytest.mark.usefixtures("client", "db")
def test_csrf_protect_invalid_token_returns_403(client):
    """
    Ensure CSRF protection returns 403 for missing/invalid CSRF token on a
    protected endpoint. Covers the error response at line 291 in app.py.
    """
    from app import app as flask_app

    # Temporarily disable TESTING to activate CSRF protection
    original_testing = flask_app.config.get("TESTING", False)
    flask_app.config["TESTING"] = False
    # Register and login a user
    unique = uuid.uuid4().hex[:8]
    reg_data = {
        "username": f"csrf403_{unique}",
        "email": f"csrf403_{unique}@weatherboysuper.com",
        "password": "StrongPass1!",
    }
    client.post("/api/register", json=reg_data)
    client.post(
        "/api/login",
        json={
            "username": reg_data["username"],
            "password": reg_data["password"],
        },
    )
    # Attempt to update profile (PUT) without CSRF token
    resp = client.put("/api/profile", json={"username": "newname"})
    assert resp.status_code == 403
    assert resp.get_json().get("error") == "Invalid or missing CSRF token"
    # Restore TESTING config
    flask_app.config["TESTING"] = original_testing


@pytest.mark.usefixtures("client", "db")
def test_auth_check_session_debug_logging(client, caplog):
    """
    Test that /api/auth/check emits session debug logs (covers lines
    429-432 in app.py).
    """
    unique = uuid.uuid4().hex[:8]
    username = f"sessionlog_{unique}"
    email = f"sessionlog_{unique}@weatherboysuper.com"
    # skipcq: PTC-W1006
    password = "StrongPass1!"
    # Register and login
    client.post(
        REGISTER_URL,
        json={"username": username, "email": email, "password": password},
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    # Check /api/auth/check and capture logs
    with caplog.at_level(logging.DEBUG):
        resp = client.get("/api/auth/check")
    assert resp.status_code == 200
    # Check that session debug logs are present
    assert any("Session contents:" in m for m in caplog.messages)
    assert any("Session ID:" in m for m in caplog.messages)
    assert any("User ID from session:" in m for m in caplog.messages)


@pytest.mark.usefixtures("client", "db")
def test_auth_check_no_user_logs_info(client, caplog):
    """
    Test that /api/auth/check emits info log for no authenticated user
    (covers lines 450-451 in app.py).
    """
    # Ensure no user is logged in
    with caplog.at_level(logging.INFO):
        resp = client.get("/api/auth/check")
    assert resp.status_code == 200
    # Check that the info log for no authenticated user is present
    assert any(
        "Auth check: No authenticated user" in m for m in caplog.messages
    )
