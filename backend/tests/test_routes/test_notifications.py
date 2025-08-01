import builtins
import logging
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from app import app as flask_app
from app import db
from models.notification import Notification
from models.user import User

REGISTER_URL = "/api/register"
LOGIN_URL = "/api/login"


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
    password = "StrongPass1!"
    client.post(
        REGISTER_URL,
        json={"username": username, "email": email, "password": password},
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    with client.application.app_context():
        user = User.query.filter_by(username=username).first()
        n1 = Notification(user_id=user.id, message="Test notification 1", read=False)
        n2 = Notification(
            user_id=user.id,
            message="Test notification 2",
            read=True,
            show_at=None,
        )
        n3 = Notification(user_id=user.id, message="Test notification 3", read=False)
        db.session.add_all([n1, n2, n3])
        db.session.commit()
        n2.show_at = n2.created_at
        n2.snoozed_until = n2.created_at
        db.session.commit()
        n2_id = n2.id
    with caplog.at_level(logging.INFO):
        resp = client.get("/api/notifications")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) >= 3
    for notif in data:
        assert "id" in notif
        assert "message" in notif
        assert "read" in notif
        assert "created_at" in notif
        assert "task_id" in notif
        if "n2_id" in locals() and notif["id"] == n2_id:
            assert "show_at" in notif
            assert "snoozed_until" in notif
    assert any(
        "Returning" in m and "notifications for user" in m for m in caplog.messages
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
    password = "StrongPass1!"
    client.post(
        REGISTER_URL,
        json={"username": username, "email": email, "password": password},
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    with client.application.app_context():
        user = User.query.filter_by(username=username).first()
        notif = Notification(user_id=user.id, message="Dismiss me", read=False)
        db.session.add(notif)
        db.session.commit()
        notif_id = notif.id
    with caplog.at_level(logging.INFO):
        resp = client.post(f"/api/notifications/{notif_id}/dismiss")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data == {"success": True}
    with client.application.app_context():
        n = db.session.get(Notification, notif_id)
        assert n.read is True
    assert any("Notification dismiss endpoint accessed" in m for m in caplog.messages)
    assert any("dismissed by user" in m for m in caplog.messages)
    with caplog.at_level(logging.WARNING):
        resp = client.post("/api/notifications/999999/dismiss")
    assert resp.status_code == 404
    data = resp.get_json()
    assert data == {"error": "Notification not found"}
    assert any("Notification not found or doesn" in m for m in caplog.messages)


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
    client.post(
        REGISTER_URL,
        json={"username": username, "email": email, "password": password},
    )
    client.post(LOGIN_URL, json={"username": username, "password": password})
    with client.application.app_context():
        user = User.query.filter_by(username=username).first()
        notif = Notification(user_id=user.id, message="Snooze me", read=False)
        db.session.add(notif)
        db.session.commit()
        notif_id = notif.id
    with caplog.at_level(logging.INFO):
        resp = client.post(
            f"/api/notifications/{notif_id}/snooze", json={"minutes": 10}
        )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "snoozed_until" in data
    with client.application.app_context():
        n = db.session.get(Notification, notif_id)
        assert n.snoozed_until is not None
        snoozed_until = n.snoozed_until
        if snoozed_until.tzinfo is None:
            snoozed_until = snoozed_until.replace(tzinfo=timezone.utc)
        now_utc = datetime.now(timezone.utc)
        assert snoozed_until > now_utc - timedelta(minutes=1)
    assert any("Notification snooze endpoint accessed" in m for m in caplog.messages)
    assert any("snoozed for" in m and "by user" in m for m in caplog.messages)
    resp = client.post(f"/api/notifications/{notif_id}/snooze", json={})
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Minutes parameter is required"
    resp = client.post(f"/api/notifications/{notif_id}/snooze", json={"minutes": "bad"})
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Invalid minutes value"
    resp = client.post(f"/api/notifications/{notif_id}/snooze", json={"minutes": -5})
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Minutes must be positive"
    resp = client.post(f"/api/notifications/{notif_id}/snooze", json={"minutes": 0})
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Minutes must be positive"
    resp = client.post("/api/notifications/999999/snooze", json={"minutes": 10})
    assert resp.status_code == 404
    assert resp.get_json()["error"] == "Notification not found"
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
        assert resp.status_code == 500
        assert resp.get_json()["error"] == "Snooze functionality not available"
    finally:
        builtins.hasattr = orig_hasattr
