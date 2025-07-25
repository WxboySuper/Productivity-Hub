import importlib.util
import os
import sys
import warnings

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
APP_PATH = os.path.abspath(os.path.join(BACKEND_DIR, "..", "app.py"))


def import_app_with_env_and_warning(monkeypatch, flask_env=None, environment=None):
    """
    Import app.py with patched environment variables and capture warnings.
    Returns the list of warnings raised during import.
    """
    # Patch environment variables
    env = os.environ.copy()
    if flask_env is not None:
        env["FLASK_ENV"] = flask_env
    else:
        env.pop("FLASK_ENV", None)
    if environment is not None:
        env["ENVIRONMENT"] = environment
    else:
        env.pop("ENVIRONMENT", None)
    monkeypatch.setattr(os, "environ", env)
    # Patch .env logic to always succeed
    monkeypatch.setattr("os.path.exists", lambda path: True)
    import dotenv

    monkeypatch.setattr(dotenv, "load_dotenv", lambda path: True)
    monkeypatch.setattr(
        sys, "exit", lambda code=1: (_ for _ in ()).throw(SystemExit(code))
    )
    # Patch warnings.warn to capture warnings
    captured = []

    def warn_patch(message, *args, category=None, **kwargs):
        # category may be passed as the second positional argument
        cat = category
        if len(args) > 0:
            cat = args[0]
        captured.append((message, cat))

    monkeypatch.setattr(warnings, "warn", warn_patch)
    # Import app.py
    spec = importlib.util.spec_from_file_location("app", APP_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return captured


def test_warns_if_flask_env_production(monkeypatch):
    warnings_list = import_app_with_env_and_warning(
        monkeypatch, flask_env="production", environment=None
    )
    assert any("production mode" in str(msg).lower() for msg, cat in warnings_list)
    assert any(cat == RuntimeWarning for msg, cat in warnings_list)


def test_warns_if_environment_production(monkeypatch):
    warnings_list = import_app_with_env_and_warning(
        monkeypatch, flask_env=None, environment="production"
    )
    assert any("production mode" in str(msg).lower() for msg, cat in warnings_list)
    assert any(cat == RuntimeWarning for msg, cat in warnings_list)


def test_no_warning_if_not_production(monkeypatch):
    warnings_list = import_app_with_env_and_warning(
        monkeypatch, flask_env="development", environment="development"
    )
    assert not warnings_list
