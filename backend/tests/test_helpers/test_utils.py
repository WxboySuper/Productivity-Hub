from flask import Flask

from backend import utils


def test_error_response_400():
    app = Flask(__name__)
    with app.app_context():
        resp, code = utils.error_response("bad request", 400)
        assert code == 400
        assert resp.get_json()["error"] == "bad request"


def test_error_response_500():
    app = Flask(__name__)
    with app.app_context():
        resp, code = utils.error_response("something failed", 500)
        assert code == 500
        assert "internal server error" in resp.get_json()["error"]
