import logging
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

# --- Extensions ---
db = SQLAlchemy()
logger = logging.getLogger(__name__)
# --- Association Tables ---
task_dependencies = db.Table(
    "task_dependencies",
    db.Column(
        "blocker_id",
        db.Integer,
        db.ForeignKey("task.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "blocked_id",
        db.Integer,
        db.ForeignKey("task.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

task_links = db.Table(
    "task_links",
    db.Column(
        "task_a_id",
        db.Integer,
        db.ForeignKey("task.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "task_b_id",
        db.Integer,
        db.ForeignKey("task.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# --- User Model ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(225), nullable=False)

    tasks = db.relationship(
        "Task", backref="user", lazy=True, cascade="all, delete-orphan"
    )
    projects = db.relationship(
        "Project", backref="user", lazy=True, cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# --- Project Model ---
class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )

    tasks = db.relationship(
        "Task", backref="project", lazy=True, cascade="all, delete-orphan"
    )

# --- Task Model ---
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime)
    start_date = db.Column(db.DateTime)
    priority = db.Column(db.Integer, default=1, nullable=False)
    recurrence = db.Column(db.String)
    completed = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("project.id", ondelete="SET NULL"),
        nullable=True,
    )
    parent_id = db.Column(
        db.Integer, db.ForeignKey("task.id", ondelete="CASCADE"), nullable=True
    )
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )
    subtasks = db.relationship(
        "Task",
        backref=db.backref("parent", remote_side=[id]),
        lazy=True,
        cascade="all, delete-orphan",
    )
    blocked_by = db.relationship(
        "Task",
        secondary=lambda: task_dependencies,
        primaryjoin=lambda: Task.id == task_dependencies.c.blocked_id,
        secondaryjoin=lambda: Task.id == task_dependencies.c.blocker_id,
        backref=db.backref("blocking", lazy="dynamic"),
        lazy="dynamic",
    )
    linked_tasks = db.relationship(
        "Task",
        secondary=lambda: task_links,
        primaryjoin=lambda: Task.id == task_links.c.task_a_id,
        secondaryjoin=lambda: Task.id == task_links.c.task_b_id,
        lazy="dynamic",
    )
    reminder_time = db.Column(db.DateTime, nullable=True)
    reminder_recurring = db.Column(db.String, nullable=True)
    reminder_snoozed_until = db.Column(db.DateTime, nullable=True)
    reminder_enabled = db.Column(db.Boolean, default=True, nullable=False)

# --- PasswordResetToken Model ---
class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    token = db.Column(db.String(128), unique=True, nullable=False)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)
    user = db.relationship(
        "User", backref=db.backref("password_reset_tokens", lazy=True)
    )

# --- Notification Model ---
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey("task.id"), nullable=True)
    title = db.Column(db.String(100), nullable=True)
    message = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    read = db.Column(db.Boolean, default=False, nullable=False)
    snoozed_until = db.Column(db.DateTime, nullable=True)
    type = db.Column(db.String(32), default="reminder", nullable=False)
    show_at = db.Column(db.DateTime, nullable=True)
    user = db.relationship("User", backref=db.backref("notifications", lazy=True))
    task = db.relationship("Task", backref=db.backref("notifications", lazy=True))