from flask import Flask, current_app
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


def test_csrf_protection_blocks(client):
    # Skip if CSRF protection is disabled in testing mode
    if client.application.config.get("TESTING", False):
        pytest.skip("CSRF protection is disabled in testing mode.")
    # Register and login to get authenticated session
    unique = "csrfuser"
    client.post(
        "/api/register",
        json={
            "username": unique,
            "email": f"{unique}@test.com",
            "password": "StrongPass1!",
        },
    )
    client.post("/api/login", json={"username": unique, "password": "StrongPass1!"})
    # Now POST to a protected endpoint without CSRF token
    resp = client.post(
        "/api/projects", json={"name": "CSRF Test", "description": "desc"}
    )
    # Should be 403 Forbidden if no CSRF token is present
    assert resp.status_code == 403
    assert "CSRF" in resp.get_json()["error"]
