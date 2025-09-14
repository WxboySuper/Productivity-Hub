# Production deployment script for Productivity Hub (Windows/PowerShell)
# This script efficiently deploys only changed files to the production server

param(
    [string]$Action = "",
    [switch]$Help,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

# Configuration - Override with environment variables
$REMOTE_HOST = if ($env:DEPLOY_HOST) { $env:DEPLOY_HOST } else { "your-server.com" }
$REMOTE_USER = if ($env:DEPLOY_USER) { $env:DEPLOY_USER } else { "ubuntu" }
$REMOTE_PATH = if ($env:DEPLOY_PATH) { $env:DEPLOY_PATH } else { "/var/www/productivity-hub" }
$BACKUP_DIR = "$REMOTE_PATH/backups"
$LOG_FILE = "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Colors for output
$RED = [System.ConsoleColor]::Red
$GREEN = [System.ConsoleColor]::Green
$YELLOW = [System.ConsoleColor]::Yellow

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor $GREEN
    Add-Content -Path $LOG_FILE -Value $logMessage
}

function Write-Warning {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] WARNING: $Message"
    Write-Host $logMessage -ForegroundColor $YELLOW
    Add-Content -Path $LOG_FILE -Value $logMessage
}

function Write-Error {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] ERROR: $Message"
    Write-Host $logMessage -ForegroundColor $RED
    Add-Content -Path $LOG_FILE -Value $logMessage
    exit 1
}

# Check if we have SSH access
function Test-SSHAccess {
    Write-Log "Checking SSH access to $REMOTE_USER@$REMOTE_HOST..."
    
    # Test SSH connection using plink or ssh (if available)
    try {
        if (Get-Command ssh -ErrorAction SilentlyContinue) {
            $result = ssh -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection successful'" 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Cannot connect to $REMOTE_USER@$REMOTE_HOST. Please check your SSH configuration."
            }
        } elseif (Get-Command plink -ErrorAction SilentlyContinue) {
            $result = plink -batch -l $REMOTE_USER $REMOTE_HOST "echo 'SSH connection successful'" 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Cannot connect to $REMOTE_USER@$REMOTE_HOST. Please check your SSH configuration."
            }
        } else {
            Write-Error "SSH client not found. Please install OpenSSH or PuTTY."
        }
    } catch {
        Write-Error "SSH connection failed: $($_.Exception.Message)"
    }
}

