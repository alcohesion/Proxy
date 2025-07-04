# SSL Certificate Instructions
# 
# This directory should contain your SSL certificates for production.
# You have several options:

## Option 1: Let's Encrypt (Recommended)
# The docker-compose.yml includes a certbot service that can automatically
# obtain certificates. Update the docker-compose.yml with your domain and email:
# 1. Replace "yourdomain.com" with your actual domain
# 2. Replace "admin@yourdomain.com" with your email
# 3. Run: docker compose up certbot

## Option 2: Manual Certificate Placement
# If you have existing certificates, place them here:
# - cert.pem (or fullchain.pem for Let's Encrypt)
# - key.pem (or privkey.pem for Let's Encrypt)

## Option 3: Self-Signed Certificates (Development/Testing Only)
# Generate self-signed certificates with:
# openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#   -keyout key.pem -out cert.pem \
#   -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"

## Certificate Renewal
# For Let's Encrypt certificates, add this to your crontab for auto-renewal:
# 0 12 * * * /usr/local/bin/docker compose -f /path/to/docker-compose.yml run --rm certbot renew --quiet && /usr/local/bin/docker compose -f /path/to/docker-compose.yml exec nginx nginx -s reload

# Important: Make sure to update the nginx configuration files with your actual domain name!
