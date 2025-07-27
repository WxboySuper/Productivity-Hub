# Debug: Print all registered routes at startup
def print_routes():
    print("\nRegistered routes:")
    for rule in app.url_map.iter_rules():
        print(f"{rule.methods} {rule}")


# ========================
# Imports
# ========================
import logging
import os
import sys
import warnings
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_migrate import Migrate
from models import Notification, Project, Task, db, logger
from routes.auth import auth_bp
from routes.projects import projects_bp
from routes.tasks_routes import tasks_bp
from utils import error_response, get_current_user, login_required

# --- Environment Loading ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DOTENV_PATH = os.path.join(BASE_DIR, ".env")
if not os.path.exists(DOTENV_PATH):
    print(f"ERROR: .env file not found at {DOTENV_PATH}. " "Application will exit.")
    sys.exit(1)
if not load_dotenv(DOTENV_PATH):
    print(
        f"ERROR: Failed to load .env file at {DOTENV_PATH}. " "Application will exit."
    )
    sys.exit(1)


app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY", "dev-secret-key-change-in-production"
)
db_path = os.path.join(BASE_DIR, "productivity_hub.db")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", f"sqlite:///{db_path}"
)
app.config["SESSION_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
app.config["SESSION_COOKIE_HTTPONLY"] = (
    True  # Prevent JavaScript access to session cookies
)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"  # Set SameSite policy for session cookies
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=8)  # Absolute timeout
app.config["SESSION_REFRESH_EACH_REQUEST"] = True  # Sliding expiration


# --- Global error handler for 404s on API routes ---
@app.errorhandler(404)
def handle_404(e):
    if request.path.startswith("/api/"):
        return error_response("Not found", 404)
    return e


