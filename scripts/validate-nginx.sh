#!/bin/bash

# Nginx Configuration Validator for Productivity Hub
# This script validates the Nginx configuration before deployment

set -e

CONFIG_FILE="/etc/nginx/sites-available/productivity-hub.conf"
LOCAL_CONFIG_FILE="config/nginx/productivity-hub.conf"
BACKUP_DIR="/etc/nginx/sites-available/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check for placeholder values
check_placeholders() {
    log "Checking for placeholder values in configuration..."
    
    local config_file="$1"
    local found_placeholders=0
    
    # Define placeholder patterns to check
    local placeholders=(
        "your-domain.com"
        "www.your-domain.com"
        "/path/to/your/certificate.crt"
        "/path/to/your/private.key"
        "your-server.com"
    )
    
    for placeholder in "${placeholders[@]}"; do
        if grep -q "$placeholder" "$config_file"; then
            warn "Found placeholder value '$placeholder' in config file"
            warn "Please update this value with your actual configuration"
            found_placeholders=1
        fi
    done
    
    if [ $found_placeholders -eq 1 ]; then
        error "Configuration contains placeholder values. Please update before proceeding."
    else
        log "✓ No placeholder values found"
    fi
}

# Function to validate SSL certificate files
validate_ssl_certificates() {
    log "Validating SSL certificate files..."
    
    local config_file="$1"
    
    # Extract SSL certificate and key paths from config
    local ssl_cert=$(grep -o 'ssl_certificate [^;]*' "$config_file" | head -1 | cut -d' ' -f2 | tr -d ';')
    local ssl_key=$(grep -o 'ssl_certificate_key [^;]*' "$config_file" | head -1 | cut -d' ' -f2 | tr -d ';')
    
    if [ -n "$ssl_cert" ] && [ "$ssl_cert" != "/path/to/your/certificate.crt" ]; then
        if [ -f "$ssl_cert" ]; then
            log "✓ SSL certificate found: $ssl_cert"
            
            # Check certificate validity
            local expiry_date=$(openssl x509 -in "$ssl_cert" -noout -enddate 2>/dev/null | cut -d= -f2)
            if [ -n "$expiry_date" ]; then
                info "Certificate expires: $expiry_date"
                
                # Check if certificate expires within 30 days
                local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
                local current_epoch=$(date +%s)
                local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
                
                if [ $days_until_expiry -lt 30 ] && [ $days_until_expiry -gt 0 ]; then
                    warn "Certificate expires in $days_until_expiry days. Consider renewal."
                elif [ $days_until_expiry -le 0 ]; then
                    error "Certificate has expired!"
                fi
            fi
        else
            error "SSL certificate not found: $ssl_cert"
        fi
    else
        warn "SSL certificate path not configured or using placeholder"
    fi
    
    if [ -n "$ssl_key" ] && [ "$ssl_key" != "/path/to/your/private.key" ]; then
        if [ -f "$ssl_key" ]; then
            log "✓ SSL private key found: $ssl_key"
            
            # Check private key permissions
            local key_perms=$(stat -c "%a" "$ssl_key")
            if [ "$key_perms" != "600" ]; then
                warn "Private key permissions are $key_perms, should be 600"
                info "Run: sudo chmod 600 $ssl_key"
            fi
        else
            error "SSL private key not found: $ssl_key"
        fi
    else
        warn "SSL private key path not configured or using placeholder"
    fi
}

# Function to validate server name configuration
validate_server_name() {
    log "Validating server name configuration..."
    
    local config_file="$1"
    local server_names=$(grep "server_name" "$config_file" | grep -v "#" | sed 's/.*server_name //g' | sed 's/;//g')
    
    echo "$server_names" | while read -r line; do
        if [ -n "$line" ]; then
            for domain in $line; do
                if [ "$domain" != "your-domain.com" ] && [ "$domain" != "www.your-domain.com" ]; then
                    info "Checking DNS resolution for: $domain"
                    if nslookup "$domain" >/dev/null 2>&1; then
                        log "✓ DNS resolution successful for: $domain"
                    else
                        warn "DNS resolution failed for: $domain"
                    fi
                fi
            done
        fi
    done
}

# Function to test Nginx configuration syntax
test_nginx_syntax() {
    log "Testing Nginx configuration syntax..."
    
    if command -v nginx >/dev/null 2>&1; then
        if sudo nginx -t 2>/dev/null; then
            log "✓ Nginx configuration syntax is valid"
        else
            error "Nginx configuration syntax error. Run 'sudo nginx -t' for details."
        fi
    else
        warn "Nginx not installed. Cannot test configuration syntax."
    fi
}

