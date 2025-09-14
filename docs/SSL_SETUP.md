# SSL/HTTPS Setup Guide for Productivity Hub

This guide provides comprehensive instructions for setting up SSL/HTTPS certificates for your Productivity Hub deployment.

## Table of Contents

- [Overview](#overview)
- [Let's Encrypt (Recommended)](#lets-encrypt-recommended)
- [Commercial SSL Certificates](#commercial-ssl-certificates)
- [Self-Signed Certificates (Development)](#self-signed-certificates-development)
- [Nginx Configuration Validation](#nginx-configuration-validation)
- [Certificate Renewal](#certificate-renewal)
- [Troubleshooting](#troubleshooting)

## Overview

SSL/HTTPS is essential for production deployments. This guide covers three methods:

1. **Let's Encrypt**: Free, automated certificates (recommended for production)
2. **Commercial SSL**: Purchased certificates from certificate authorities
3. **Self-Signed**: For development/testing environments only

## Let's Encrypt (Recommended)

### Prerequisites

- Domain name pointing to your server's IP address
- Port 80 and 443 open in firewall
- Nginx installed and running

### Installation Steps

1. **Install Certbot**

   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install certbot python3-certbot-nginx

   # CentOS/RHEL
   sudo yum install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**

   ```bash
   # Replace with your actual domain
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Follow Interactive Prompts**
   - Enter email address for renewal notifications
   - Agree to terms of service
   - Choose whether to share email with EFF
   - Select redirect option (recommended: redirect HTTP to HTTPS)

4. **Verify Installation**

   ```bash
   # Check certificate status
   sudo certbot certificates

   # Test certificate
   curl -I https://your-domain.com
   ```

### Configuration Update

After obtaining Let's Encrypt certificates, update your Nginx configuration:

```bash
# The certificates will be automatically placed at:
# Certificate: /etc/letsencrypt/live/your-domain.com/fullchain.pem
# Private Key: /etc/letsencrypt/live/your-domain.com/privkey.pem

# Update the SSL configuration in productivity-hub.conf
sudo nano /etc/nginx/sites-available/productivity-hub.conf
```

## Commercial SSL Certificates

### Certificate Purchase Process

1. **Choose a Certificate Authority**
   - DigiCert, Comodo, GlobalSign, GoDaddy, etc.
   - Consider validation level: Domain Validated (DV), Organization Validated (OV), or Extended Validation (EV)

2. **Generate Certificate Signing Request (CSR)**

   ```bash
   # Generate private key
   sudo openssl genrsa -out /etc/ssl/private/your-domain.com.key 2048

   # Generate CSR
   sudo openssl req -new -key /etc/ssl/private/your-domain.com.key -out /etc/ssl/certs/your-domain.com.csr

   # Follow prompts:
   # Country Name: US
   # State: Your State
   # City: Your City
   # Organization: Your Organization
   # Organizational Unit: IT Department
   # Common Name: your-domain.com (IMPORTANT: exact domain)
   # Email: your-email@domain.com
   # Challenge password: (leave blank)
   # Optional company name: (leave blank)
   ```

3. **Submit CSR to Certificate Authority**
   - Upload the CSR file to your chosen CA
   - Complete validation process (varies by CA and validation level)
   - Download issued certificate files

4. **Install Certificate**

   ```bash
   # Copy certificate files to appropriate locations
   sudo cp your-domain.com.crt /etc/ssl/certs/
   sudo cp your-domain.com.key /etc/ssl/private/
   sudo cp intermediate.crt /etc/ssl/certs/ # If provided

   # Set proper permissions
   sudo chmod 644 /etc/ssl/certs/your-domain.com.crt
   sudo chmod 600 /etc/ssl/private/your-domain.com.key
   sudo chown root:root /etc/ssl/certs/your-domain.com.crt
   sudo chown root:root /etc/ssl/private/your-domain.com.key
   ```

## Self-Signed Certificates (Development)

**Warning**: Only use for development/testing. Browsers will show security warnings.

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/productivity-hub-selfsigned.key \
  -out /etc/ssl/certs/productivity-hub-selfsigned.crt

# Set permissions
sudo chmod 600 /etc/ssl/private/productivity-hub-selfsigned.key
sudo chmod 644 /etc/ssl/certs/productivity-hub-selfsigned.crt
```

## Nginx Configuration Validation

### Pre-Deployment Validation Script

Create a script to validate your Nginx configuration before deployment:

```bash
#!/bin/bash
# nginx-config-validator.sh

CONFIG_FILE="/etc/nginx/sites-available/productivity-hub.conf"
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d-%H%M%S)"

validate_nginx_config() {
    echo "Validating Nginx configuration..."

    # Check if config file exists
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "ERROR: Configuration file not found: $CONFIG_FILE"
        exit 1
    fi

    # Check for placeholder values
    echo "Checking for placeholder values..."

    PLACEHOLDERS=(
        "your-domain.com"
        "/path/to/your/certificate.crt"
        "/path/to/your/private.key"
        "productivity.weatherboysuper.com"
    )

    for placeholder in "${PLACEHOLDERS[@]}"; do
        if grep -q "$placeholder" "$CONFIG_FILE"; then
            echo "WARNING: Found placeholder value '$placeholder' in config file"
            echo "Please update this value before deploying"
        fi
    done

    # Test Nginx configuration syntax
    echo "Testing Nginx syntax..."
    if sudo nginx -t; then
        echo "✓ Nginx configuration syntax is valid"
    else
        echo "✗ Nginx configuration syntax error"
        exit 1
    fi

    # Check SSL certificate files (if specified)
    SSL_CERT=$(grep -o 'ssl_certificate [^;]*' "$CONFIG_FILE" | cut -d' ' -f2)
    SSL_KEY=$(grep -o 'ssl_certificate_key [^;]*' "$CONFIG_FILE" | cut -d' ' -f2)

    if [ -n "$SSL_CERT" ] && [ "$SSL_CERT" != "/path/to/your/certificate.crt" ]; then
        if [ -f "$SSL_CERT" ]; then
            echo "✓ SSL certificate found: $SSL_CERT"
        else
            echo "✗ SSL certificate not found: $SSL_CERT"
        fi
    fi

    if [ -n "$SSL_KEY" ] && [ "$SSL_KEY" != "/path/to/your/private.key" ]; then
        if [ -f "$SSL_KEY" ]; then
            echo "✓ SSL private key found: $SSL_KEY"
        else
            echo "✗ SSL private key not found: $SSL_KEY"
        fi
    fi
}

# Create backup before validation
echo "Creating backup of current configuration..."
sudo cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"

# Run validation
validate_nginx_config

echo "Validation complete!"
```

### Configuration Checklist

Before deploying, ensure you've updated:

- [ ] `server_name` directive with your actual domain(s)
- [ ] `ssl_certificate` path to your certificate file
- [ ] `ssl_certificate_key` path to your private key file
- [ ] Any custom paths or settings specific to your environment

## Certificate Renewal

### Let's Encrypt Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run

# Set up automatic renewal (crontab)
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet && /usr/sbin/nginx -s reload

# Or use systemd timer (Ubuntu 18.04+)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Commercial Certificate Renewal

1. **Monitor Expiration**
   - Set calendar reminders 30 days before expiration
   - Use monitoring tools like SSL Labs or Nagios

2. **Renewal Process**
   - Generate new CSR (optional, can reuse private key)
   - Purchase/renew through certificate authority
   - Install new certificate files
   - Restart Nginx

```bash
# Check certificate expiration
openssl x509 -in /etc/ssl/certs/your-domain.com.crt -text -noout | grep "Not After"

# Or check remotely
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Troubleshooting

### Common Issues

1. **Certificate Chain Issues**

   ```bash
   # Test certificate chain
   openssl s_client -connect your-domain.com:443 -servername your-domain.com

   # If chain is incomplete, concatenate intermediate certificates
   cat your-domain.com.crt intermediate.crt > your-domain.com-chained.crt
   ```

2. **Permission Errors**

   ```bash
   # Fix certificate permissions
   sudo chmod 644 /etc/ssl/certs/*.crt
   sudo chmod 600 /etc/ssl/private/*.key
   sudo chown root:root /etc/ssl/certs/*.crt
   sudo chown root:root /etc/ssl/private/*.key
   ```

3. **Port Blocking**

   ```bash
   # Check if ports are open
   sudo netstat -tlnp | grep :443
   sudo ufw status

   # Open required ports
   sudo ufw allow 80
   sudo ufw allow 443
   ```

4. **DNS Issues**
   ```bash
   # Verify DNS resolution
   nslookup your-domain.com
   dig your-domain.com
   ```

### Validation Tools

- **SSL Labs Test**: https://www.ssllabs.com/ssltest/
- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html
- **Let's Encrypt CT Logs**: https://crt.sh/

### Emergency Certificate Replacement

If you need to quickly replace a certificate:

```bash
# 1. Backup current configuration
sudo cp /etc/nginx/sites-available/productivity-hub.conf /etc/nginx/sites-available/productivity-hub.conf.backup

# 2. Update certificate paths in Nginx config
sudo nano /etc/nginx/sites-available/productivity-hub.conf

# 3. Test configuration
sudo nginx -t

# 4. Reload Nginx (don't restart unless necessary)
sudo nginx -s reload

# 5. Verify certificate
curl -I https://your-domain.com
```

## Security Best Practices

- **Use Strong Ciphers**: The provided Nginx configuration includes modern cipher suites
- **Enable HSTS**: Forces browsers to use HTTPS
- **OCSP Stapling**: Improves SSL handshake performance
- **Certificate Transparency**: Monitor certificate issuance
- **Regular Updates**: Keep Nginx and OpenSSL updated

For additional support, consult your certificate authority's documentation or contact their support team.
