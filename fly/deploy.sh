#!/bin/bash

# Quick deployment script for Pori Proxy
# This script assumes you already have MongoDB and Redis URLs

set -e

APP_NAME="pori-proxy"

echo "Quick deploy for $APP_NAME"

# Check required environment variables
if [ -z "$MONGODB_URI" ]; then
    echo "ERROR: MONGODB_URI environment variable is required"
    echo "   Export it: export MONGODB_URI='mongodb+srv://...'"
    exit 1
fi

if [ -z "$REDIS_URL" ]; then
    echo "ERROR: REDIS_URL environment variable is required"
    echo "   Export it: export REDIS_URL='redis://...'"
    exit 1
fi

# Generate secure tokens
AUTH_TOKEN=${AUTH_TOKEN:-$(openssl rand -hex 32)}
HEX_ENCRYPTION_KEY=$(openssl rand -hex 16)

# Set default target values
TARGET_HOST=${TARGET_HOST:-localhost}
TARGET_PORT=${TARGET_PORT:-3000}
TARGET_PROTOCOL=${TARGET_PROTOCOL:-http}

echo "Setting secrets..."
flyctl secrets set \
    AUTH_TOKEN="$AUTH_TOKEN" \
    MONGODB_URI="$MONGODB_URI" \
    REDIS_URL="$REDIS_URL" \
    TARGET_HOST="$TARGET_HOST" \
    TARGET_PORT="$TARGET_PORT" \
    TARGET_PROTOCOL="$TARGET_PROTOCOL" \
    HEX_ENCRYPTION_KEY="$HEX_ENCRYPTION_KEY" \
    --app "$APP_NAME"

echo "Deploying..."
flyctl deploy --config ./fly.toml --dockerfile ./Dockerfile --app "$APP_NAME"

echo "Deployed! Auth token: $AUTH_TOKEN"
echo "URL: https://$APP_NAME.fly.dev"
