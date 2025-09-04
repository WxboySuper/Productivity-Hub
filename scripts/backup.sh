#!/bin/bash

# Backup script for Productivity Hub
# This script creates backups of the database and application files

set -e

# Configuration
BACKUP_BASE_DIR="${BACKUP_DIR:-/var/backups/productivity-hub}"
APP_DIR="${APP_DIR:-/var/www/productivity-hub/current}"
DB_PATH="${APP_DIR}/backend/productivity_hub.db"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

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

# Create backup directories
setup_backup_dirs() {
    mkdir -p "$BACKUP_BASE_DIR"/{daily,weekly,monthly}
    mkdir -p "$BACKUP_BASE_DIR"/database
    mkdir -p "$BACKUP_BASE_DIR"/config
}

# Database backup
backup_database() {
    local backup_type="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_BASE_DIR/database/${backup_type}_backup_${timestamp}.db"
    
    log "Creating database backup: $backup_file"
    
    if [ -f "$DB_PATH" ]; then
        # For SQLite, we can use .backup command or simple copy with WAL mode handling
        sqlite3 "$DB_PATH" ".backup '$backup_file'"
        
        # Compress the backup
        gzip "$backup_file"
        log "Database backup completed: ${backup_file}.gz"
    else
        warn "Database file not found at $DB_PATH"
    fi
}

# Application files backup
backup_application() {
    local backup_type="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_BASE_DIR/${backup_type}/app_backup_${timestamp}.tar.gz"
    
    log "Creating application backup: $backup_file"
    
    if [ -d "$APP_DIR" ]; then
        tar -czf "$backup_file" \
            --exclude="*.pyc" \
            --exclude="__pycache__" \
            --exclude="node_modules" \
            --exclude="*.log" \
            --exclude="venv" \
            --exclude="dist" \
            --exclude="build" \
            -C "$(dirname "$APP_DIR")" \
            "$(basename "$APP_DIR")"
        
        log "Application backup completed: $backup_file"
    else
        warn "Application directory not found at $APP_DIR"
    fi
}

# Configuration backup
backup_config() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_BASE_DIR/config/config_backup_${timestamp}.tar.gz"
    
    log "Creating configuration backup: $backup_file"
    
    # Backup important config files (excluding sensitive data)
    tar -czf "$backup_file" \
        -C / \
        --exclude="*.key" \
        --exclude=".env" \
        --exclude="*password*" \
        etc/nginx/sites-available/productivity-hub 2>/dev/null || true \
        etc/systemd/system/productivity-hub.service 2>/dev/null || true
    
    log "Configuration backup completed: $backup_file"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    find "$BACKUP_BASE_DIR" -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_BASE_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    log "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    case "$backup_file" in
        *.tar.gz)
            if tar -tzf "$backup_file" >/dev/null 2>&1; then
                log "✓ Backup integrity verified: $backup_file"
            else
                error "✗ Backup integrity check failed: $backup_file"
            fi
            ;;
        *.gz)
            if gzip -t "$backup_file" 2>/dev/null; then
                log "✓ Backup integrity verified: $backup_file"
            else
                error "✗ Backup integrity check failed: $backup_file"
            fi
            ;;
    esac
}

# List available backups
list_backups() {
    log "Available backups:"
    echo
    
    for type in daily weekly monthly database config; do
        echo "=== $type backups ==="
        ls -lh "$BACKUP_BASE_DIR/$type"/ 2>/dev/null || echo "No backups found"
        echo
    done
}

# Restore database from backup
restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Please specify backup file to restore from"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Restoring database from: $backup_file"
    
    # Stop the application first
    warn "Make sure to stop the application before restoring!"
    read -p "Continue with restore? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Restore cancelled"
        exit 0
    fi
    
    # Backup current database
    if [ -f "$DB_PATH" ]; then
        cp "$DB_PATH" "${DB_PATH}.pre-restore-$(date +%Y%m%d_%H%M%S)"
        log "Current database backed up"
    fi
    
    # Restore from backup
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" > "$DB_PATH"
    else
        cp "$backup_file" "$DB_PATH"
    fi
    
    log "Database restored successfully"
}

# Usage information
usage() {
    echo "Usage: $0 [command] [options]"
    echo
    echo "Commands:"
    echo "  daily          Create daily backup"
    echo "  weekly         Create weekly backup"
    echo "  monthly        Create monthly backup"
    echo "  list           List available backups"
    echo "  restore <file> Restore database from backup file"
    echo "  verify <file>  Verify backup integrity"
    echo "  cleanup        Remove old backups"
    echo "  --help         Show this help message"
    echo
    echo "Environment variables:"
    echo "  BACKUP_DIR     Base backup directory (default: /var/backups/productivity-hub)"
    echo "  APP_DIR        Application directory (default: /var/www/productivity-hub/current)"
    echo "  RETENTION_DAYS Number of days to keep backups (default: 30)"
}

# Main function
main() {
    case "${1:-daily}" in
        daily)
            setup_backup_dirs
            backup_database "daily"
            backup_application "daily"
            cleanup_old_backups
            ;;
        weekly)
            setup_backup_dirs
            backup_database "weekly"
            backup_application "weekly"
            backup_config
            cleanup_old_backups
            ;;
        monthly)
            setup_backup_dirs
            backup_database "monthly"
            backup_application "monthly"
            backup_config
            cleanup_old_backups
            ;;
        list)
            list_backups
            ;;
        restore)
            restore_database "$2"
            ;;
        verify)
            verify_backup "$2"
            ;;
        cleanup)
            cleanup_old_backups
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