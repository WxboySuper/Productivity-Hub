import pytest


def test_404_api_error_handler(client):
    resp = client.get("/api/nonexistent")
    assert resp.status_code == 404
    assert resp.get_json()["error"] == "Not found"


def test_404_non_api_returns_html(client):
    resp = client.get("/nonexistent")
    # Should not return JSON for non-API routes
    assert resp.status_code == 404
    assert resp.content_type.startswith("text/html")


def test_home_route(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"Productivity Hub" in resp.data
