from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from helpers.auth_helpers import get_current_user, login_required
from helpers.notification_helpers import serialize_notification, validate_snooze_minutes
from models import db, logger
from models.notification import Notification
from utils import error_response

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/api/notifications", methods=["GET"])
@login_required
def get_notifications():
    logger.info("Notifications GET endpoint accessed.")
    user = get_current_user()
    notifications = (
        Notification.query.filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    notifications_data = [
        serialize_notification(notification) for notification in notifications
    ]

    logger.info(
        "Returning %d notifications for user: %s",
        len(notifications_data),
        user.username,
    )
    return jsonify(notifications_data), 200


@notifications_bp.route(
    "/api/notifications/<int:notification_id>/dismiss",
    methods=["POST"],
)
@login_required
def dismiss_notification(notification_id):
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


@notifications_bp.route(
    "/api/notifications/<int:notification_id>/snooze", methods=["POST"]
)
@login_required
def snooze_notification(notification_id):
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
    minutes, error = validate_snooze_minutes(data)
    if error:
        return jsonify({"error": error[0]}), error[1]

    snooze_until = datetime.now(timezone.utc) + timedelta(minutes=minutes)

    if not hasattr(notification, "snoozed_until"):
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
