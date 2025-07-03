#!/bin/bash
# Docker deployment script for the proxy server

set -e

echo "Starting Docker deployment for proxy server..."

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "Error: Docker and docker-compose are required but not installed."
    exit 1
fi

# Use docker compose or docker-compose based on availability
COMPOSE_CMD="docker compose"
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo "Error: Neither 'docker compose' nor 'docker-compose' is available."
        exit 1
    fi
fi

# Navigate to docker directory
cd "$(dirname "$0")"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.template .env
    echo "Please edit .env file with your configuration before deploying."
    echo "Using default configuration for now..."
fi

# Pull latest images
echo "Pulling latest images..."
$COMPOSE_CMD pull

# Build the application
echo "Building the application..."
$COMPOSE_CMD build --no-cache

# Stop existing containers if running
echo "Stopping existing containers..."
$COMPOSE_CMD down

# Start the services
echo "Starting services..."
$COMPOSE_CMD up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check service health
echo "Checking service health..."
$COMPOSE_CMD ps

# Show logs
echo "Showing recent logs..."
$COMPOSE_CMD logs --tail=20

echo ""
echo "Deployment completed!"
echo "Services are running at:"
echo "  - Application: http://localhost:80"
echo "  - Direct App: http://localhost:8080"
echo "  - MongoDB: mongodb://localhost:27017"
echo "  - Redis: redis://localhost:6379"
echo ""
echo "To view logs: $COMPOSE_CMD logs -f"
echo "To stop: $COMPOSE_CMD down"
echo "To restart: $COMPOSE_CMD restart"
