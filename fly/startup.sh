#!/bin/bash
# Unified startup script for Proxy Server with MongoDB, Redis, Nginx, and Node.js app

set -e

echo "Starting Proxy Server unified initialization..."

# Create required directories
mkdir -p /data/mongodb /data/redis /data/logs /var/log/nginx

# Set proper permissions
chown -R mongodb:mongodb /data/mongodb
chown -R redis:redis /data/redis
chown -R www-data:www-data /var/log/nginx

echo "Directories created and permissions set"

# Initialize MongoDB
echo "Initializing MongoDB..."
if [ ! -f /data/mongodb/.initialized ]; then
    # Start MongoDB temporarily to initialize
    mongod --dbpath /data/mongodb --bind_ip 127.0.0.1 --port 27017 --fork --logpath /data/logs/mongodb-init.log
    
    # Wait for MongoDB to be ready
    sleep 5
    
    # Create the proxy database
    mongo --eval "db = db.getSiblingDB('proxy'); db.createCollection('test'); print('Database proxy created');"
    
    # Shutdown temporary MongoDB
    mongod --dbpath /data/mongodb --shutdown
    
    # Mark as initialized
    touch /data/mongodb/.initialized
    echo "MongoDB initialized"
else
    echo "MongoDB already initialized"
fi

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

# Start supervisor to manage all services
echo "Starting supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
