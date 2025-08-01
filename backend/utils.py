import re
import secrets
from datetime import datetime
from functools import wraps

from flask import jsonify, request, session
from helpers.task_helpers import (
    _extract_task_fields,
    _serialize_task,
    _validate_and_update_task_fields,
    _validate_dates,
    parse_date,
    update_task_completed,
    update_task_description,
    update_task_due_date,
    update_task_priority,
    update_task_project,
    update_task_recurrence,
    update_task_start_date,
    update_task_title,
    validate_title,
)
from helpers.user_helpers import validate_parent_id, validate_project_id
from models import db
from models.user import User


def error_response(message, code):
    from models import logger

    logger.error(message)
    if code >= 500:
        return (
            jsonify(
                {"error": "An internal server error occurred. Please try again later."}
            ),
            code,
        )
    # For 400-level errors, return the specific message
    return jsonify({"error": message}), code

    # (Removed: _validate_dates is now in helpers.task_helpers)
