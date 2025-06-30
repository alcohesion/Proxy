#!/bin/bash

# Fly.io Deployment Script for Pori Proxy Server
# This script sets up secrets and deploys the application

set -e

echo "Setting up Pori Proxy deployment on Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "ERROR: flyctl is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "Please log in to Fly.io first:"
    echo "   flyctl auth login"
    exit 1
fi

# App name from fly.toml
APP_NAME="pori-proxy"

echo "Setting up secrets for $APP_NAME..."

# Generate secure auth token if not provided
AUTH_TOKEN=${AUTH_TOKEN:-$(openssl rand -hex 32)}
echo "Generated AUTH_TOKEN: $AUTH_TOKEN"

# Prompt for MongoDB URI (using MongoDB Atlas)
if [ -z "$MONGODB_URI" ]; then
    echo "Please enter your MongoDB Atlas connection string:"
    echo "   Format: mongodb+srv://username:password@cluster.mongodb.net/database"
    read -p "MongoDB URI: " MONGODB_URI
fi

# Prompt for Redis URL (using Upstash Redis)
if [ -z "$REDIS_URL" ]; then
    echo "Please enter your Redis URL (Upstash Redis recommended):"
    echo "   Format: redis://default:password@host:port"
    read -p "Redis URL: " REDIS_URL
fi

# Prompt for target server configuration
if [ -z "$TARGET_HOST" ]; then
    read -p "Target server host (default: localhost): " TARGET_HOST
    TARGET_HOST=${TARGET_HOST:-localhost}
fi

if [ -z "$TARGET_PORT" ]; then
    read -p "Target server port (default: 3000): " TARGET_PORT
    TARGET_PORT=${TARGET_PORT:-3000}
fi

if [ -z "$TARGET_PROTOCOL" ]; then
    read -p "Target server protocol (default: http): " TARGET_PROTOCOL
    TARGET_PROTOCOL=${TARGET_PROTOCOL:-http}
fi

# Generate hex encryption key
HEX_ENCRYPTION_KEY=$(openssl rand -hex 16)

echo "Setting Fly secrets..."

# Set all secrets
flyctl secrets set \
    AUTH_TOKEN="$AUTH_TOKEN" \
    MONGODB_URI="$MONGODB_URI" \
    REDIS_URL="$REDIS_URL" \
    TARGET_HOST="$TARGET_HOST" \
    TARGET_PORT="$TARGET_PORT" \
    TARGET_PROTOCOL="$TARGET_PROTOCOL" \
    HEX_ENCRYPTION_KEY="$HEX_ENCRYPTION_KEY" \
    --app "$APP_NAME"

echo "Secrets configured successfully!"

# Create volume for persistent data
echo "Setting up persistent volume..."
flyctl volumes create proxy_data --region iad --size 3 --app "$APP_NAME" || echo "Volume may already exist"

# Deploy the application
echo "Deploying application..."
flyctl deploy --config ./fly.toml --dockerfile ./Dockerfile --app "$APP_NAME"

echo "Deployment complete!"
echo ""
echo "Your application is available at: https://$APP_NAME.fly.dev"
echo "Health check: https://$APP_NAME.fly.dev/health"
echo "Metrics: wss://$APP_NAME.fly.dev/metrics?token=$AUTH_TOKEN"
echo "Proxy: wss://$APP_NAME.fly.dev/?token=$AUTH_TOKEN"
echo ""
echo "Useful commands:"
echo "   flyctl logs --app $APP_NAME"
echo "   flyctl status --app $APP_NAME"
echo "   flyctl ssh console --app $APP_NAME"
echo ""
echo "To update secrets later:"
echo "   flyctl secrets set KEY=value --app $APP_NAME"
echo ""
echo "Save your AUTH_TOKEN securely: $AUTH_TOKEN"
