import os
import smtplib
from email.message import EmailMessage
from string import Template

from models import logger

EMAIL_HOST = os.environ.get("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 1025))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "false").lower() == "true"
EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@localhost")


def send_email(to_address, subject, body):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = EMAIL_FROM
    msg["To"] = to_address
    msg.set_content(body)
    try:
        if EMAIL_USE_TLS:
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info("Password reset email sent to %s", to_address)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_address, e)
        return False


def render_password_reset_email(reset_link, expiration_minutes=60):
    template = Template(
        "Hello,\n\nA password reset was requested for your account. "
        "If this was you, click the link below to reset your password.\n\n"
        "$reset_link\n\nExpires in $expiration_minutes minutes.\n\n"
        "If you did not request this, you can ignore this email.\n\n"
        "Thanks,\nProductivity Hub Team"
    )
    return template.substitute(
        reset_link=reset_link, expiration_minutes=expiration_minutes
    )