# Create backup
function New-Backup {
    Write-Log "Creating backup on remote server..."
    
    $backupCommands = @"
mkdir -p $BACKUP_DIR
if [ -d '$REMOTE_PATH/current' ]; then
    cp -r $REMOTE_PATH/current $BACKUP_DIR/backup-`$(date +%Y%m%d-%H%M%S)
    # Keep only last 5 backups
    cd $BACKUP_DIR && ls -t | tail -n +6 | xargs -r rm -rf
fi
"@

    if (Get-Command ssh -ErrorAction SilentlyContinue) {
        ssh "$REMOTE_USER@$REMOTE_HOST" $backupCommands
    } else {
        plink -batch -l $REMOTE_USER $REMOTE_HOST $backupCommands
    }
}

# Deploy backend changes
function Deploy-Backend {
    Write-Log "Deploying backend changes..."
    
    # Check if rsync is available (Git Bash or WSL)
    if (Get-Command rsync -ErrorAction SilentlyContinue) {
        # Use rsync for efficient sync
        rsync -avz --delete `
            --exclude '*.pyc' `
            --exclude '__pycache__' `
            --exclude '.env' `
            --exclude '*.db' `
            --exclude 'logs/' `
            backend/ "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_PATH/current/backend/"
    } else {
        # Fallback to scp for file transfer
        Write-Warning "rsync not found, using scp (less efficient)"
        if (Get-Command scp -ErrorAction SilentlyContinue) {
            scp -r backend/* "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_PATH/current/backend/"
        } else {
            Write-Error "Neither rsync nor scp found. Please install Git Bash, WSL, or OpenSSH."
        }
    }
    
    # Create deployment package locally to avoid runtime dependency issues
    Write-Log "Creating deployment package..."
    $tempDir = [System.IO.Path]::GetTempPath() + "productivity-hub-deploy"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Copy requirements and create install script
    Copy-Item "backend/requirements.txt" "$tempDir/requirements.txt"
    
    $installScript = @"
#!/bin/bash
cd $REMOTE_PATH/current/backend
source venv/bin/activate

# Create a backup of current environment
pip freeze > requirements.backup.txt

# Install dependencies with retry logic
for i in {1..3}; do
    if pip install -r requirements.txt; then
        echo "Dependencies installed successfully"
        break
    else
        echo "Attempt $i failed, retrying..."
        sleep 5
    fi
done

# Verify installation
if ! pip check; then
    echo "WARNING: Dependency conflicts detected"
fi
"@
    
    Set-Content -Path "$tempDir/install-deps.sh" -Value $installScript
    
    # Transfer and execute install script
    if (Get-Command scp -ErrorAction SilentlyContinue) {
        scp "$tempDir/install-deps.sh" "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_PATH/current/backend/"
        ssh "$REMOTE_USER@$REMOTE_HOST" "chmod +x $REMOTE_PATH/current/backend/install-deps.sh && $REMOTE_PATH/current/backend/install-deps.sh"
    }
    
    # Clean up temp directory
    Remove-Item -Path $tempDir -Recurse -Force
}

# Deploy frontend changes
function Deploy-Frontend {
    Write-Log "Building and deploying frontend..."
    
    # Build frontend locally
    Push-Location frontend
    try {
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            npm run build
        } else {
            Write-Error "npm not found. Please install Node.js."
        }
    } finally {
        Pop-Location
    }
    
    # Sync built frontend
    if (Get-Command rsync -ErrorAction SilentlyContinue) {
        rsync -avz --delete frontend/dist/ "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_PATH/current/frontend/dist/"
    } elseif (Get-Command scp -ErrorAction SilentlyContinue) {
        scp -r frontend/dist/* "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_PATH/current/frontend/dist/"
    } else {
        Write-Error "Neither rsync nor scp found for file transfer."
    }
}

# Restart services
function Restart-Services {
    Write-Log "Restarting services..."
    
    $restartCommands = @"
sudo systemctl restart productivity-hub
sudo systemctl restart nginx
"@

    if (Get-Command ssh -ErrorAction SilentlyContinue) {
        ssh "$REMOTE_USER@$REMOTE_HOST" $restartCommands
    } else {
        plink -batch -l $REMOTE_USER $REMOTE_HOST $restartCommands
    }
}

# Health check
function Test-Health {
    Write-Log "Performing health check..."
    Start-Sleep -Seconds 5  # Give services time to start
    
    $healthCheck = "curl -f http://localhost:5000/ >/dev/null 2>&1"
    
    if (Get-Command ssh -ErrorAction SilentlyContinue) {
        $result = ssh "$REMOTE_USER@$REMOTE_HOST" $healthCheck
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Backend health check passed"
        } else {
            Write-Error "Backend health check failed"
        }
    }
}

# Main deployment function
function Start-Deployment {
    Write-Log "Starting deployment to $REMOTE_HOST..."
    
    # Validate environment
    if (-not $REMOTE_HOST -or $REMOTE_HOST -eq "your-server.com") {
        Write-Error "Please set DEPLOY_HOST environment variable"
    }
    
    # Pre-deployment checks
    Test-SSHAccess
    
    # Create backup
    New-Backup
    
    # Deploy components
    Deploy-Backend
    Deploy-Frontend
    
    # Restart services
    Restart-Services
    
    # Verify deployment
    Test-Health
    
    Write-Log "Deployment completed successfully!"
    Write-Log "Log saved to: $LOG_FILE"
}

# Show usage
function Show-Usage {
    Write-Host @"
Usage: .\scripts\deploy.ps1 [options]

Options:
  -Help              Show this help message
  -BackendOnly       Deploy only backend changes
  -FrontendOnly      Deploy only frontend changes

Environment variables:
  DEPLOY_HOST        Remote server hostname (required)
  DEPLOY_USER        Remote server user (default: ubuntu)
  DEPLOY_PATH        Remote server path (default: /var/www/productivity-hub)

Examples:
  `$env:DEPLOY_HOST="myserver.com"; .\scripts\deploy.ps1
  .\scripts\deploy.ps1 -BackendOnly
  .\scripts\deploy.ps1 -FrontendOnly

Prerequisites:
  - SSH client (OpenSSH, Git Bash, or PuTTY)
  - rsync (recommended) or scp for file transfer
  - Node.js and npm for frontend builds

Note: This script works best with Git Bash or WSL for rsync support.
"@
}

# Parse command line arguments
if ($Help) {
    Show-Usage
    exit 0
}

if ($BackendOnly) {
    Test-SSHAccess
    New-Backup
    Deploy-Backend
    Restart-Services
    Test-Health
    exit 0
}

if ($FrontendOnly) {
    Test-SSHAccess
    Deploy-Frontend
    $reloadCommand = "sudo systemctl reload nginx"
    if (Get-Command ssh -ErrorAction SilentlyContinue) {
        ssh "$REMOTE_USER@$REMOTE_HOST" $reloadCommand
    } else {
        plink -batch -l $REMOTE_USER $REMOTE_HOST $reloadCommand
    }
    exit 0
}

# Default: full deployment
Start-Deployment