# Deployment Testing Steps

This file contains practical testing steps to validate the deployment readiness implementation.

## Prerequisites Testing

### 1. Test Backend Dependencies

```bash
cd backend
pip install -r ../requirements.txt
python -m pytest --tb=short  # Should pass all 89 tests
```

### 2. Test Frontend Build

```bash
cd frontend
npm install
npm run build  # Should create dist/ directory
```

## Script Testing

### 1. Test Production Startup Script

```bash
# Test help
./scripts/start-production.sh --help

# Test build process (creates venv, installs deps, builds frontend)
./scripts/start-production.sh build

# In production, start services
./scripts/start-production.sh start
./scripts/start-production.sh status
./scripts/start-production.sh stop
```

### 2. Test Deployment Script

```bash
# Test help
./scripts/deploy.sh --help

# Test with mock server (requires DEPLOY_HOST)
export DEPLOY_HOST=your-server.com
./scripts/deploy.sh --help  # Shows usage
```

### 3. Test Backup Script

```bash
# Test help
./scripts/backup.sh --help

# Test backup creation (will create backup dirs)
export APP_DIR=/tmp/test-app
./scripts/backup.sh daily
```

## Configuration Testing

### 1. Test Nginx Configuration

```bash
# Validate nginx config syntax
nginx -t -c config/nginx/productivity-hub.conf
```

### 2. Test Environment Templates

```bash
# Copy and verify environment templates
cp config/env/production.env.template backend/.env
cp config/env/development.env.template backend/.env.dev
```

### 3. Test Gunicorn Configuration

```bash
cd backend
# Test config syntax
python -c "exec(open('gunicorn.conf.py').read())"

# Test Gunicorn start (requires venv with gunicorn)
gunicorn -c gunicorn.conf.py --check-config app:app
```

## Docker Testing

### 1. Test Docker Build

```bash
# Build image
docker build -t productivity-hub .

# Test image
docker run --rm productivity-hub gunicorn --version
```

### 2. Test Docker Compose

```bash
# Copy environment
cp .env.docker.template .env

# Edit .env with proper values, then:
docker-compose config  # Validate compose file
docker-compose up --dry-run
```

## Security Testing

### 1. Test SSL Configuration

- Verify certificate paths in nginx config
- Test SSL settings with SSL Labs or similar

### 2. Test Environment Security

- Ensure .env files are not in git
- Verify secret key generation
- Test HTTPS redirects

## Performance Testing

### 1. Test Application Performance

```bash
# Start application
./scripts/start-production.sh start

# Test with curl
curl -f http://localhost:5000/
curl -f http://localhost:5000/api/health

# Load testing (if available)
ab -n 100 -c 10 http://localhost:5000/
```

### 2. Test Resource Usage

- Monitor memory usage during startup
- Check disk space requirements
- Verify log rotation

## Deployment Validation Checklist

- [ ] All 89 backend tests pass
- [ ] Frontend builds successfully
- [ ] Production startup script works
- [ ] Deployment script validates
- [ ] Backup script creates backups
- [ ] Nginx configuration is valid
- [ ] Gunicorn configuration works
- [ ] Docker image builds
- [ ] Docker compose validates
- [ ] Environment templates are complete
- [ ] Security configurations are in place
- [ ] All dependencies are locked
- [ ] Scripts are executable and working
- [ ] Documentation is comprehensive

## Expected Results

When all tests pass:

- Backend: 89 tests should pass
- Frontend: Build should complete without errors
- Scripts: All scripts should show help and validate
- Configs: All configuration files should be syntactically valid
- Docker: Image should build and container should start
- Security: No secrets in repository, proper permissions set

## Troubleshooting

Common issues and solutions:

1. **Permission denied**: Run `chmod +x scripts/*.sh`
2. **Import errors**: Install requirements: `pip install -r requirements.txt`
3. **Node errors**: Install dependencies: `npm install`
4. **Docker errors**: Check Docker daemon is running
5. **Nginx errors**: Check configuration syntax with `nginx -t`
