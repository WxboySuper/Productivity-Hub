from flask import jsonify


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
