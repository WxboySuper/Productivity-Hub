import os
import sys
import tempfile
import shutil
import importlib.util
import pytest

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
APP_PATH = os.path.join(BACKEND_DIR, "..", "app.py")


@pytest.fixture
def temp_env():
    """
    Fixture to create a temporary directory and .env file.
    """
    temp_dir = tempfile.mkdtemp()
    dotenv_path = os.path.join(temp_dir, ".env")
    yield temp_dir, dotenv_path
    shutil.rmtree(temp_dir)


def import_app_with_env(
    dotenv_path, monkeypatch, exists_value=True, load_success=True
):
    """
    Dynamically import app.py with a given DOTENV_PATH, controlling os.path.exists and load_dotenv return values.
    """
    orig_join = os.path.join

    def join_patch(*args):
        # If any call ends with '.env', return our temp dotenv_path
        if args and args[-1] == ".env":
            return dotenv_path
        return orig_join(*args)

    monkeypatch.setattr("os.path.join", join_patch)
    monkeypatch.setattr(
        "os.path.exists",
        lambda path: exists_value if path == dotenv_path else False,
    )
    import dotenv

    monkeypatch.setattr(
        dotenv,
        "load_dotenv",
        lambda path: load_success if path == dotenv_path else False,
    )
    monkeypatch.setattr(
        sys, "exit", lambda code=1: (_ for _ in ()).throw(SystemExit(code))
    )
    # Import app.py
    spec = importlib.util.spec_from_file_location("app", APP_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_app_exits_if_env_file_missing(monkeypatch, temp_env):
    _, dotenv_path = temp_env
    # Simulate .env file missing
    with pytest.raises(SystemExit) as excinfo:
        import_app_with_env(dotenv_path, monkeypatch, exists_value=False)
    assert excinfo.value.code == 1


def test_app_exits_if_env_file_fails_to_load(monkeypatch, temp_env):
    _, dotenv_path = temp_env
    # Create the .env file so it exists
    with open(dotenv_path, "w") as f:
        f.write("DUMMY=1\n")
    # Simulate .env file exists but fails to load
    with pytest.raises(SystemExit) as excinfo:
        import_app_with_env(
            dotenv_path, monkeypatch, exists_value=True, load_success=False
        )
    assert excinfo.value.code == 1


def test_app_loads_env_file_success(monkeypatch, temp_env):
    _, dotenv_path = temp_env
    # Create the .env file so it exists
    with open(dotenv_path, "w") as f:
        f.write("DUMMY=1\n")
    # Simulate .env file exists and loads successfully
    import_app_with_env(
        dotenv_path, monkeypatch, exists_value=True, load_success=True
    )
