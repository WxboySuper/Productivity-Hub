from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import logging
from email_validator import validate_email, EmailNotValidError
from werkzeug.security import generate_password_hash, check_password_hash
import re

# Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(threadName)s : %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("Starting Productivity Hub Backend...")
logger.info("Logging is configured.")

# Flask Application Setup
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///productivity_hub.db')
logger.info("Flask app configuration is set up.")

db = SQLAlchemy(app)
migrate = Migrate(app, db)

logger.info("SQLAlchemy is set up.")

# Example Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(225), nullable=False)

    tasks = db.relationship('Task', backref='user', lazy=True, cascade='all, delete-orphan')
    projects = db.relationship('Project', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime)
    priority = db.Column(db.Integer, default=1, nullable=False)
    completed = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')

def init_db():
    """Initialize the database."""
    with app.app_context():
        db.create_all()

def is_strong_password(password):
    """Check if the password is strong."""
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True

@app.route('/')
def home():
    """Home route."""
    logger.info("Home route accessed.")
    return "Welcome to the Productivity Hub Backend!"

@app.route('/api/register', methods=['POST'])
def register():
    """User registration endpoint."""
    logger.info("Register endpoint accessed.")

    if not request.is_json:
        logger.error("Request must be JSON.")
        return jsonify({"error": "Content-Type must be application/json"}), 400

    data = request.get_json()

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Validate Input
    if not username or not email or not password or not username.strip() or not email.strip() or not password.strip():
        logger.error("Missing required fields: username, email, or password.")
        return jsonify({"error": "Missing required fields"}), 400

    # Validate Email
    try:
        validate_email(email)
        logger.info("Email %s is valid.", email)
    except EmailNotValidError as e:
        logger.error("Invalid email: %s", e)
        return jsonify({"error": str(e)}), 400

    # Validate Password Strength
    if not is_strong_password(password):
        logger.error("Weak password provided.")
        return jsonify({"error": "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters."}), 400

    # Remove pre-check for existing user and rely on DB constraints
    try:
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error("User registration failed: %s", e)
        # Check for unique constraint violation
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({"error": "username or email already exists"}), 400
        return jsonify({"error": "Registration failed"}), 500

    logger.info("User %s registered successfully.", username)
    return jsonify({"message": "User registered successfully"}), 201

if __name__ == '__main__':
    init_db()
    logger.info("Database initialized.")
    logger.info("Starting Flask app...")
    app.run(debug=True)