import flask

from backend.helpers import auth_helpers


class DummyLogger:
    def __init__(self):
        self.messages = []

    def error(self, msg):
        self.messages.append(msg)

    def debug(self, msg, *a, **k):
        raise NotImplementedError()

    def info(self, msg, *a, **k):
        raise NotImplementedError()

    def warning(self, msg, *a, **k):
        raise NotImplementedError()


def test_is_strong_password():
    assert not auth_helpers.is_strong_password("short")
    assert not auth_helpers.is_strong_password("alllowercase1!")
    assert not auth_helpers.is_strong_password("ALLUPPERCASE1!")
    assert not auth_helpers.is_strong_password("NoNumber!")
    assert not auth_helpers.is_strong_password("NoSpecial1")
    assert auth_helpers.is_strong_password("StrongPass1!")


def test_generate_csrf_token(monkeypatch):
    app = flask.Flask(__name__)
    app.secret_key = "test-secret-key"
    with app.test_request_context("/"):
        # No session token: should generate new
        token = auth_helpers.generate_csrf_token()
        assert isinstance(token, str) and len(token) == 32
        # With valid session token: should return it
        flask.session["csrf_token"] = "a" * 32
        token2 = auth_helpers.generate_csrf_token()
        assert token2 == "a" * 32


def test_regenerate_session():
    app = flask.Flask(__name__)
    app.secret_key = "test-secret-key"
    with app.test_request_context("/"):
        flask.session["foo"] = "bar"
        flask.session.modified = False
        auth_helpers.regenerate_session()
        assert len(flask.session.keys()) == 0
        assert flask.session.modified is True
