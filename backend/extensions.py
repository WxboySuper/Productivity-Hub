from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import logging

db = SQLAlchemy()
migrate = Migrate()
logger = logging.getLogger(__name__)
