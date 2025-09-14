# Gunicorn configuration file for production deployment
# Usage: gunicorn -c gunicorn.conf.py app:app

import multiprocessing
import os

# Server socket
bind = "0.0.0.0:5000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests, with up to 50% jitter
max_requests = 1000
max_requests_jitter = 50

# Logging
loglevel = "info"

# Use environment variables or defaults for log paths
accesslog = os.getenv("GUNICORN_ACCESS_LOG", "/var/log/gunicorn/access.log")
errorlog = os.getenv("GUNICORN_ERROR_LOG", "/var/log/gunicorn/error.log")

# Ensure log directory exists if not logging to stdout/stderr
for log_path in [accesslog, errorlog]:
    if log_path not in ("-", None):
        log_dir = os.path.dirname(log_path)
        if log_dir and not os.path.exists(log_dir):
            try:
                os.makedirs(log_dir, exist_ok=True)
            except Exception:
                # Fallback to stdout/stderr if directory creation fails
                if log_path == accesslog:
                    accesslog = "-"
                elif log_path == errorlog:
                    errorlog = "-"

# Process naming
proc_name = "productivity-hub"

# User and group to run as (set in production)
# user = "www-data"
# group = "www-data"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# SSL (if terminating SSL at Gunicorn level)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

# Development overrides
if os.getenv("FLASK_DEBUG") == "1":
    bind = "127.0.0.1:5000"
    workers = 1
    reload = True
    loglevel = "debug"
    accesslog = "-"  # stdout
    errorlog = "-"  # stderr
