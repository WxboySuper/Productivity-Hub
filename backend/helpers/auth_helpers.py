import re
import secrets
from functools import wraps
from flask import jsonify, request, session
from models.user import User
from models import db, logger

def error_response(message, code):
    logger.error(message)
    if code >= 500:
        return (
            jsonify({"error": "An internal server error occurred. Please try again later."}),
            code,
        )
    return jsonify({"error": message}), code

def get_current_user():
    user_id = session.get("user_id")
    logger.debug("Fetching current user from session: user_id=%s", user_id)
    if user_id:
        user = db.session.get(User, user_id)
        if user:
            logger.info("Current user found: %s (ID: %s)", user.username, user.id)
        else:
            logger.warning("User ID %s not found in database.", user_id)
        return user
    logger.info("No user_id in session.")
    return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        logger.debug("Checking if user is logged in.")
        user = get_current_user()
        if not user:
            logger.warning("Unauthorized access attempt.")
            return error_response("Not authenticated", 401)
        return f(*args, **kwargs)
    return decorated_function

def is_strong_password(password):
    logger.debug("Checking password strength.")
    if len(password) < 8:
        logger.warning("Password too short.")
        return False
    if not re.search(r"[A-Z]", password):
        logger.warning("Password missing uppercase letter.")
        return False
    if not re.search(r"[a-z]", password):
        logger.warning("Password missing lowercase letter.")
        return False
    if not re.search(r"[0-9]", password):
        logger.warning("Password missing number.")
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        logger.warning("Password missing special character.")
        return False
    logger.debug("Password is strong.")
    return True

def generate_csrf_token():
    token = session.get("csrf_token")
    if token:
        logger.debug("Using existing CSRF token from session.")
        return token
    logger.info("Generating new CSRF token.")
    token = secrets.token_hex(16)
    session["csrf_token"] = token
    return token

def regenerate_session():
    session.clear()
    session.modified = True
