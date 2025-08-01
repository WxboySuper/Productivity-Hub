import pytest
from backend import email_utils

def test_render_password_reset_email():
    link = "http://example.com/reset?token=abc"
    body = email_utils.render_password_reset_email(link, 42)
    assert link in body
    assert "42" in body
    assert "Productivity Hub Team" in body

# Patch smtplib to simulate sending
import smtplib
from unittest.mock import patch, MagicMock

def test_send_email_success(monkeypatch):
    class DummySMTP:
        def __init__(self, *a, **k): pass
        def starttls(self): pass
        def login(self, u, p): pass
        def send_message(self, msg): self.sent = True
        def quit(self): pass
    monkeypatch.setattr(smtplib, "SMTP", lambda *a, **k: DummySMTP())
    result = email_utils.send_email("to@x.com", "Subject", "Body")
    assert result is True

def test_send_email_failure(monkeypatch):
    class DummySMTP:
        def __init__(self, *a, **k): pass
        def starttls(self): pass
        def login(self, u, p): pass
        def send_message(self, msg): raise Exception("fail")
        def quit(self): pass
    monkeypatch.setattr(smtplib, "SMTP", lambda *a, **k: DummySMTP())
    result = email_utils.send_email("to@x.com", "Subject", "Body")
    assert result is False
