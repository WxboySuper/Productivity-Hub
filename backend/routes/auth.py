import os
import secrets
import time
from datetime import datetime, timedelta, timezone

import bleach
from email_utils import render_password_reset_email, send_email
from email_validator import EmailNotValidError, validate_email
from flask import Blueprint, current_app, jsonify, request, session
from models.password_reset_token import PasswordResetToken
from models.user import User
from models import db, logger
from helpers.auth_helpers import (
    error_response,
    generate_csrf_token,
    get_current_user,
    is_strong_password,
    login_required,
    regenerate_session,
)
from werkzeug.security import check_password_hash

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/register", methods=["POST"])
def register():
    logger.info("Register endpoint accessed.")
    if not request.is_json:
        logger.error("Request must be JSON.")
        return error_response("Request must be JSON", 400)
    try:
        data = request.get_json()
    except Exception as e:
        logger.error("Malformed JSON: %s", e)
        return error_response("Malformed JSON in request body", 400)
    if not isinstance(data, dict):
        logger.error("Request JSON body is not an object.")
        return error_response("Request JSON body must be an object", 400)
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    if (
        not username
        or not email
        or not password
        or not username.strip()
        or not email.strip()
        or not password.strip()
    ):
        logger.error("Missing required fields: username, email, or password.")
        return error_response(
            "Missing required fields: username, email, or password",
            400,
        )
    try:
        validate_email(email)
        logger.info("Email %s is valid.", email)
    except EmailNotValidError as e:
        logger.error("Invalid email: %s", e)
        return error_response(f"Invalid email: {e}", 400)
    if not is_strong_password(password):
        logger.error("Weak password provided.")
        return error_response(
            {"password": "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters."},
            400,
        )
    try:
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error("User registration failed: %s", e)
        if "UNIQUE constraint failed" in str(e):
            if "user.username" in str(e):
                return error_response({"username": "Username already exists"}, 400)
            elif "user.email" in str(e):
                return error_response({"email": "Email already exists"}, 400)
            else:
                return error_response({"username": "Username or email already exists"}, 400)
        return error_response("Registration failed", 500)
    logger.info("User %s registered successfully.", username)
    return jsonify({
        "success": True,
        "message": "User registered successfully",
        "user_id": user.id
    }), 201


@auth_bp.route("/api/login", methods=["POST"])
def login():
    logger.info("Login endpoint accessed.")
    if not request.is_json:
        logger.error("Request must be JSON.")
        return error_response("Request must be JSON", 400)
    try:
        data = request.get_json()
    except Exception as e:
        logger.error("Malformed JSON: %s", e)
        return error_response("Malformed JSON in request body", 400)
    username_or_email = data.get("username") or data.get("email")
    password = data.get("password")
    if (
        not username_or_email
        or not password
        or not username_or_email.strip()
        or not password.strip()
    ):
        logger.error("Missing required fields: username/email or password.")
        return error_response(
            "Missing required fields: username/email or password", 400
        )
    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()
    if user:
        password_valid = user.check_password(password)
    else:
        check_password_hash("dummy hash", password)
        password_valid = False
    if not user or not password_valid:
        logger.warning("Invalid login attempt for user: %s", username_or_email)
        return error_response("Invalid credentials", 401)
    session["user_id"] = user.id
    session.permanent = True
    session.modified = True
    logger.debug("Session after login: %s", dict(session))
    logger.debug("Session ID after login: %s", session.get("_id", "No session ID"))
    logger.info("User %s logged in successfully.", user.username)
    return (
        jsonify(
            {
                "success": True,
                "message": "Login successful",
                "user_id": user.id,
                # Optionally include session_debug if needed for debugging:
                # "session_debug": {
                #     "user_id": session.get("user_id"),
                #     "has_session_id": bool(session.get("_id")),
                #     "session_keys": list(session.keys()),
                # },
            }
        ),
        200,
    )


@auth_bp.route("/api/logout", methods=["POST"])
def logout():
    logger.info("Logout endpoint accessed.")
    regenerate_session()
    logger.info("User logged out successfully.")
    return jsonify({"success": True, "message": "Logout successful"}), 200


@auth_bp.route("/api/auth/check", methods=["GET"])
def check_auth():
    logger.debug("Session contents: %s", dict(session))
    logger.debug("Session ID: %s", session.get("_id", "No session ID"))
    logger.debug("User ID from session: %s", session.get("user_id", "No user ID"))
    user = get_current_user()
    if user:
        logger.info(
            "Auth check: User %s (ID: %s) is authenticated",
            user.username,
            user.id,
        )
        return (
            jsonify(
                {
                    "authenticated": True,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                    "session_info": {
                        "has_session_id": bool(session.get("_id")),
                        "has_user_id": bool(session.get("user_id")),
                        "session_keys": list(session.keys()),
                    },
                }
            ),
            200,
        )
    logger.info("Auth check: No authenticated user")
    return (
        jsonify(
            {
                "authenticated": False,
                "user": None,
                "session_info": {
                    "has_session_id": bool(session.get("_id")),
                    "has_user_id": bool(session.get("user_id")),
                    "session_keys": list(session.keys()),
                },
            }
        ),
        200,
    )


@auth_bp.route("/api/profile", methods=["GET"])
@login_required
def get_profile():
    logger.info("Profile GET endpoint accessed.")
    user = get_current_user()
    if not user:
        logger.warning(
            "Profile requested for missing user (unauthenticated or deleted)."
        )
        return error_response("Not authenticated", 401)
    logger.info("Returning profile for user: %s (ID: %s)", user.username, user.id)
    return (
        jsonify({"id": user.id, "username": user.username, "email": user.email}),
        200,
    )


