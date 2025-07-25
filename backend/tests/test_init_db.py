import os
import tempfile
from app import app, db, init_db


def test_init_db_creates_tables():
    # Use a temporary SQLite database for isolation
    db_fd, db_path = tempfile.mkstemp()
    try:
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
        app.config["TESTING"] = True

        with app.app_context():
            # Drop all tables to ensure a clean state
            db.drop_all()
            # Call the function under test
            init_db()
            # Check that tables exist
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            assert "user" in tables
            assert "task" in tables
            assert "project" in tables
            assert "password_reset_tokens" in tables
            assert "notification" in tables
            assert "task_dependencies" in tables
            assert "task_links" in tables
    finally:
        os.close(db_fd)
        os.unlink(db_path)
