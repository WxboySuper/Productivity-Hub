"""
conftest.py for pytest configuration and fixtures for the Productivity Hub
backend. Sets up a test Flask app and database for isolated testing.
"""

# Add backend directory to sys.path for local imports
# (required for test discovery)
import sys
import os
import tempfile
import pytest

sys.path.insert(
    0,
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
)

from app import app as flask_app, db as _db  # noqa: E402


@pytest.fixture(scope="session")
def app():
    db_fd, db_path = tempfile.mkstemp()
    flask_app.config["TESTING"] = True
    flask_app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    flask_app.config["WTF_CSRF_ENABLED"] = False
    flask_app.config["CSRF_ENABLED"] = False  # Disable custom CSRF if present
    flask_app.config["TESTING"] = True
    flask_app.config["SECRET_KEY"] = "test-secret-key"
    with flask_app.app_context():
        _db.create_all()
    yield flask_app
    with flask_app.app_context():
        _db.session.remove()
        _db.drop_all()
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture(scope="function")
def client(app):
    return app.test_client()


@pytest.fixture(scope="function")
def runner(app):
    return app.test_cli_runner()


@pytest.fixture(scope="function")
def db():
    yield _db
    _db.session.remove()
    _db.drop_all()
    _db.create_all()


@pytest.fixture(scope="function")
def auth_client(app):
    """
    Returns a test client with a registered and logged-in user
    using a valid email domain. Ensures CSRF is fully disabled
    for all requests in test mode.
    """
    client = app.test_client()
    # Use a valid, non-example.com email
    reg_data = {
        "username": "authtestuser",
        "email": "authtestuser@devmail.local",
        "password": "StrongPass1!",
    }
    client.post("/api/auth/register", json=reg_data)
    client.post(
        "/api/auth/login",
        json={
            "username": reg_data["username"],
            "password": reg_data["password"],
        },
    )
    return client
