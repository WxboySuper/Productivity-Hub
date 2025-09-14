#!/bin/bash

# Enhanced backup script for GitHub Actions deployment workflow
# This script provides backup functionality with integrity checking and rollback capabilities

set -e

# Configuration with environment variable support
BACKUP_BASE_DIR="${BACKUP_DIR:-/var/backups/productivity-hub}"
APP_DIR="${APP_DIR:-/var/www/productivity-hub/current}"
RELEASES_DIR="${RELEASES_DIR:-/var/www/productivity-hub/releases}"
DB_PATH="${APP_DIR}/backend/productivity_hub.db"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_PREFIX="${BACKUP_PREFIX:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Create backup directories with proper structure
setup_backup_dirs() {
    mkdir -p "$BACKUP_BASE_DIR"/{daily,weekly,monthly,deployment,database,config}
    
    # Set proper permissions
    chmod 755 "$BACKUP_BASE_DIR"
    chmod 700 "$BACKUP_BASE_DIR"/{database,config}
    
    log "Backup directories initialized"
}

# Deployment-specific backup for atomic deployments
backup_deployment() {
    local backup_tag="${1:-$(date +%Y%m%d_%H%M%S)}"
    local backup_type="${2:-deployment}"
    
    log "Creating deployment backup with tag: $backup_tag"
    
    setup_backup_dirs
    
    local backup_dir="$BACKUP_BASE_DIR/$backup_type"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/${BACKUP_PREFIX}deployment_backup_${backup_tag}_${timestamp}.tar.gz"
    
    # Create comprehensive backup including current state
    if [ -d "$APP_DIR" ]; then
        log "Backing up current deployment state..."
        
        # Create backup manifest
        local manifest_file="$backup_dir/manifest_${backup_tag}_${timestamp}.txt"
        {
            echo "# Deployment Backup Manifest"
            echo "Backup Tag: $backup_tag"
            echo "Timestamp: $timestamp"
            echo "App Directory: $APP_DIR"
            echo "Backup File: $backup_file"
            echo "Host: $(hostname)"
            echo "User: $(whoami)"
            echo "Git Commit: $(cd "$APP_DIR" 2>/dev/null && git rev-parse HEAD 2>/dev/null || echo 'N/A')"
            echo ""
            echo "# Directory Structure:"
            find "$APP_DIR" -type f -name "*.py" -o -name "*.js" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" | head -20
        } > "$manifest_file"
        
        # Create the backup
        tar -czf "$backup_file" \
            --exclude="*.pyc" \
            --exclude="__pycache__" \
            --exclude="node_modules" \
            --exclude="*.log" \
            --exclude="venv" \
            --exclude="dist" \
            --exclude="build" \
            --exclude=".git" \
            -C "$(dirname "$APP_DIR")" \
            "$(basename "$APP_DIR")" 2>/dev/null
        
        # Verify backup integrity
        if tar -tzf "$backup_file" >/dev/null 2>&1; then
            log "✓ Deployment backup completed successfully: $backup_file"
            log "✓ Backup manifest created: $manifest_file"
            
            # Also backup database separately for easier restoration
            backup_database "$backup_tag"
            
            # Output backup info for GitHub Actions
            echo "BACKUP_FILE=$backup_file" >> /tmp/deployment_backup_info
            echo "BACKUP_TAG=$backup_tag" >> /tmp/deployment_backup_info
            echo "BACKUP_MANIFEST=$manifest_file" >> /tmp/deployment_backup_info
            
            return 0
        else
            error "Backup integrity check failed: $backup_file"
        fi
    else
        warn "Application directory not found at $APP_DIR - creating empty backup"
        
        # Create empty backup for first deployment
        mkdir -p /tmp/empty_backup
        tar -czf "$backup_file" -C /tmp empty_backup
        rm -rf /tmp/empty_backup
        
        log "Empty backup created for first deployment: $backup_file"
        return 0
    fi
}

# Enhanced database backup with integrity checking
backup_database() {
    local backup_tag="${1:-$(date +%Y%m%d_%H%M%S)}"
    local backup_type="${2:-database}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_BASE_DIR/$backup_type/${BACKUP_PREFIX}db_backup_${backup_tag}_${timestamp}.db"
    
    log "Creating database backup with tag: $backup_tag"
    
    setup_backup_dirs
    
    if [ -f "$DB_PATH" ]; then
        # For SQLite, use the .backup command for consistency
        sqlite3 "$DB_PATH" ".backup '$backup_file'" 2>/dev/null || {
            # Fallback to file copy if SQLite command fails
            cp "$DB_PATH" "$backup_file"
        }
        
        # Verify database integrity
        if sqlite3 "$backup_file" "PRAGMA integrity_check;" | grep -q "ok"; then
            # Compress the backup
            gzip "$backup_file"
            log "✓ Database backup completed: ${backup_file}.gz"
            
            # Output database backup info
            echo "DB_BACKUP_FILE=${backup_file}.gz" >> /tmp/deployment_backup_info
            
            return 0
        else
            error "Database backup integrity check failed: $backup_file"
        fi
    else
        warn "Database file not found at $DB_PATH"
        return 1
    fi
}

