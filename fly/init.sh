#!/bin/bash
# Unified initialization script for all services in the Proxy Server Fly.io app

set -e

echo "Starting Proxy Server unified initialization..."

# Create required directories
mkdir -p /data/mongodb /data/redis /data/logs
mkdir -p /var/log/nginx

# Set proper permissions
chown -R mongodb:mongodb /data/mongodb
chown -R redis:redis /data/redis
chown -R www-data:www-data /var/log/nginx

echo "Directories created and permissions set"

# Initialize MongoDB directories only (no automatic user creation)
echo "Setting up MongoDB directories..."
mkdir -p /data/mongodb /data/logs
chown -R mongodb:mongodb /data/mongodb
echo "MongoDB directory setup completed"

# Initialize Redis configuration
echo "Configuring Redis..."
cat > /etc/redis/redis.conf << EOF
# Redis configuration for Fly.io deployment
bind 127.0.0.1
port 6379
appendonly yes
dir /data/redis
logfile /data/logs/redis.log
save 900 1
save 300 10
save 60 10000
maxmemory 256mb
maxmemory-policy allkeys-lru
EOF

echo "Redis configured"

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t
if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid"
else
    echo "Nginx configuration test failed"
    exit 1
fi

echo "All services configured successfully"

# Check if running with supervisor flag
if [[ "$1" == "--supervisor" ]]; then
    echo "Starting all services with supervisor..."
    exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
else
    echo "Initialization complete"
fi
