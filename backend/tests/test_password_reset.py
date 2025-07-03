import pytest
import sys
import os
from unittest.mock import patch

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

# Add more tests for edge cases as needed