# Rollback to a specific backup
rollback_deployment() {
    local backup_file="$1"
    local rollback_type="${2:-full}"
    
    if [ -z "$backup_file" ]; then
        error "Please specify backup file to restore from"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Starting rollback from: $backup_file"
    
    # Verify backup integrity before proceeding
    if ! tar -tzf "$backup_file" >/dev/null 2>&1; then
        error "Backup file is corrupted: $backup_file"
    fi
    
    # Stop services during rollback
    info "Stopping services for rollback..."
    systemctl stop productivity-hub 2>/dev/null || true
    
    # Create a backup of current state before rollback
    local pre_rollback_backup="$BACKUP_BASE_DIR/deployment/pre_rollback_$(date +%Y%m%d_%H%M%S).tar.gz"
    if [ -d "$APP_DIR" ]; then
        tar -czf "$pre_rollback_backup" \
            -C "$(dirname "$APP_DIR")" \
            "$(basename "$APP_DIR")" 2>/dev/null || true
        log "Pre-rollback backup created: $pre_rollback_backup"
    fi
    
    # Perform rollback
    case "$rollback_type" in
        "full")
            log "Performing full rollback..."
            
            # Remove current deployment
            if [ -d "$APP_DIR" ]; then
                rm -rf "${APP_DIR}.rollback-backup"
                mv "$APP_DIR" "${APP_DIR}.rollback-backup" 2>/dev/null || true
            fi
            
            # Extract backup
            mkdir -p "$(dirname "$APP_DIR")"
            tar -xzf "$backup_file" -C "$(dirname "$APP_DIR")"
            ;;
            
        "database-only")
            log "Performing database-only rollback..."
            
            # Find corresponding database backup
            local backup_tag=$(basename "$backup_file" | sed 's/.*backup_\([^_]*\)_.*/\1/')
            local db_backup=$(find "$BACKUP_BASE_DIR/database" -name "*${backup_tag}*.gz" | head -1)
            
            if [ -f "$db_backup" ]; then
                # Backup current database
                if [ -f "$DB_PATH" ]; then
                    cp "$DB_PATH" "${DB_PATH}.rollback-backup"
                fi
                
                # Restore database
                gunzip -c "$db_backup" > "$DB_PATH"
                log "Database restored from: $db_backup"
            else
                warn "Database backup not found for tag: $backup_tag"
            fi
            ;;
    esac
    
    # Start services
    info "Starting services after rollback..."
    systemctl start productivity-hub
    systemctl reload nginx 2>/dev/null || systemctl restart nginx
    
    # Wait and verify
    sleep 10
    if curl -f http://localhost:5000/ >/dev/null 2>&1; then
        log "✅ Rollback completed successfully"
        log "Services are running normally"
    else
        error "❌ Rollback completed but health check failed"
    fi
}

# List available backups with details
list_backups() {
    local backup_type="${1:-all}"
    
    log "Available backups:"
    echo
    
    case "$backup_type" in
        "all")
            for type in daily weekly monthly deployment database config; do
                list_backup_type "$type"
            done
            ;;
        *)
            list_backup_type "$backup_type"
            ;;
    esac
}

# List backups of a specific type
list_backup_type() {
    local type="$1"
    local backup_dir="$BACKUP_BASE_DIR/$type"
    
    echo "=== $type backups ==="
    if [ -d "$backup_dir" ] && [ -n "$(ls -A "$backup_dir" 2>/dev/null)" ]; then
        ls -lah "$backup_dir"/ | grep -v "^total"
        
        # Show manifest info for deployment backups
        if [ "$type" = "deployment" ]; then
            echo
            echo "--- Manifest Information ---"
            for manifest in "$backup_dir"/manifest_*.txt; do
                if [ -f "$manifest" ]; then
                    echo "$(basename "$manifest"):"
                    head -8 "$manifest" | sed 's/^/  /'
                    echo
                fi
            done
        fi
    else
        echo "No backups found"
    fi
    echo
}

