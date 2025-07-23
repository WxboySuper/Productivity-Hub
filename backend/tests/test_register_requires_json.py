from app import app

def test_register_requires_json():
    """Test that /api/register returns 400 and correct error if request is not JSON."""
    with app.test_client() as client:
        # Send form data instead of JSON
        response = client.post("/api/register", data={"username": "user", "email": "a@b.com", "password": "Password1!"})
        assert response.status_code == 400
        data = response.get_json()
        assert data["error"] == "Request must be JSON"


def test_register_invalid_email():
    """Test that /api/register returns 400 and correct error for invalid email."""
    with app.test_client() as client:
        payload = {
            "username": "user1",
            "email": "not-an-email",
            "password": "Password1!"
        }
        response = client.post("/api/register", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "Invalid email" in data["error"]
