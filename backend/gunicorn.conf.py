# Gunicorn configuration file for production deployment
# Usage: gunicorn -c gunicorn.conf.py app:app

import os
import multiprocessing

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
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"

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
    errorlog = "-"   # stderr