# Cleanup old backups with confirmation
cleanup_old_backups() {
    local force="${1:-false}"
    
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    if [ "$force" != "true" ]; then
        warn "This will permanently delete backups older than $RETENTION_DAYS days"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Cleanup cancelled"
            return 0
        fi
    fi
    
    local deleted_count=0
    
    # Find and delete old backups
    while IFS= read -r -d '' file; do
        if [ -f "$file" ]; then
            log "Deleting old backup: $(basename "$file")"
            rm -f "$file"
            ((deleted_count++))
        fi
    done < <(find "$BACKUP_BASE_DIR" -type f \( -name "*.gz" -o -name "*.tar.gz" \) -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    log "Cleanup completed - deleted $deleted_count old backups"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Please specify backup file to verify"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    info "Verifying backup integrity: $backup_file"
    
    case "$backup_file" in
        *.tar.gz)
            if tar -tzf "$backup_file" >/dev/null 2>&1; then
                log "✓ Backup integrity verified: $backup_file"
                
                # Show backup contents summary
                echo
                info "Backup contents summary:"
                tar -tzf "$backup_file" | head -20 | sed 's/^/  /'
                local total_files=$(tar -tzf "$backup_file" | wc -l)
                echo "  ... and $((total_files - 20)) more files (total: $total_files)"
                
                return 0
            else
                error "✗ Backup integrity check failed: $backup_file"
            fi
            ;;
        *.gz)
            if gzip -t "$backup_file" 2>/dev/null; then
                log "✓ Backup integrity verified: $backup_file"
                
                # For database backups, also check SQLite integrity
                if [[ "$backup_file" == *"db_backup"* ]]; then
                    local temp_db="/tmp/verify_db_$$.db"
                    gunzip -c "$backup_file" > "$temp_db"
                    
                    if sqlite3 "$temp_db" "PRAGMA integrity_check;" | grep -q "ok"; then
                        log "✓ Database integrity verified"
                    else
                        warn "Database integrity check failed"
                    fi
                    
                    rm -f "$temp_db"
                fi
                
                return 0
            else
                error "✗ Backup integrity check failed: $backup_file"
            fi
            ;;
        *)
            warn "Unknown backup file format: $backup_file"
            return 1
            ;;
    esac
}

# Usage information
usage() {
    echo "Usage: $0 [command] [options]"
    echo
    echo "Commands:"
    echo "  deployment [tag]       Create deployment backup with optional tag"
    echo "  daily                  Create daily backup"
    echo "  weekly                 Create weekly backup"
    echo "  monthly                Create monthly backup"
    echo "  database [tag]         Create database backup with optional tag"
    echo "  list [type]            List available backups (all, daily, weekly, etc.)"
    echo "  rollback <file> [type] Rollback from backup file (full or database-only)"
    echo "  verify <file>          Verify backup integrity"
    echo "  cleanup [--force]      Remove old backups"
    echo "  --help                 Show this help message"
    echo
    echo "Environment variables:"
    echo "  BACKUP_DIR             Base backup directory (default: /var/backups/productivity-hub)"
    echo "  APP_DIR                Application directory (default: /var/www/productivity-hub/current)"
    echo "  RETENTION_DAYS         Days to keep backups (default: 30)"
    echo "  BACKUP_PREFIX          Prefix for backup filenames"
    echo
    echo "Examples:"
    echo "  $0 deployment pre-deploy-v1.2.3    # Create deployment backup with tag"
    echo "  $0 list deployment                 # List deployment backups"
    echo "  $0 rollback /path/to/backup.tar.gz # Rollback from backup"
    echo "  $0 verify /path/to/backup.tar.gz   # Verify backup integrity"
}

# Main function
main() {
    local command="${1:-daily}"
    
    case "$command" in
        deployment)
            backup_deployment "$2" "deployment"
            ;;
        daily)
            setup_backup_dirs
            backup_database "$(date +%Y%m%d)" "daily"
            backup_deployment "$(date +%Y%m%d)" "daily"
            cleanup_old_backups true
            ;;
        weekly)
            setup_backup_dirs
            backup_database "$(date +%Y%m%d)" "weekly"
            backup_deployment "$(date +%Y%m%d)" "weekly"
            # Also backup config for weekly backups
            cleanup_old_backups true
            ;;
        monthly)
            setup_backup_dirs
            backup_database "$(date +%Y%m%d)" "monthly"
            backup_deployment "$(date +%Y%m%d)" "monthly"
            cleanup_old_backups true
            ;;
        database)
            backup_database "$2" "database"
            ;;
        list)
            list_backups "$2"
            ;;
        rollback)
            rollback_deployment "$2" "$3"
            ;;
        verify)
            verify_backup "$2"
            ;;
        cleanup)
            if [ "$2" = "--force" ]; then
                cleanup_old_backups true
            else
                cleanup_old_backups false
            fi
            ;;
        --help|-h)
            usage
            ;;
        *)
            error "Unknown command: $command. Use --help for usage information."
            ;;
    esac
}

main "$@"