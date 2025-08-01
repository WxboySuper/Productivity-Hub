
import logging
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
logger = logging.getLogger(__name__)

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
