# GitHub Actions Deployment Workflow

This document describes the GitHub-hosted, on-demand deployment workflow with safe backup & rollback capabilities for the Productivity Hub application.

## 🚀 Overview

The deployment workflow provides:

- **Manual triggering** with branch/tag selection
- **Atomic deployments** with backup & rollback safety
- **Multi-environment support** (production, staging)
- **Flexible deployment types** (full, backend-only, frontend-only)
- **Automatic failure notifications** with issue creation
- **Comprehensive logging** and monitoring

## 📋 Prerequisites

### 1. Server Requirements

- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / Similar Linux distribution
- **Hardware**: 1GB RAM minimum (2GB recommended), 10GB free storage
- **Software**: Python 3.9+, Node.js 18+, nginx, systemd, SQLite/PostgreSQL
- **Network**: Ports 22 (SSH), 80 (HTTP), 443 (HTTPS) accessible
- **User**: Deploy user with sudo privileges and SSH key-based authentication

### 2. GitHub Secrets Configuration

Navigate to your repository → Settings → Secrets and variables → Actions, then add:

#### Production Environment:

- `PROD_DEPLOY_HOST` - Production server hostname/IP (e.g., "your-server.com")
- `PROD_DEPLOY_USER` - SSH username (e.g., "ubuntu", "productivity")
- `PROD_DEPLOY_PATH` - Deployment path (e.g., "/var/www/productivity-hub")
- `SSH_PRIVATE_KEY` - SSH private key content for server access

#### Staging Environment (Optional):

- `STAGING_DEPLOY_HOST` - Staging server hostname/IP
- `STAGING_DEPLOY_USER` - SSH username for staging
- `STAGING_DEPLOY_PATH` - Deployment path for staging

### 3. SSH Key Setup

```bash
# 1. Generate SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/productivity_hub_deploy -N ""

# 2. Copy public key to server
ssh-copy-id -i ~/.ssh/productivity_hub_deploy.pub user@your-server.com

# 3. Test connection
ssh -i ~/.ssh/productivity_hub_deploy user@your-server.com "echo 'Success'"

# 4. Add private key to GitHub Secrets
# Copy content of ~/.ssh/productivity_hub_deploy and add as SSH_PRIVATE_KEY
```

## 🎯 How to Deploy

### Using GitHub Actions UI

1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Find **"Deploy to VPS"** workflow
4. Click **"Run workflow"**
5. Configure deployment options:
   - **Environment**: production or staging
   - **Branch/Tag**: Branch, tag, or commit to deploy
   - **Deployment Type**: full, backend-only, or frontend-only
   - **Force Deploy**: Skip some safety checks (use carefully)
6. Click **"Run workflow"**

### Deployment Types

#### Full Deployment

- Builds and deploys both frontend and backend
- Updates dependencies and configurations
- Recommended for major releases

#### Backend-Only Deployment

- Deploys only backend changes
- Useful for API updates, bug fixes, database migrations
- Faster than full deployment

#### Frontend-Only Deployment

- Deploys only frontend changes
- Useful for UI updates, styling changes
- Fastest deployment option

## 🛡️ Safety Features

### 1. Backup & Rollback

**Automatic Backup Creation:**

- Creates timestamped backup before every deployment
- Includes application files and database
- Verifies backup integrity before proceeding

**Automatic Rollback:**

- Triggers on deployment failure
- Restores previous working state
- Restarts services automatically
- Logs rollback actions

### 2. Atomic Deployments

**Release Strategy:**

```
/var/www/productivity-hub/
├── releases/
│   ├── release-20231201-143022/    # Current deployment
│   ├── release-20231130-091544/    # Previous release
│   └── release-20231129-165233/    # Older release
├── current → releases/release-20231201-143022/  # Symlink
└── backups/
    ├── backup-pre-deploy-20231201-143022.tar.gz
    └── db_backup_pre-deploy-20231201-143022.db.gz
```

**Benefits:**

- Zero-downtime deployments
- Instant rollback capability
- Preserves previous releases
- Clean separation of versions

### 3. Health Checks

- Automated service verification post-deployment
- HTTP endpoint health checks
- Service status validation
- Automatic rollback on failure

### 4. Failure Notifications

**Automatic Issue Creation:**

- Creates GitHub issue on deployment failure
- Includes error logs and deployment details
- Tags with appropriate labels
- Provides troubleshooting guidance

## 📊 Monitoring & Logs

### Deployment Logs

All deployment activities are logged with timestamps:

