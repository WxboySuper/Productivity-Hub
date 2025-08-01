"""
Notification helper functions for Productivity Hub backend.
"""


def serialize_notification(notification):
    """Serialize a Notification SQLAlchemy object to a dict for API response."""
    notification_dict = {
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "read": notification.read,
        "created_at": notification.created_at.isoformat(),
        "task_id": notification.task_id,
    }
    if notification.show_at:
        notification_dict["show_at"] = notification.show_at.isoformat()
    if hasattr(notification, "snoozed_until") and notification.snoozed_until:
        notification_dict["snoozed_until"] = notification.snoozed_until.isoformat()
    return notification_dict


def validate_snooze_minutes(data):
    """Validate and extract snooze minutes from request data."""
    if not data or "minutes" not in data:
        return None, ("Minutes parameter is required", 400)
    try:
        minutes = int(data["minutes"])
        if minutes <= 0:
            return None, ("Minutes must be positive", 400)
        return minutes, None
    except (ValueError, TypeError):
        return None, ("Invalid minutes value", 400)