# Function to check required directories and paths
validate_paths() {
    log "Validating application paths..."
    
    local config_file="$1"
    
    # Check root directory
    local root_dir=$(grep -o 'root [^;]*' "$config_file" | head -1 | cut -d' ' -f2 | tr -d ';')
    if [ -n "$root_dir" ]; then
        if [ -d "$root_dir" ]; then
            log "✓ Root directory exists: $root_dir"
            
            # Check for index.html
            if [ -f "$root_dir/index.html" ]; then
                log "✓ Index file found: $root_dir/index.html"
            else
                warn "Index file not found: $root_dir/index.html"
            fi
        else
            warn "Root directory not found: $root_dir"
        fi
    fi
    
    # Check log directories
    local log_dirs=("/var/log/nginx" "/var/log/productivity-hub")
    for log_dir in "${log_dirs[@]}"; do
        if [ -d "$log_dir" ]; then
            log "✓ Log directory exists: $log_dir"
        else
            warn "Log directory not found: $log_dir"
            info "Create with: sudo mkdir -p $log_dir"
        fi
    done
}

# Function to create backup
create_backup() {
    if [ -f "$CONFIG_FILE" ]; then
        log "Creating backup of existing configuration..."
        sudo mkdir -p "$BACKUP_DIR"
        local backup_file="$BACKUP_DIR/productivity-hub.conf.backup.$(date +%Y%m%d-%H%M%S)"
        sudo cp "$CONFIG_FILE" "$backup_file"
        log "Backup created: $backup_file"
    fi
}

# Function to show configuration summary
show_summary() {
    local config_file="$1"
    
    echo ""
    echo "=== Configuration Summary ==="
    echo ""
    
    # Server names
    echo "Server Names:"
    grep "server_name" "$config_file" | grep -v "#" | sed 's/.*server_name //g' | sed 's/;//g' | sed 's/^/  - /'
    
    echo ""
    
    # SSL configuration
    echo "SSL Configuration:"
    local ssl_cert=$(grep -o 'ssl_certificate [^;]*' "$config_file" | head -1 | cut -d' ' -f2 | tr -d ';')
    local ssl_key=$(grep -o 'ssl_certificate_key [^;]*' "$config_file" | head -1 | cut -d' ' -f2 | tr -d ';')
    echo "  Certificate: $ssl_cert"
    echo "  Private Key: $ssl_key"
    
    echo ""
    
    # Root directory
    echo "Application Root:"
    local root_dir=$(grep -o 'root [^;]*' "$config_file" | head -1 | cut -d' ' -f2 | tr -d ';')
    echo "  Root: $root_dir"
    
    echo ""
}

# Main validation function
main() {
    local config_file="${1:-$LOCAL_CONFIG_FILE}"
    
    log "Starting Nginx configuration validation..."
    log "Configuration file: $config_file"
    
    # Check if configuration file exists
    if [ ! -f "$config_file" ]; then
        error "Configuration file not found: $config_file"
    fi
    
    # Run validation checks
    check_placeholders "$config_file"
    validate_ssl_certificates "$config_file"
    validate_server_name "$config_file"
    validate_paths "$config_file"
    
    # Test Nginx syntax if we're validating the active config
    if [ "$config_file" = "$CONFIG_FILE" ]; then
        test_nginx_syntax
    fi
    
    # Show configuration summary
    show_summary "$config_file"
    
    log "Validation completed successfully!"
    
    if [ "$config_file" != "$CONFIG_FILE" ]; then
        info "To deploy this configuration:"
        info "1. Update placeholder values in the configuration file"
        info "2. Copy to Nginx sites-available: sudo cp $config_file $CONFIG_FILE"
        info "3. Create symlink: sudo ln -s $CONFIG_FILE /etc/nginx/sites-enabled/"
        info "4. Test configuration: sudo nginx -t"
        info "5. Reload Nginx: sudo systemctl reload nginx"
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [config_file]"
    echo ""
    echo "Validates Nginx configuration for Productivity Hub"
    echo ""
    echo "Arguments:"
    echo "  config_file    Path to configuration file (default: $LOCAL_CONFIG_FILE)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Validate local config"
    echo "  $0 /etc/nginx/sites-available/productivity-hub.conf  # Validate active config"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    "")
        main
        ;;
    *)
        main "$1"
        ;;
esac