- Pre-deployment validation
- Backup creation and verification
- Build and deployment steps
- Health checks and verification
- Rollback actions (if needed)

### GitHub Actions Integration

- Real-time deployment progress in Actions tab
- Downloadable artifacts for build outputs
- Integration with existing CI/CD workflows
- Pull request deployment status checks

## 🛠️ Manual Operations

### Validate Deployment Configuration

```bash
# Run validation script
./scripts/validate-deployment.sh
```

### Manual Backup Operations

```bash
# Create deployment backup
./scripts/backup-enhanced.sh deployment pre-deploy-tag

# List available backups
./scripts/backup-enhanced.sh list

# Verify backup integrity
./scripts/backup-enhanced.sh verify /path/to/backup.tar.gz

# Manual rollback (emergency use)
./scripts/backup-enhanced.sh rollback /path/to/backup.tar.gz
```

### SSH into Server

```bash
# Check deployment status
ssh user@your-server.com "sudo systemctl status productivity-hub"

# View application logs
ssh user@your-server.com "tail -f /var/log/productivity-hub/app.log"

# Check current release
ssh user@your-server.com "ls -la /var/www/productivity-hub/current"
```

## 🔧 Troubleshooting

### Common Issues

#### 1. SSH Connection Failed

```bash
# Test SSH connection
ssh -i ~/.ssh/deploy_key user@server "echo 'test'"

# Check SSH key permissions
chmod 600 ~/.ssh/deploy_key

# Verify server SSH configuration
```

#### 2. Build Failures

```bash
# Check Node.js version
node --version  # Should be 18+

# Check Python version
python3 --version  # Should be 3.9+

# Clear build caches
npm ci --clean-install
rm -rf backend/__pycache__
```

#### 3. Service Start Failures

```bash
# Check service logs
sudo journalctl -u productivity-hub -f

# Verify configuration
sudo nginx -t

# Check file permissions
ls -la /var/www/productivity-hub/current/
```

#### 4. Health Check Failures

```bash
# Manual health check
curl -f http://localhost:5000/

# Check service status
sudo systemctl status productivity-hub nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### Emergency Procedures

#### Manual Rollback

If automated rollback fails:

```bash
# SSH to server
ssh user@your-server.com

# Stop services
sudo systemctl stop productivity-hub

# Find previous release
ls -la /var/www/productivity-hub/releases/

# Switch to previous release
ln -sfn /var/www/productivity-hub/releases/previous-release /var/www/productivity-hub/current

# Start services
sudo systemctl start productivity-hub
sudo systemctl reload nginx
```

#### Service Recovery

If services are completely down:

```bash
# Check system resources
free -h
df -h

# Restart all services
sudo systemctl restart productivity-hub nginx

# Check for port conflicts
sudo netstat -tlnp | grep :5000
```

## 📈 Best Practices

### Deployment Strategy

1. **Test in Staging First**: Always test deployments in staging environment
2. **Deploy During Low Traffic**: Schedule deployments during maintenance windows
3. **Monitor After Deployment**: Watch logs and metrics post-deployment
4. **Keep Backups**: Maintain regular backup schedule
5. **Document Changes**: Update CHANGELOG.md for all deployments

### Security Considerations

1. **Rotate SSH Keys**: Regularly update deployment SSH keys
2. **Limit Access**: Use principle of least privilege for deploy user
3. **Monitor Access**: Log and monitor deployment activities
4. **Secure Secrets**: Regularly audit GitHub secrets access
5. **Network Security**: Use VPN or firewall rules for deployment access

### Performance Optimization

1. **Build Caching**: Use GitHub Actions cache for dependencies
2. **Parallel Builds**: Build frontend and backend simultaneously
3. **Incremental Deployments**: Use rsync for efficient file transfers
4. **Release Cleanup**: Automatically remove old releases to save space

## 🔄 Integration with Existing Workflows

This deployment workflow integrates with:

- **Existing CI/CD**: Builds on current GitHub Actions workflows
- **Deploy Scripts**: Leverages existing deploy.sh and deploy.ps1 scripts
- **Backup System**: Uses enhanced backup.sh with additional features
- **Monitoring**: Compatible with existing logging and monitoring setup

## 📚 Additional Resources

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Traditional deployment methods
- [CHANGELOG.md](../CHANGELOG.md) - Version history and changes
- [FEATURES.md](../FEATURES.md) - Application features and capabilities
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

For additional support or questions, please create an issue in the repository or consult the troubleshooting section above.
