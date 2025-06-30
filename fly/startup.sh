#!/bin/bash
# Unified startup script for Proxy Server with MongoDB, Redis, Nginx, and Node.js app

set -e

echo "Starting Proxy Server unified initialization..."

# Create required directories
mkdir -p /data/mongodb /data/redis /data/logs /var/log/nginx

# Set proper permissions
chmod -R 755 /data
chown -R root:root /data

echo "Directories created and permissions set"

# Initialize MongoDB
echo "Initializing MongoDB..."

# Ensure log file exists and has proper permissions
touch /data/logs/mongodb.log
chmod 644 /data/logs/mongodb.log

if [ ! -f /data/mongodb/.initialized ]; then
    # Start MongoDB temporarily to initialize
    echo "Starting MongoDB for initialization..."
    mongod --dbpath /data/mongodb --logpath /data/logs/mongodb-init.log --bind_ip 127.0.0.1 --port 27017 --noauth --fork
    
    # Wait for MongoDB to be ready
    echo "Waiting for MongoDB to start..."
    sleep 10
    
    # Wait for MongoDB to accept connections
    timeout=30
    while ! mongosh --eval "print('MongoDB is ready')" >/dev/null 2>&1 && [ $timeout -gt 0 ]; do
        echo "Waiting for MongoDB connection... ($timeout seconds left)"
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        echo "MongoDB failed to start within timeout, trying with mongo client..."
        if ! mongo --eval "print('MongoDB is ready')" >/dev/null 2>&1; then
            echo "MongoDB initialization failed"
            cat /data/logs/mongodb.log
            exit 1
        fi
    fi
    
    # Create the proxy database
    echo "Creating proxy database..."
    mongosh --eval "db = db.getSiblingDB('proxy'); db.createCollection('test'); print('Database proxy created');" || mongo --eval "db = db.getSiblingDB('proxy'); db.createCollection('test'); print('Database proxy created');"
    
    # Shutdown temporary MongoDB
    mongod --shutdown --dbpath /data/mongodb
    
    # Mark as initialized
    touch /data/mongodb/.initialized
    echo "MongoDB initialized"
else
    echo "MongoDB already initialized"
fi

# Initialize Redis configuration
echo "Configuring Redis..."
mkdir -p /etc/redis
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
daemonize no
EOF

echo "Redis configured"

# Initialize Redis data directory
echo "Initializing Redis..."
touch /data/logs/redis.log
chmod 644 /data/logs/redis.log

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
