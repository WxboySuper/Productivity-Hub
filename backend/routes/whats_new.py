from flask import Blueprint, json, jsonify, requests
from utils import error_response

whats_new_bp = Blueprint("whats_new", __name__)


@whats_new_bp.route("/api/releases/latest")
def get_latest_release():
    """Backup endpoint for getting the latest release changelog json in case vite fails"""
    try:
        with open("e:/Productivity Hub/frontend/public/whats-new.json") as f:
            return jsonify(json.load(f))
    except:
        return error_response("Failed to load latest release data", 500)
