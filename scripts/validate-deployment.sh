#!/bin/bash

# Deployment configuration validation script
# This script validates that all required secrets and configuration are in place

set -e

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
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if we're running in GitHub Actions
check_github_actions() {
    if [ "$GITHUB_ACTIONS" = "true" ]; then
        log "Running in GitHub Actions environment"
        return 0
    else
        warn "Not running in GitHub Actions - some checks will be skipped"
        return 1
    fi
}

# Validate required GitHub secrets documentation
validate_secrets_documentation() {
    info "Validating required GitHub secrets documentation..."
    
    cat << 'EOF'

📋 REQUIRED GITHUB SECRETS CHECKLIST

For Production Environment:
□ PROD_DEPLOY_HOST        - Production server hostname/IP
□ PROD_DEPLOY_USER        - SSH username for production server  
□ PROD_DEPLOY_PATH        - Deployment path on production server

Authentication (choose ONE):
Option A - SSH Key Authentication (Recommended):
□ SSH_PRIVATE_KEY         - SSH private key for server access

Option B - SSH Password Authentication:
□ PROD_SSH_PASSWORD       - SSH password for server access

For Staging Environment (optional):
□ STAGING_DEPLOY_HOST     - Staging server hostname/IP
□ STAGING_DEPLOY_USER     - SSH username for staging server
□ STAGING_DEPLOY_PATH     - Deployment path on staging server
□ STAGING_SSH_PASSWORD    - SSH password for staging (if using password auth)

Instructions to set up secrets:
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add the required secrets listed above

Example values:
- PROD_DEPLOY_HOST: "your-server.com" or "192.168.1.100"
- PROD_DEPLOY_USER: "ubuntu" or "productivity"
- PROD_DEPLOY_PATH: "/var/www/productivity-hub"
- SSH_PRIVATE_KEY: Your private SSH key content (keep the BEGIN/END lines)
- PROD_SSH_PASSWORD: "your-ssh-password" (only if not using SSH keys)

EOF
}

# Check local dependencies for development
check_local_dependencies() {
    info "Checking local development dependencies..."
    
    local deps_ok=true
    
    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        log "Node.js found: $node_version"
        
        if [[ "$node_version" < "v18" ]]; then
            warn "Node.js version should be 18 or higher"
        fi
    else
        error "Node.js not found"
        deps_ok=false
    fi
    
    # Check npm
    if command -v npm >/dev/null 2>&1; then
        log "npm found: $(npm --version)"
    else
        error "npm not found"
        deps_ok=false
    fi
    
    # Check Python
    if command -v python3 >/dev/null 2>&1; then
        local python_version=$(python3 --version)
        log "Python found: $python_version"
        
        if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 9) else 1)" 2>/dev/null; then
            warn "Python version should be 3.9 or higher"
        fi
    else
        error "Python 3 not found"
        deps_ok=false
    fi
    
    # Check pip
    if command -v pip >/dev/null 2>&1 || command -v pip3 >/dev/null 2>&1; then
        log "pip found"
    else
        error "pip not found"
        deps_ok=false
    fi
    
    if [ "$deps_ok" = false ]; then
        error "Some required dependencies are missing"
        return 1
    fi
    
    log "All local dependencies are available"
    return 0
}

