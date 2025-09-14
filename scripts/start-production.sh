#!/bin/bash

# Production startup script for Productivity Hub
# This script starts both frontend and backend in production mode

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOG_DIR="/var/log/productivity-hub"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check requirements
check_requirements() {
    log "Checking requirements..."
    
    # Check if running as appropriate user
    if [ "$EUID" -eq 0 ]; then
        warn "Running as root. Consider running as a non-root user in production."
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is required but not installed"
    fi
    
    # Check Node.js for frontend build
    if ! command -v node &> /dev/null; then
        error "Node.js is required but not installed"
    fi
    
    # Check if gunicorn is available
    if ! python3 -c "import gunicorn" 2>/dev/null; then
        error "Gunicorn is not installed. Run: pip install -r requirements.txt"
    fi
}

# Setup log directories
setup_logging() {
    log "Setting up logging directories..."
    if ! command -v sudo &> /dev/null; then
        error "sudo is required to create and modify system log directories."
    fi
    sudo mkdir -p "$LOG_DIR"
    if [ $? -ne 0 ]; then
        error "Failed to create $LOG_DIR. Please check your permissions."
    fi
    sudo mkdir -p /var/log/gunicorn
    if [ $? -ne 0 ]; then
        error "Failed to create /var/log/gunicorn. Please check your permissions."
    fi
    sudo chown -R "$USER:$USER" "$LOG_DIR" 2>/dev/null || true
    if [ $? -ne 0 ]; then
        error "Failed to set ownership for $LOG_DIR. Please check your permissions."
    fi
    sudo chown -R "$USER:$USER" /var/log/gunicorn 2>/dev/null || true
    if [ $? -ne 0 ]; then
        error "Failed to set ownership for /var/log/gunicorn. Please check your permissions."
    fi
}

# Setup Python virtual environment
setup_backend() {
    log "Setting up backend environment..."
    cd "$BACKEND_DIR"
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        log "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install -r ../requirements.txt
    
    # Run database migrations
    if [ -f "app.py" ]; then
        log "Running database migrations..."
        python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Database initialized')
" || warn "Database initialization failed"
    fi
}

# Build frontend
build_frontend() {
    log "Building frontend..."
    cd "$FRONTEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        log "Installing frontend dependencies..."
        npm install
    fi
    
    log "Building production frontend..."
    npm run build
}

# Start backend with Gunicorn
start_backend() {
    log "Starting backend with Gunicorn..."
    cd "$BACKEND_DIR"
    
    # Source the virtual environment
    source venv/bin/activate
    
    # Start Gunicorn
    if [ -f "gunicorn.conf.py" ]; then
        gunicorn -c gunicorn.conf.py app:app &
        BACKEND_PID=$!
        echo $BACKEND_PID > /tmp/productivity-hub-backend.pid
        log "Backend started with PID: $BACKEND_PID"
    else
        error "Gunicorn configuration file not found"
    fi
}

# Start frontend server (for development/testing)
start_frontend_dev() {
    log "Starting frontend development server..."
    cd "$FRONTEND_DIR"
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/productivity-hub-frontend.pid
    log "Frontend development server started with PID: $FRONTEND_PID"
}

# Check if services are running
check_services() {
    log "Checking service health..."
    
    # Check backend
    sleep 3
    if curl -f http://localhost:5000/ >/dev/null 2>&1; then
        log "✓ Backend is responding"
    else
        error "✗ Backend is not responding"
    fi
    
    # If frontend dev server is running, check it too
    if [ -f "/tmp/productivity-hub-frontend.pid" ]; then
        if curl -f http://localhost:3000/ >/dev/null 2>&1; then
            log "✓ Frontend development server is responding"
        else
            warn "✗ Frontend development server is not responding"
        fi
    fi
}

# Stop services
stop_services() {
    log "Stopping services..."
    
    # Stop backend
    if [ -f "/tmp/productivity-hub-backend.pid" ]; then
        BACKEND_PID=$(cat /tmp/productivity-hub-backend.pid)
        if kill -0 "$BACKEND_PID" 2>/dev/null; then
            kill "$BACKEND_PID"
            log "Backend stopped"
        fi
        rm -f /tmp/productivity-hub-backend.pid
    fi
    
    # Stop frontend
    if [ -f "/tmp/productivity-hub-frontend.pid" ]; then
        FRONTEND_PID=$(cat /tmp/productivity-hub-frontend.pid)
        if kill -0 "$FRONTEND_PID" 2>/dev/null; then
            kill "$FRONTEND_PID"
            log "Frontend development server stopped"
        fi
        rm -f /tmp/productivity-hub-frontend.pid
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [command]"
    echo "Commands:"
    echo "  start         Start all services (default)"
    echo "  stop          Stop all services"
    echo "  restart       Restart all services"
    echo "  status        Check service status"
    echo "  backend-only  Start only the backend"
    echo "  build         Build frontend and setup backend"
    echo "  --help        Show this help message"
}

# Handle signals for graceful shutdown
trap 'stop_services; exit 0' SIGTERM SIGINT

# Main function
main() {
    case "${1:-start}" in
        start)
            check_requirements
            setup_logging
            setup_backend
            build_frontend
            start_backend
            check_services
            log "Productivity Hub started successfully!"
            log "Backend: http://localhost:5000"
            log "To stop services, run: $0 stop"
            ;;
        start-dev)
            check_requirements
            setup_logging
            setup_backend
            build_frontend
            start_backend
            start_frontend_dev
            check_services
            log "Productivity Hub started in development mode!"
            log "Backend: http://localhost:5000"
            log "Frontend: http://localhost:3000"
            log "To stop services, run: $0 stop"
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            sleep 2
            main start
            ;;
        status)
            check_services
            ;;
        backend-only)
            check_requirements
            setup_logging
            setup_backend
            start_backend
            check_services
            ;;
        build)
            check_requirements
            setup_backend
            build_frontend
            log "Build completed successfully!"
            ;;
        --help)
            usage
            ;;
        *)
            error "Unknown command: $1. Use --help for usage information."
            ;;
    esac
}

main "$@"