# Register blueprints after app is created
app.register_blueprint(auth_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(tasks_bp)

# Print all registered routes for debugging
print_routes()

# --- Production Warning ---
if (
    os.environ.get("FLASK_ENV") == "production"
    or os.environ.get("ENVIRONMENT") == "production"
):
    warnings.warn(
        "WARNING: This app is running in production mode! "
        "Ensure all security settings are properly configured, "
        "including CSRF protection.",
        RuntimeWarning,
    )

logger.info("Flask app configuration is set up.")
db.init_app(app)
migrate = Migrate(app, db)

logger.info("SQLAlchemy is set up.")

# =========================
# Configuration & App Setup
# =========================


##
# Helper Functions
##
# --- Database Initialization ---
def init_db():
    """
    Initialize the database tables for the Flask app.
    Should be called within an app context.
    """
    logger.info("Initializing the database.")
    with app.app_context():
        db.create_all()
    logger.info("Database tables created.")


# --- CSRF Protection Handler ---
def csrf_protect():
    """
    Flask before_request handler for CSRF protection on state-changing requests
    Skips protection in testing mode and for login/register endpoints.
    Checks for a valid CSRF token in session and headers.
    Returns a JSON error response if the token is missing or invalid.
    """
    if app.config.get("TESTING", False):
        logger.debug("CSRF protection is disabled in TESTING mode.")
        return
    if request.method in ("POST", "PUT", "DELETE"):
        logger.debug("CSRF check")  # Short message to avoid E501
        # Accept both blueprint and non-blueprint endpoint names
        if request.endpoint in ("login", "register", "auth.login", "auth.register"):
            logger.debug("CSRF check skipped for login/register endpoint.")
            return

        # Get CSRF token from cookie (not session)
        token = request.cookies.get("_csrf_token")
        header_token = request.headers.get("X-CSRF-Token")

        cookie_str = token[:10] + "..." if token else "None"
        header_str = header_token[:10] + "..." if header_token else "None"
        logger.debug("CSRF cookie:")
        logger.debug(cookie_str)
        logger.debug("CSRF header:")
        logger.debug(header_str)
        if not token or token != header_token:
            logger.warning(
                "CSRF token missing or invalid. Cookie: %s, Header: %s",
                token,
                header_token,
            )
            return error_response("Invalid or missing CSRF token", 403)


def _validate_and_update_task_fields(task, data, user):
    """Validate and update task fields. Returns error string or None."""


##
# Route Definitions
##


app.before_request(csrf_protect)  # Register CSRF protection as a before_request handler


@app.route("/")
def home():
    """Home route."""
    logger.info("Home route accessed.")
    return "Welcome to the Productivity Hub Backend!"


# ========================
# Notification Endpoints
# ========================


@app.route("/api/notifications", methods=["GET"])
@login_required
def get_notifications():
    """Get all notifications for the current user."""
    logger.info("Notifications GET endpoint accessed.")
    user = get_current_user()
    notifications = (
        Notification.query.filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    notifications_data = []
    for notification in notifications:
        notification_dict = {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "read": notification.read,
            "created_at": notification.created_at.isoformat(),
            "task_id": notification.task_id,
        }
        # Include show_at if it exists
        if notification.show_at:
            notification_dict["show_at"] = notification.show_at.isoformat()
        # Include snoozed_until if it exists
        if hasattr(notification, "snoozed_until") and notification.snoozed_until:
            notification_dict["snoozed_until"] = notification.snoozed_until.isoformat()

        notifications_data.append(notification_dict)

    logger.info(
        "Returning %d notifications for user: %s",
        len(notifications_data),
        user.username,
    )
    return jsonify(notifications_data), 200


# --- Dismiss Notification ---


@app.route(
    "/api/notifications/<int:notification_id>/dismiss",
    methods=["POST"],
)
@login_required
def dismiss_notification(notification_id):
    """Mark a notification as read/dismissed."""
    logger.info(
        "Notification dismiss endpoint accessed for notification ID: %s",
        notification_id,
    )
    user = get_current_user()

    notification = Notification.query.filter_by(
        id=notification_id, user_id=user.id
    ).first()
    if not notification:
        logger.warning(
            "Notification not found or doesn't belong to user: %s",
            notification_id,
        )
        return jsonify({"error": "Notification not found"}), 404

    notification.read = True
    db.session.commit()

    logger.info("Notification %s dismissed by user: %s", notification_id, user.username)
    return jsonify({"success": True}), 200


# --- Snooze Notification ---


@app.route("/api/notifications/<int:notification_id>/snooze", methods=["POST"])
@login_required
def snooze_notification(notification_id):
    """Snooze a notification for a specified duration."""
    logger.info(
        "Notification snooze endpoint accessed for notification ID: %s",
        notification_id,
    )
    user = get_current_user()

    notification = Notification.query.filter_by(
        id=notification_id, user_id=user.id
    ).first()
    if not notification:
        logger.warning(
            "Notification not found or doesn't belong to user: %s",
            notification_id,
        )
        return jsonify({"error": "Notification not found"}), 404

    data = request.get_json()
    if not data or "minutes" not in data:
        return jsonify({"error": "Minutes parameter is required"}), 400

    try:
        minutes = int(data["minutes"])
        if minutes <= 0:
            return jsonify({"error": "Minutes must be positive"}), 400

        # Calculate snooze time
        snooze_until = datetime.now(timezone.utc) + timedelta(minutes=minutes)

        # Update notification with snooze time
        if not hasattr(notification, "snoozed_until"):
            # If the column doesn't exist, we'll need to add it to the model
            logger.warning("Notification model missing snoozed_until field")
            return (
                jsonify({"error": "Snooze functionality not available"}),
                500,
            )

        notification.snoozed_until = snooze_until
        db.session.commit()

        logger.info(
            "Notification %s snoozed for %d minutes by user: %s",
            notification_id,
            minutes,
            user.username,
        )
        return (
            jsonify({"success": True, "snoozed_until": snooze_until.isoformat()}),
            200,
        )

    except (ValueError, TypeError):
        return jsonify({"error": "Invalid minutes value"}), 400


# ==================
# Project Endpoints
# ==================


if __name__ == "__main__":  # pragma: no cover
    init_db()  # pragma: no cover
    logger.info("Database initialized.")  # pragma: no cover
    logger.info("Starting Flask app...")  # pragma: no cover
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"  # pragma: no cover
    app.run(debug=debug_mode)  # pragma: no cover
