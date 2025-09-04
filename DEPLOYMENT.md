# Deployment Guide

This comprehensive guide will help you deploy Productivity Hub to production using various deployment methods including traditional VPS deployment, Docker, and automated deployment scripts.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Traditional VPS Deployment](#traditional-vps-deployment)
- [Docker Deployment](#docker-deployment)
- [Security Configuration](#security-configuration)
- [Nginx Configuration](#nginx-configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Automated Deployment](#automated-deployment)
- [Backup and Recovery](#backup-and-recovery)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Quick Start

For the fastest deployment using Docker:

```bash
# Clone the repository
git clone https://github.com/WxboySuper/Productivity-Hub.git
cd Productivity-Hub

# Copy and configure environment
cp .env.docker.template .env
# Edit .env with your values

# Start with Docker Compose
docker-compose up -d
```

## Prerequisites

### System Requirements

- **Server**: Linux VPS (Ubuntu 20.04+ recommended)
- **RAM**: Minimum 1GB, recommended 2GB+
- **Storage**: Minimum 10GB free space
- **CPU**: 1 core minimum, 2+ cores recommended

### Software Dependencies

- **Python**: 3.9+
- **Node.js**: 16+
- **Git**: Latest version
- **Nginx**: 1.18+ (for reverse proxy)
- **Docker**: 20.10+ (for Docker deployment)
- **PostgreSQL**: 13+ (optional, for production database)

## Traditional VPS Deployment

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx git sqlite3 curl

# Create application user
sudo useradd -m -s /bin/bash productivity
sudo usermod -aG sudo productivity
```

### 2. Clone and Setup Application

```bash
# Switch to application user
sudo su - productivity

# Clone repository
git clone https://github.com/WxboySuper/Productivity-Hub.git
cd Productivity-Hub

# Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup environment
cp ../config/env/production.env.template .env
# Edit .env with your production values

# Initialize database
python app.py
cd ..

# Setup frontend
cd frontend
npm install
npm run build
cd ..
```

### 3. Configure System Services

```bash
# Install systemd service
sudo cp config/systemd/productivity-hub.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable productivity-hub
sudo systemctl start productivity-hub

# Configure Nginx
sudo cp config/nginx/productivity-hub.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/productivity-hub.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Production Startup Script

Use the provided production startup script:

```bash
# Start all services
./scripts/start-production.sh start

# Start only backend
./scripts/start-production.sh backend-only

# Check status
./scripts/start-production.sh status
```

## Docker Deployment

### 1. Using Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/WxboySuper/Productivity-Hub.git
cd Productivity-Hub

# Configure environment
cp .env.docker.template .env
# Edit .env with your values

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f productivity-hub
```

### 2. Manual Docker Build

```bash
# Build image
docker build -t productivity-hub .

# Run container
docker run -d \
  --name productivity-hub \
  -p 5000:5000 \
  -e SECRET_KEY="your-secret-key" \
  -e FLASK_ENV=production \
  productivity-hub
```

## Security Configuration

### 1. Generate Secure Keys

```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate database password
openssl rand -base64 32
```

### 2. Environment Variables

Critical environment variables for production:

```bash
# Required
SECRET_KEY=your-secure-secret-key
FLASK_ENV=production
FLASK_DEBUG=0

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost/productivity_hub

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Frontend
FRONTEND_BASE_URL=https://your-domain.com
```

### 3. File Permissions

```bash
# Set secure permissions
chmod 600 backend/.env
chmod +x scripts/*.sh
chown -R productivity:productivity /var/www/productivity-hub
```

## Nginx Configuration

### 1. SSL/HTTPS Setup

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Custom Nginx Configuration

The provided Nginx configuration includes:

- SSL/TLS termination
- Security headers
- Rate limiting
- Gzip compression
- Static file serving
- API proxy to backend

Edit `config/nginx/productivity-hub.conf` and update:

- `server_name` to your domain
- SSL certificate paths
- Any custom security requirements

## Automated Deployment

### 1. Using the Deployment Script

```bash
# Set environment variables
export DEPLOY_HOST=your-server.com
export DEPLOY_USER=productivity
export DEPLOY_PATH=/var/www/productivity-hub

# Full deployment
./scripts/deploy.sh

# Backend only
./scripts/deploy.sh --backend-only

# Frontend only
./scripts/deploy.sh --frontend-only
```

### 2. CI/CD Integration

For automated deployments, add these environment variables to your CI/CD pipeline:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PATH`
- SSH keys for authentication

## Backup and Recovery

### 1. Automated Backups

```bash
# Daily backup
./scripts/backup.sh daily

# Weekly backup (includes config)
./scripts/backup.sh weekly

# Setup cron job
crontab -e
# Add: 0 2 * * * /path/to/scripts/backup.sh daily
```

### 2. Database Backup/Restore

```bash
# Manual database backup
./scripts/backup.sh database

# Restore from backup
./scripts/backup.sh restore /path/to/backup.db.gz

# List available backups
./scripts/backup.sh list
```

## Monitoring and Maintenance

### 1. Health Checks

```bash
# Backend health
curl -f http://localhost:5000/

# Full system check
./scripts/start-production.sh status
```

### 2. Log Monitoring

```bash
# Application logs
tail -f /var/log/productivity-hub/app.log

# Gunicorn logs
tail -f /var/log/gunicorn/error.log

# Nginx logs
tail -f /var/log/nginx/productivity-hub-error.log
```

### 3. Performance Monitoring

Consider adding:

- **Monitoring**: New Relic, Datadog, or Prometheus
- **Error Tracking**: Sentry
- **Uptime Monitoring**: Pingdom or UptimeRobot

## Updating the Application

### 1. Automated Updates

```bash
# Using deployment script
DEPLOY_HOST=your-server.com ./scripts/deploy.sh
```

### 2. Manual Updates

```bash
# On the server
cd /var/www/productivity-hub/current
git pull origin main

# Backend updates
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart productivity-hub

# Frontend updates
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

## Troubleshooting

### Common Issues

1. **Port 5000 already in use**

   ```bash
   sudo lsof -i :5000
   sudo kill -9 <PID>
   ```

2. **Permission denied errors**

   ```bash
   sudo chown -R productivity:productivity /var/www/productivity-hub
   chmod +x scripts/*.sh
   ```

3. **Database connection errors**
   - Check `.env` file configuration
   - Verify database service is running
   - Check firewall settings

4. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

### Getting Help

- Check application logs: `/var/log/productivity-hub/`
- Check Nginx logs: `/var/log/nginx/`
- Verify service status: `systemctl status productivity-hub`
- Test configuration: `nginx -t`

## Security Best Practices

- **Regular Updates**: Keep all dependencies updated
- **Firewall**: Configure UFW or iptables
- **SSH**: Use key-based authentication only
- **Backups**: Test restore procedures regularly
- **Monitoring**: Set up alerts for critical issues
- **SSL**: Use HTTPS only, configure HSTS
- **Secrets**: Never commit secrets to version control

## Performance Optimization

- **Database**: Consider PostgreSQL for production
- **Caching**: Implement Redis for session storage
- **CDN**: Use CloudFlare or AWS CloudFront
- **Compression**: Enable Gzip in Nginx
- **Static Files**: Serve directly through Nginx

For additional help, refer to the logs and health check endpoints provided by the application.