@auth_bp.route("/api/profile", methods=["PUT"])
@login_required
def update_profile():
    user = get_current_user()
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    errors = {}
    if username is not None:
        sanitized_username = bleach.clean(username, tags=[], strip=True)
        if sanitized_username != username:
            errors["username"] = "Username cannot contain HTML or special tags."
        elif not sanitized_username.strip() or len(sanitized_username) < 3:
            errors["username"] = (
                "Username must be at least 3 characters and not empty after removing HTML."
            )
        elif (
            User.query.filter_by(username=sanitized_username).first()
            and sanitized_username != user.username
        ):
            errors["username"] = "Username already taken."
        else:
            user.username = sanitized_username
    if email:
        try:
            validate_email(email)
        except EmailNotValidError:
            errors["email"] = "Invalid email address."
        else:
            if User.query.filter_by(email=email).first() and email != user.email:
                errors["email"] = "Email already in use."
            else:
                user.email = email
    if errors:
        return jsonify({"error": errors}), 400
    db.session.commit()
    logger.info("Profile updated for user: %s (ID: %s)", user.username, user.id)
    return jsonify({"message": "Profile updated successfully."}), 200


@auth_bp.route("/api/password-reset/request", methods=["POST"])
def password_reset_request():
    logger.info("Password reset request endpoint accessed.")
    if not request.is_json:
        logger.error("Password reset request failed: Request must be JSON.")
        return error_response("Request must be JSON", 400)
    data = request.get_json()
    email = data.get("email")
    if not email or not email.strip():
        logger.error("Password reset request failed: Email is required.")
        send_email(
            "dummy@localhost",
            "Password Reset Request",
            "If this were real, you'd get a reset link.",
        )
        time.sleep(0.5)
        return error_response("Email is required", 400)
    user = User.query.filter_by(email=email.strip()).first()
    token = secrets.token_urlsafe(48)
    expiration_minutes = int(
        os.environ.get("PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES", 60)
    )
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiration_minutes)
    if user:
        prt = PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at)
        db.session.add(prt)
        db.session.commit()
        msg = (
            f"Password reset token generated for user_id={user.id} "
            f"(expires at {expires_at.isoformat()})"
        )
        logger.info(msg)
        frontend_base_url = os.environ.get("FRONTEND_BASE_URL", "http://localhost:3000")
        reset_link = (
            f"{frontend_base_url.rstrip('/')}/password-reset/confirm?token={token}"
        )
        email_body = render_password_reset_email(reset_link, expiration_minutes)
        email_sent = send_email(user.email, "Password Reset Request", email_body)
        if not email_sent:
            logger.error("Failed to send password reset email")
    else:
        send_email(
            "dummy@localhost",
            "Password Reset Request",
            "If this were real, you'd get a reset link.",
        )
        time.sleep(0.5)
    # Use current_app for config
    app_config = current_app.config if current_app else {}
    if app_config.get("DEBUG", False) or app_config.get("TESTING", False):
        return (
            jsonify(
                {
                    "message": (
                        f"Password reset email sent to {email}"
                        if user
                        else "Email not found, no reset sent"
                    ),
                    "token": (token if user else None),
                }
            ),
            200,
        )
    return (
        jsonify(
            {"message": "If the email exists, a password reset link will be sent."}
        ),
        200,
    )


@auth_bp.route("/api/password-reset/confirm", methods=["POST"])
def password_reset_confirm():
    logger.info("Password reset confirmation endpoint accessed.")
    if not request.is_json:
        logger.error("Password reset confirm failed: Request must be JSON.")
        return error_response("Request must be JSON", 400)
    data = request.get_json()
    token = data.get("token")
    new_password = data.get("new_password")
    if not token or not new_password:
        logger.error(
            "Password reset confirm failed: Token and new_password are required."
        )
        return error_response("Token and new_password are required", 400)
    prt = PasswordResetToken.query.filter_by(token=token).first()
    if not prt:
        logger.warning("Password reset confirm failed: Invalid token.")
        return error_response("Invalid or expired token", 400)
    if prt.used:
        logger.warning("Password reset confirm failed: Token already used.")
        return error_response("Invalid or expired token", 400)
    if prt.expires_at.tzinfo is None:
        expires_at_aware = prt.expires_at.replace(tzinfo=timezone.utc)
    else:
        expires_at_aware = prt.expires_at
    if expires_at_aware < datetime.now(timezone.utc):
        logger.warning("Password reset confirm failed: Token expired.")
        return error_response("Invalid or expired token", 400)
    user = db.session.get(User, prt.user_id)
    if not user:
        logger.error("Password reset confirm failed: User not found.")
        return error_response("Invalid or expired token", 400)
    if not is_strong_password(new_password):
        logger.error("Password reset confirm failed: Weak password.")
        return error_response(
            "Password must be at least 8 characters long and include "
            "uppercase, lowercase, numbers, and special characters.",
            400,
        )
    user.set_password(new_password)
    prt.used = True
    db.session.commit()
    logger.info("Password reset successful for user_id=%s", user.id)
    return jsonify({"message": "Password reset successful"}), 200


@auth_bp.route("/api/csrf-token", methods=["GET"])
def get_csrf_token():
    logger.info("CSRF token endpoint accessed.")
    token = generate_csrf_token()
    response = jsonify({"csrf_token": token})
    response.set_cookie(
        "_csrf_token", token, secure=True, httponly=True, samesite="Lax"
    )
    return response
