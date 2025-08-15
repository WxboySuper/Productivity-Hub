from flask import jsonify


def error_response(message, code):
    from models import logger

    logger.error(message)
    # For 400-level errors, return the specific message
    return jsonify({"error": message}), code

    # (Removed: _validate_dates is now in helpers.task_helpers)