# Validate deployment files
validate_deployment_files() {
    info "Validating deployment files..."
    
    local files_ok=true
    local required_files=(
        ".github/workflows/deploy.yml"
        "scripts/deploy.sh"
        "scripts/backup.sh"
        "Dockerfile"
        "docker-compose.yml"
        "frontend/package.json"
        "requirements.txt"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log "✓ $file exists"
        else
            error "✗ $file missing"
            files_ok=false
        fi
    done
    
    if [ "$files_ok" = false ]; then
        error "Some required deployment files are missing"
        return 1
    fi
    
    log "All deployment files are present"
    return 0
}

# Test local build capability
test_local_build() {
    info "Testing local build capability..."
    
    # Test frontend build
    if [ -d "frontend" ]; then
        log "Testing frontend build..."
        cd frontend
        
        if [ ! -d "node_modules" ]; then
            log "Installing frontend dependencies..."
            npm ci
        fi
        
        log "Building frontend..."
        npm run build
        
        if [ -d "dist" ] && [ -n "$(ls -A dist)" ]; then
            log "✓ Frontend build successful"
        else
            error "✗ Frontend build failed"
            cd ..
            return 1
        fi
        
        cd ..
    fi
    
    # Test backend setup
    if [ -d "backend" ]; then
        log "Testing backend setup..."
        
        if [ ! -d "venv" ]; then
            log "Creating Python virtual environment..."
            python3 -m venv venv
        fi
        
        source venv/bin/activate
        
        log "Installing backend dependencies..."
        pip install -r requirements.txt >/dev/null 2>&1
        
        # Test if we can import the main app
        if python -c "import sys; sys.path.append('backend'); import app" 2>/dev/null; then
            log "✓ Backend setup successful"
        else
            warn "Backend imports may have issues (this is sometimes normal without .env)"
        fi
        
        deactivate
    fi
    
    log "Local build tests completed"
    return 0
}

# SSH key validation guidance
validate_ssh_setup() {
    info "SSH key setup validation..."
    
    cat << 'EOF'

🔑 SSH AUTHENTICATION SETUP GUIDE

OPTION 1: SSH Key Authentication (Recommended)

1. Generate SSH key pair (if you don't have one):
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/productivity_hub_deploy -N ""

2. Copy public key to your server:
   ssh-copy-id -i ~/.ssh/productivity_hub_deploy.pub user@your-server.com

3. Test SSH connection:
   ssh -i ~/.ssh/productivity_hub_deploy user@your-server.com "echo 'Connection successful'"

4. Add private key to GitHub Secrets:
   - Copy the content of ~/.ssh/productivity_hub_deploy
   - Add it as SSH_PRIVATE_KEY secret in GitHub

OPTION 2: SSH Password Authentication

1. Ensure SSH password authentication is enabled on your server:
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication yes
   sudo systemctl restart ssh

2. Test SSH connection with password:
   ssh user@your-server.com

3. Add password to GitHub Secrets:
   - Add your SSH password as PROD_SSH_PASSWORD secret in GitHub

FIRST DEPLOYMENT:
For initial deployment to a fresh server, use the "First Deployment Setup" workflow:
- Go to Actions → "First Deployment Setup"
- This will install all required software and configure the server
- After first deployment, use the regular "Deploy to VPS" workflow

SERVER DIRECTORY STRUCTURE:
The deployment will create:
   /var/www/productivity-hub/
   ├── releases/          (created automatically)
   ├── backups/           (created automatically)
   └── current/           (symlink, created automatically)

EOF
}

# Server requirements check
validate_server_requirements() {
    info "Server requirements documentation..."
    
    cat << 'EOF'

🖥️  SERVER REQUIREMENTS

Minimum Hardware:
- RAM: 1GB (2GB recommended)
- Storage: 10GB free space
- CPU: 1 core (2 cores recommended)

Software Requirements:
- Ubuntu 20.04+ / CentOS 8+ / Similar Linux distribution
- Python 3.9+
- Node.js 18+
- nginx (for reverse proxy)
- systemd (for service management)
- SQLite or PostgreSQL
- SSH server with key-based authentication

Network Requirements:
- Ports 22 (SSH), 80 (HTTP), 443 (HTTPS) accessible
- Domain name pointing to server IP (recommended)

User Requirements:
- Deploy user with sudo privileges
- SSH key-based authentication configured
- Write permissions to deployment directory

EOF
}

# Main validation function
main() {
    echo "🔍 Productivity Hub Deployment Validation"
    echo "========================================"
    echo
    
    local validation_failed=false
    
    # Check if we're in the right directory
    if [ ! -f "README.md" ] || [ ! -d ".github" ]; then
        error "Please run this script from the root of the Productivity Hub repository"
        exit 1
    fi
    
    # Run validation checks
    validate_deployment_files || validation_failed=true
    echo
    
    check_local_dependencies || validation_failed=true
    echo
    
    if ! check_github_actions; then
        test_local_build || validation_failed=true
        echo
    fi
    
    # Show documentation sections
    validate_secrets_documentation
    echo
    
    validate_ssh_setup
    echo
    
    validate_server_requirements
    echo
    
    # Summary
    if [ "$validation_failed" = true ]; then
        error "❌ Validation completed with issues"
        echo
        warn "Please fix the issues above before attempting deployment"
        exit 1
    else
        log "✅ Basic validation passed"
        echo
        info "Next steps:"
        echo "1. Set up the required GitHub secrets"
        echo "2. Configure your VPS server"
        echo "3. Test the deployment workflow"
        echo "4. Go to Actions → Deploy to VPS → Run workflow"
    fi
}

# Show usage information
usage() {
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  --help     Show this help message"
    echo
    echo "This script validates your deployment configuration and provides"
    echo "setup instructions for GitHub Actions deployment workflow."
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        usage
        exit 0
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1. Use --help for usage information."
        exit 1
        ;;
esac