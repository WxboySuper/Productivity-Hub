from flask import Blueprint, jsonify, request
from models import Project, db
from utils import error_response, get_current_user, login_required

projects_bp = Blueprint("projects", __name__)

# --- Get All Projects ---
@projects_bp.route("/api/projects", methods=["GET"])
@login_required
def get_projects():
	"""Get all projects for the current user, paginated."""
	user = get_current_user()
	try:
		page = int(request.args.get("page", 1))
		per_page = int(request.args.get("per_page", 20))
	except ValueError:
		return error_response("Invalid pagination parameters.", 400)
	per_page = max(1, min(per_page, 100))
	query = Project.query.filter_by(user_id=user.id).order_by(Project.created_at.desc())
	pagination = query.paginate(page=page, per_page=per_page, error_out=False)
	projects_data = []
	for project in pagination.items:
		projects_data.append({
			"id": project.id,
			"name": project.name,
			"description": project.description,
			"created_at": project.created_at.isoformat(),
			"updated_at": project.updated_at.isoformat(),
		})
	return jsonify({
		"projects": projects_data,
		"total": pagination.total,
		"pages": pagination.pages,
		"current_page": pagination.page,
		"per_page": pagination.per_page,
	}), 200

# --- Create Project ---
@projects_bp.route("/api/projects", methods=["POST"])
@login_required
def create_project():
	"""Create a new project for the current user."""
	user = get_current_user()
	if not request.is_json:
		return error_response("Request must be JSON", 400)
	data = request.get_json()
	name = data.get("name")
	description = data.get("description", "")
	if not name or not name.strip():
		return error_response("Project name is required", 400)
	try:
		project = Project(
			name=name.strip(),
			description=description.strip() if description else "",
			user_id=user.id,
		)
		db.session.add(project)
		db.session.commit()
		return jsonify({
			"id": project.id,
			"name": project.name,
			"description": project.description,
			"created_at": project.created_at.isoformat(),
			"updated_at": project.updated_at.isoformat(),
		}), 201
	except Exception as e:
		db.session.rollback()
		return error_response("Failed to create project", 500)

# --- Get Project by ID ---
@projects_bp.route("/api/projects/<int:project_id>", methods=["GET"])
@login_required
def get_project(project_id):
	"""Get a specific project by ID."""
	user = get_current_user()
	project = Project.query.filter_by(id=project_id, user_id=user.id).first()
	if not project:
		return error_response("Project not found", 404)
	return jsonify({
		"id": project.id,
		"name": project.name,
		"description": project.description,
		"created_at": project.created_at.isoformat(),
		"updated_at": project.updated_at.isoformat(),
	}), 200

# --- Update Project ---
@projects_bp.route("/api/projects/<int:project_id>", methods=["PUT"])
@login_required
def update_project(project_id):
	"""Update an existing project."""
	user = get_current_user()
	project = Project.query.filter_by(id=project_id, user_id=user.id).first()
	if not project:
		return error_response("Project not found", 404)
	if not request.is_json:
		return error_response("Request must be JSON", 400)
	data = request.get_json()
	name = data.get("name")
	description = data.get("description")
	if not name or not name.strip():
		return error_response("Project name is required", 400)
	try:
		project.name = name.strip()
		if description is not None:
			project.description = description.strip()
		db.session.commit()
		return jsonify({
			"id": project.id,
			"name": project.name,
			"description": project.description,
			"created_at": project.created_at.isoformat(),
			"updated_at": project.updated_at.isoformat(),
		}), 200
	except Exception as e:
		db.session.rollback()
		return error_response("Failed to update project", 500)

# --- Delete Project ---
@projects_bp.route("/api/projects/<int:project_id>", methods=["DELETE"])
@login_required
def delete_project(project_id):
	"""Delete an existing project and all its tasks."""
	user = get_current_user()
	project = Project.query.filter_by(id=project_id, user_id=user.id).first()
	if not project:
		return error_response("Project not found", 404)
	try:
		db.session.delete(project)
		db.session.commit()
		return jsonify({"message": "Project deleted successfully"}), 200
	except Exception as e:
		db.session.rollback()
		return error_response("Failed to delete project", 500)
