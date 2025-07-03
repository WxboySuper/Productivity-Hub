import pytest
import sys
import os
from unittest.mock import patch
from datetime import timedelta, datetime, timezone

# Ensure the parent directory is in sys.path for relative imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import User, PasswordResetToken

@pytest.fixture
def user(db):
    u = User(username="resetuser", email="resetuser@example.com")
    u.set_password("StrongPassw0rd!")
    db.session.add(u)
    db.session.commit()
    return u

def test_password_reset_request_valid_email(client, db, user):
    resp = client.post("/api/password-reset/request", json={"email": user.email})
    assert resp.status_code == 200
    data = resp.get_json()
    assert "message" in data
    assert "token" in data
    # Token should be stored in DB
    prt = PasswordResetToken.query.filter_by(user_id=user.id, token=data["token"]).first()
    assert prt is not None
    assert not prt.used

def test_password_reset_request_invalid_email(client, db):
    resp = client.post("/api/password-reset/request", json={"email": "notfound@example.com"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert "message" in data
    assert "token" not in data or data["token"] is None

def test_password_reset_request_missing_email(client, db):
    resp = client.post("/api/password-reset/request", json={})
    assert resp.status_code == 200
    data = resp.get_json()
    assert "message" in data
    assert "token" not in data or data["token"] is None

def test_password_reset_email_sent(client, db, user):
    with patch('app.send_email') as mock_send:
        mock_send.return_value = True
        resp = client.post("/api/password-reset/request", json={"email": user.email})
        assert resp.status_code == 200
        data = resp.get_json()
        assert "message" in data
        assert "token" in data  # Only in dev/test mode
        mock_send.assert_called_once()
        called_args = mock_send.call_args[0]
        assert user.email in called_args[0]  # to_address
        assert "Password Reset Request" in called_args[1]  # subject
        assert data["token"] in called_args[2]  # token in email body

def test_password_reset_confirm_valid(client, db, user):
    # Request a reset token
    resp = client.post("/api/password-reset/request", json={"email": user.email})
    token = resp.get_json()["token"]
    # Confirm password reset with valid token and strong password
    resp2 = client.post("/api/password-reset/confirm", json={"token": token, "new_password": "NewStrongPassw0rd!"})
    assert resp2.status_code == 200
    data = resp2.get_json()
    assert "message" in data
    # Token should be marked as used
    prt = PasswordResetToken.query.filter_by(token=token).first()
    assert prt.used
    # User password should be updated
    assert user.check_password("NewStrongPassw0rd!")

def test_password_reset_confirm_invalid_token(client, db, user):
    resp = client.post("/api/password-reset/confirm", json={"token": "invalidtoken", "new_password": "NewStrongPassw0rd!"})
    assert resp.status_code == 400
    data = resp.get_json()
    assert "error" in data

def test_password_reset_confirm_used_token(client, db, user):
    # Request a reset token
    resp = client.post("/api/password-reset/request", json={"email": user.email})
    token = resp.get_json()["token"]
    # Use the token once
    client.post("/api/password-reset/confirm", json={"token": token, "new_password": "NewStrongPassw0rd!"})
    # Try to use the same token again
    resp2 = client.post("/api/password-reset/confirm", json={"token": token, "new_password": "AnotherStrongPassw0rd!"})
    assert resp2.status_code == 400
    data = resp2.get_json()
    assert "error" in data
    assert "used" in data["error"].lower()

def test_password_reset_confirm_weak_password(client, db, user):
    # Request a reset token
    resp = client.post("/api/password-reset/request", json={"email": user.email})
    token = resp.get_json()["token"]
    # Try to reset with a weak password
    resp2 = client.post("/api/password-reset/confirm", json={"token": token, "new_password": "123"})
    assert resp2.status_code == 400
    data = resp2.get_json()
    assert "error" in data
    assert "strength" in data["error"].lower()

def test_password_reset_token_expiration(client, db, user):
    # Create a token that is already expired
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=1)
    prt = PasswordResetToken(user_id=user.id, token="expiredtoken", expires_at=expired_time)
    db.session.add(prt)
    db.session.commit()
    # Try to confirm with expired token
    resp = client.post("/api/password-reset/confirm", json={"token": "expiredtoken", "new_password": "NewStrongPassw0rd!"})
    assert resp.status_code == 400
    data = resp.get_json()
    assert "error" in data
    assert "expired" in data["error"].lower()
