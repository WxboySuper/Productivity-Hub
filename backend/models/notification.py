from models import db


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
