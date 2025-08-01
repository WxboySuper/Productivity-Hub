
from backend import email_utils


def test_render_password_reset_email():
    link = "http://example.com/reset?token=abc"
    body = email_utils.render_password_reset_email(link, 42)
    assert link in body
    assert "42" in body
    assert "Productivity Hub Team" in body


# Patch smtplib to simulate sending
import smtplib


def test_send_email_success(monkeypatch):
    class DummySMTP:
        def __init__(self, *a, **k):
            raise NotImplementedError()

        def starttls(self):
            raise NotImplementedError()

        def login(self, u, p):
            raise NotImplementedError()

        def send_message(self, msg):
            self.sent = True

        def quit(self):
            raise NotImplementedError()

    monkeypatch.setattr(smtplib, "SMTP", lambda *a, **k: DummySMTP())
    result = email_utils.send_email("to@x.com", "Subject", "Body")
    assert result is True


def test_send_email_failure(monkeypatch):
    class DummySMTP:
        def __init__(self, *a, **k):
            raise NotImplementedError()

        def starttls(self):
            raise NotImplementedError()

        def login(self, u, p):
            raise NotImplementedError()

        @staticmethod
        def send_message(msg):
            raise Exception("fail")

        def quit(self):
            raise NotImplementedError()

    monkeypatch.setattr(smtplib, "SMTP", lambda *a, **k: DummySMTP())
    result = email_utils.send_email("to@x.com", "Subject", "Body")
    assert result is False
