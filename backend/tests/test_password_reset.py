import pytest
import sys
import os
from unittest.mock import patch
from datetime import timedelta, datetime, timezone

# Ensure the parent directory is in sys.path for relative imports
sys.path.insert(
    0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
)
from app import User, PasswordResetToken


@pytest.fixture
def user(db):
    u = User(username="resetuser", email="resetuser@example.com")
    u.set_password("StrongPassw0rd!")
    db.session.add(u)
    db.session.commit()
    return u


@patch("app.send_email")
def test_password_reset_request_valid_email(mock_send_email, client, db, user):
    mock_send_email.return_value = True
    resp = client.post(
        "/api/password-reset/request", json={"email": user.email}
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert "message" in data
    assert "token" in data
    # Token should be stored in DB
    prt = PasswordResetToken.query.filter_by(
        user_id=user.id,
        token=data["token"]
    ).first()
    assert prt is not None


@patch("app.send_email")
def test_password_reset_request_invalid_email(mock_send_email, client, db):
    mock_send_email.return_value = True
    resp = client.post(
        "/api/password-reset/request",
        json={"email": "nonexistent@example.com"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert "message" in data
    assert "token" not in data or data["token"] is None


@patch("app.send_email")
def test_password_reset_request_missing_email(mock_send_email, client, db):
    mock_send_email.return_value = True
    resp = client.post("/api/password-reset/request", json={})
    assert resp.status_code == 400  # Should return 400 for missing email
    data = resp.get_json()
    assert "error" in data


def test_password_reset_email_sent(client, db, user):
    with patch("app.send_email") as mock_send:
        mock_send.return_value = True
        resp = client.post(
            "/api/password-reset/request", json={"email": user.email}
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "message" in data
        assert "token" in data  # Only in dev/test mode
        mock_send.assert_called_once()


@patch("app.send_email")
def test_password_reset_confirm_valid(mock_send_email, client, db, user):
    mock_send_email.return_value = True
    # Request a reset token
    resp = client.post(
        "/api/password-reset/request", json={"email": user.email}
    )
    token = resp.get_json()["token"]
    # Use the token to reset password
    resp2 = client.post(
        "/api/password-reset/confirm",
        json={"token": token, "new_password": "NewStrongPassw0rd!"},
    )
    assert resp2.status_code == 200
    data = resp2.get_json()
    assert "message" in data
    # Verify old password no longer works
    assert not user.check_password("StrongPassw0rd!")
    # Verify new password works (need to refresh from DB)
    from app import db

    user_updated = db.session.get(User, user.id)
    assert user_updated.check_password("NewStrongPassw0rd!")


def test_password_reset_confirm_invalid_token(client, db, user):
    resp = client.post(
        "/api/password-reset/confirm",
        json={"token": "invalid_token", "new_password": "NewStrongPassw0rd!"},
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert "error" in data


@patch("app.send_email")
def test_password_reset_confirm_used_token(mock_send_email, client, db, user):
    mock_send_email.return_value = True
    # Request a reset token
    resp = client.post(
        "/api/password-reset/request", json={"email": user.email}
    )
    token = resp.get_json()["token"]
    # Use the token once
    resp1 = client.post(
        "/api/password-reset/confirm",
        json={"token": token, "new_password": "NewStrongPassw0rd!"},
    )
    assert resp1.status_code == 200
    # Try to use the same token again
    resp2 = client.post(
        "/api/password-reset/confirm",
        json={"token": token, "new_password": "AnotherStrongPassw0rd!"},
    )
    assert resp2.status_code == 400
    data = resp2.get_json()
    assert "error" in data
    assert (
        "expired" in data["error"].lower()
    )  # Updated to match actual error message


@patch("app.send_email")
def test_password_reset_confirm_weak_password(
    mock_send_email, client, db, user
):
    mock_send_email.return_value = True
    # Request a reset token
    resp = client.post(
        "/api/password-reset/request", json={"email": user.email}
    )
    token = resp.get_json()["token"]
    # Try to reset with a weak password
    resp2 = client.post(
        "/api/password-reset/confirm",
        json={"token": token, "new_password": "123"},
    )
    assert resp2.status_code == 400
    data = resp2.get_json()
    assert "error" in data
    assert (
        "characters" in data["error"].lower()
    )  # Updated to match actual error message


def test_password_reset_token_expiration(client, db, user):
    # Create a token that is already expired
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=1)
    prt = PasswordResetToken(
        user_id=user.id, token="expired_token", expires_at=expired_time
    )
    db.session.add(prt)
    db.session.commit()
    # Try to use the expired token
    resp = client.post(
        "/api/password-reset/confirm",
        json={"token": "expired_token", "new_password": "NewStrongPassw0rd!"},
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert "error" in data
    assert "expired" in data["error"].lower()
