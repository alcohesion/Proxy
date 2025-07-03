#!/bin/bash
# Docker initialization script for the proxy server app

set -e

echo "Starting Docker proxy server initialization..."

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
while ! nc -z mongo 27017; do
    echo "MongoDB is not ready yet. Waiting..."
    sleep 2
done
echo "MongoDB is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
while ! nc -z redis 6379; do
    echo "Redis is not ready yet. Waiting..."
    sleep 2
done
echo "Redis is ready!"

# Initialize MongoDB if needed
echo "Initializing MongoDB..."
mongosh --host mongo:27017 --eval "
    use proxy;
    try {
        db.createCollection('devices');
        db.createCollection('metrics');
        db.createCollection('requests');
        print('Collections created successfully');
    } catch (e) {
        print('Collections may already exist: ' + e.message);
    }
" || echo "MongoDB initialization completed (collections may already exist)"

echo "Docker initialization completed successfully!"

# Start the application
echo "Starting the proxy server application..."
exec node app.js
