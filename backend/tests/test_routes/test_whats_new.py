"""Tests for the whats_new blueprint."""

import io
import json

import pytest


def test_get_latest_release_success(client, monkeypatch):
    """Test successfully getting the latest release data."""
    mock_data = {"version": "1.0.0", "notes": ["Initial release"]}
    mock_json = json.dumps(mock_data)

    class OpenSpy:
        def __init__(self):
            self.called = False

        def __call__(self, path, mode="r"):
            self.called = True
            return io.StringIO(mock_json)

    spy = OpenSpy()
    monkeypatch.setattr("builtins.open", spy)

    resp = client.get("/api/releases/latest")
    assert resp.status_code == 200
    assert resp.get_json() == mock_data
    assert spy.called


def test_get_latest_release_file_not_found(client, monkeypatch):
    """Test the endpoint when the whats-new.json file is not found."""

    def mock_open_raises_error(path, mode="r"):
        raise FileNotFoundError

    monkeypatch.setattr("builtins.open", mock_open_raises_error)

    resp = client.get("/api/releases/latest")
    assert resp.status_code == 500
    assert (
        "Failed to load latest release data: file not found" == resp.get_json()["error"]
    )


def test_get_latest_release_json_decode_error(client, monkeypatch):
    """Test the endpoint when the whats-new.json file is malformed."""

    def mock_open_invalid_json(path, mode="r"):
        return io.StringIO("invalid json")

    monkeypatch.setattr("builtins.open", mock_open_invalid_json)

    resp = client.get("/api/releases/latest")
    assert resp.status_code == 500
    assert (
        "Failed to load latest release data: JSON decode error"
        == resp.get_json()["error"]
    )


def test_get_latest_release_uses_env_var(client, monkeypatch):
    """Test that the endpoint respects the WHATS_NEW_JSON_PATH env var."""
    custom_path = "/custom/path/to/whats-new.json"
    monkeypatch.setenv("WHATS_NEW_JSON_PATH", custom_path)

    mock_data = {"version": "2.0.0", "notes": ["From custom path"]}
    mock_json = json.dumps(mock_data)

    class OpenSpy:
        def __init__(self):
            self.called_path = None

        def __call__(self, path, mode="r"):
            self.called_path = path
            return io.StringIO(mock_json)

    spy = OpenSpy()
    monkeypatch.setattr("builtins.open", spy)

    resp = client.get("/api/releases/latest")
    assert resp.status_code == 200
    assert resp.get_json() == mock_data
    assert spy.called_path == custom_path
