from models import db, task_dependencies, task_links

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
