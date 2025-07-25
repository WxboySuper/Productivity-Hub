from app import app


def test_home_route():
    """
    Test the home route returns the expected welcome message
    and status code.
    """
    with app.test_client() as client:
        response = client.get("/")
        assert response.status_code == 200
        assert (
            response.data.decode()
            == "Welcome to the Productivity Hub Backend!"
        )
