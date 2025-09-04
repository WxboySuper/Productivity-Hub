#!/bin/bash

# Production deployment script for Productivity Hub
# This script efficiently deploys only changed files to the production server

set -e  # Exit on any error

# Configuration
REMOTE_HOST="${DEPLOY_HOST:-your-server.com}"
REMOTE_USER="${DEPLOY_USER:-ubuntu}"
REMOTE_PATH="${DEPLOY_PATH:-/var/www/productivity-hub}"
BACKUP_DIR="${REMOTE_PATH}/backups"
LOG_FILE="/tmp/deploy-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Check if we have SSH access
check_ssh_access() {
    log "Checking SSH access to $REMOTE_USER@$REMOTE_HOST..."
    if ! ssh -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        error "Cannot connect to $REMOTE_USER@$REMOTE_HOST. Please check your SSH configuration."
    fi
}

# Create backup
create_backup() {
    log "Creating backup on remote server..."
    ssh "$REMOTE_USER@$REMOTE_HOST" "
        mkdir -p $BACKUP_DIR
        if [ -d '$REMOTE_PATH/current' ]; then
            cp -r $REMOTE_PATH/current $BACKUP_DIR/backup-\$(date +%Y%m%d-%H%M%S)
            # Keep only last 5 backups
            cd $BACKUP_DIR && ls -t | tail -n +6 | xargs -r rm -rf
        fi
    "
}

# Deploy backend changes
deploy_backend() {
    log "Deploying backend changes..."
    
    # Sync only backend files that have changed
    rsync -avz --delete \
        --exclude '*.pyc' \
        --exclude '__pycache__' \
        --exclude '.env' \
        --exclude '*.db' \
        --exclude 'logs/' \
        backend/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/current/backend/"
    
    # Install/update dependencies
    ssh "$REMOTE_USER@$REMOTE_HOST" "
        cd $REMOTE_PATH/current/backend
        source venv/bin/activate
        pip install -r requirements.txt
    "
}

# Deploy frontend changes
deploy_frontend() {
    log "Building and deploying frontend..."
    
    # Build frontend locally
    cd frontend
    npm run build
    cd ..
    
    # Sync built frontend
    rsync -avz --delete \
        frontend/dist/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/current/frontend/dist/"
}

# Restart services
restart_services() {
    log "Restarting services..."
    ssh "$REMOTE_USER@$REMOTE_HOST" "
        sudo systemctl restart productivity-hub
        sudo systemctl restart nginx
    "
}

# Health check
health_check() {
    log "Performing health check..."
    sleep 5  # Give services time to start
    
    if ssh "$REMOTE_USER@$REMOTE_HOST" "curl -f http://localhost:5000/ >/dev/null 2>&1"; then
        log "Backend health check passed"
    else
        error "Backend health check failed"
    fi
}

# Main deployment function
main() {
    log "Starting deployment to $REMOTE_HOST..."
    
    # Validate environment
    if [ -z "$DEPLOY_HOST" ] || [ "$DEPLOY_HOST" = "your-server.com" ]; then
        error "Please set DEPLOY_HOST environment variable"
    fi
    
    # Pre-deployment checks
    check_ssh_access
    
    # Create backup
    create_backup
    
    # Deploy components
    deploy_backend
    deploy_frontend
    
    # Restart services
    restart_services
    
    # Verify deployment
    health_check
    
    log "Deployment completed successfully!"
    log "Log saved to: $LOG_FILE"
}

# Show usage
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --backend-only Deploy only backend changes"
    echo "  --frontend-only Deploy only frontend changes"
    echo ""
    echo "Environment variables:"
    echo "  DEPLOY_HOST    Remote server hostname (required)"
    echo "  DEPLOY_USER    Remote server user (default: ubuntu)"
    echo "  DEPLOY_PATH    Remote server path (default: /var/www/productivity-hub)"
    echo ""
    echo "Example:"
    echo "  DEPLOY_HOST=myserver.com ./scripts/deploy.sh"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    --backend-only)
        check_ssh_access
        create_backup
        deploy_backend
        restart_services
        health_check
        ;;
    --frontend-only)
        check_ssh_access
        deploy_frontend
        ssh "$REMOTE_USER@$REMOTE_HOST" "sudo systemctl reload nginx"
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        ;;
esac