from flask import Blueprint, jsonify, request
from models import Task, db
from utils import error_response, get_current_user, login_required, _extract_task_fields, _serialize_task, _validate_and_update_task_fields
from datetime import datetime

tasks_bp = Blueprint("tasks", __name__)

# --- List Tasks ---
@tasks_bp.route("/api/tasks", methods=["GET"])
@login_required
def list_tasks():
	"""List all tasks for the current user, paginated."""
	user = get_current_user()
	try:
		page = int(request.args.get("page", 1))
		per_page = int(request.args.get("per_page", 20))
	except ValueError:
		return error_response("Invalid pagination parameters.", 400)
	per_page = max(1, min(per_page, 100))
	query = Task.query.filter_by(user_id=user.id).order_by(Task.created_at.desc())
	pagination = query.paginate(page=page, per_page=per_page, error_out=False)
	tasks_data = []
	for task in pagination.items:
		task_dict = _serialize_task(task)
		# Add subtasks
		task_dict["subtasks"] = [_serialize_task(subtask) for subtask in task.subtasks]
		tasks_data.append(task_dict)
	return jsonify({
		"tasks": tasks_data,
		"total": pagination.total,
		"pages": pagination.pages,
		"current_page": pagination.page,
		"per_page": pagination.per_page,
	}), 200

# --- Create Task ---
@tasks_bp.route("/api/tasks", methods=["POST"])
@login_required
def create_task():
	"""Create a new task for the current user."""
	user = get_current_user()
	if not request.is_json:
		return error_response("Request must be JSON", 400)
	data = request.get_json()
	fields, err = _extract_task_fields(data, user)
	if err:
		return error_response(err, 400)
	try:
		task = Task(
			title=fields["title"],
			description=fields["description"],
			user_id=user.id,
			project_id=fields["project_id"],
			parent_id=fields["parent_id"],
			priority=fields["priority"],
		)
		if fields["due_date"]:
			task.due_date = fields["due_date"]
		if fields["start_date"]:
			task.start_date = fields["start_date"]
		if fields["recurrence"]:
			task.recurrence = fields["recurrence"]
		db.session.add(task)
		db.session.commit()
		return jsonify(_serialize_task(task)), 201
	except Exception as e:
		db.session.rollback()
		return error_response("Failed to create task", 500)

# --- Get Task by ID ---
@tasks_bp.route("/api/tasks/<int:task_id>", methods=["GET"])
@login_required
def get_task(task_id):
	"""Get a specific task by ID."""
	user = get_current_user()
	task = Task.query.filter_by(id=task_id, user_id=user.id).first()
	if not task:
		return error_response("Task not found", 404)
	task_dict = _serialize_task(task)
	# Add subtasks
	task_dict["subtasks"] = [_serialize_task(subtask) for subtask in task.subtasks]
	return jsonify(task_dict), 200

# --- Update Task ---
@tasks_bp.route("/api/tasks/<int:task_id>", methods=["PUT"])
@login_required
def update_task(task_id):
	"""Update an existing task."""
	user = get_current_user()
	task = Task.query.filter_by(id=task_id, user_id=user.id).first()
	if not task:
		return error_response("Task not found", 404)
	if not request.is_json:
		return error_response("Request must be JSON", 400)
	data = request.get_json()
	try:
		err = _validate_and_update_task_fields(task, data, user)
		if err:
			return error_response(err, 400)
		db.session.commit()
		task_dict = _serialize_task(task)
		return jsonify(task_dict), 200
	except Exception as e:
		db.session.rollback()
		return error_response("Failed to update task", 500)

# --- Delete Task ---
@tasks_bp.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
	"""Delete an existing task and all its subtasks."""
	user = get_current_user()
	task = Task.query.filter_by(id=task_id, user_id=user.id).first()
	if not task:
		return error_response("Task not found", 404)
	try:
		db.session.delete(task)
		db.session.commit()
		return jsonify({"message": "Task deleted successfully"}), 200
	except Exception as e:
		db.session.rollback()
		return error_response("Failed to delete task", 500)
tasks_bp = Blueprint("tasks", __name__)
