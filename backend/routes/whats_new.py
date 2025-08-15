from flask import Blueprint, json, jsonify
from utils import error_response
import os

whats_new_bp = Blueprint("whats_new", __name__)


@whats_new_bp.route("/api/releases/latest")
def get_latest_release():
    """Backup endpoint for getting the latest release changelog json in case vite fails"""
    try:
        whats_new_path = os.environ.get(
            "WHATS_NEW_JSON_PATH",
            os.path.join(os.path.dirname(__file__), "../../frontend/public/whats-new.json")
        )
        with open(whats_new_path) as f:
            return jsonify(json.load(f))
    except:
        return error_response("Failed to load latest release data", 500)
