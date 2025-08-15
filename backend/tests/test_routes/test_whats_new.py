"""Tests for the whats_new blueprint."""

import json
from unittest.mock import mock_open, patch

import pytest


def test_get_latest_release_success(client):
    """Test successfully getting the latest release data."""
    mock_data = {"version": "1.0.0", "notes": ["Initial release"]}
    mock_json = json.dumps(mock_data)

    with patch("builtins.open", mock_open(read_data=mock_json)) as mock_file:
        resp = client.get("/api/releases/latest")
        assert resp.status_code == 200
        assert resp.get_json() == mock_data
        mock_file.assert_called_once()


def test_get_latest_release_file_not_found(client):
    """Test the endpoint when the whats-new.json file is not found."""
    with patch("builtins.open", side_effect=FileNotFoundError):
        resp = client.get("/api/releases/latest")
        assert resp.status_code == 500
        assert "file not found" in resp.get_json()["error"]


def test_get_latest_release_json_decode_error(client):
    """Test the endpoint when the whats-new.json file is malformed."""
    with patch("builtins.open", mock_open(read_data="invalid json")):
        resp = client.get("/api/releases/latest")
        assert resp.status_code == 500
        assert "JSON decode error" in resp.get_json()["error"]


def test_get_latest_release_uses_env_var(client, monkeypatch):
    """Test that the endpoint respects the WHATS_NEW_JSON_PATH env var."""
    custom_path = "/custom/path/to/whats-new.json"
    monkeypatch.setenv("WHATS_NEW_JSON_PATH", custom_path)

    mock_data = {"version": "2.0.0", "notes": ["From custom path"]}
    mock_json = json.dumps(mock_data)

    with patch("builtins.open", mock_open(read_data=mock_json)) as mock_file:
        resp = client.get("/api/releases/latest")
        assert resp.status_code == 200
        assert resp.get_json() == mock_data
        mock_file.assert_called_with(custom_path)
