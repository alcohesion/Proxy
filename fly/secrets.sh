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
APP_NAME="pori"

echo "Setting up secrets for $APP_NAME..."

# Generate secure auth token if not provided
AUTH_TOKEN=${AUTH_TOKEN:-$(openssl rand -hex 32)}
echo "Generated AUTH_TOKEN: $AUTH_TOKEN"

# Load environment variables from src/.env file
echo "Loading environment variables from src/.env..."
if [ -f "../src/.env" ]; then
    # Read .env file and prepare secrets
    ENV_VARS=""
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ ! -z "$line" ]] && [[ "$line" =~ ^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*= ]]; then
            # Extract variable name and value
            VAR=$(echo "$line" | cut -d'=' -f1 | xargs)
            VALUE=$(echo "$line" | cut -d'=' -f2- | xargs)
            
            # Add to environment variables list for flyctl secrets set
            if [ ! -z "$VAR" ] && [ ! -z "$VALUE" ]; then
                if [ -z "$ENV_VARS" ]; then
                    ENV_VARS="$VAR=\"$VALUE\""
                else
                    ENV_VARS="$ENV_VARS $VAR=\"$VALUE\""
                fi
                echo "  - $VAR"
            fi
        fi
    done < "../src/.env"
    
    echo "Setting all environment variables as Fly secrets..."
    
    # Set all secrets at once
    eval "flyctl secrets set $ENV_VARS --app \"$APP_NAME\""
else
    echo "ERROR: src/.env file not found!"
    echo "Please make sure you're running this script from the fly/ directory"
    exit 1
fi

echo "Secrets configured successfully!"

# Create volume for persistent data
echo "Setting up persistent volume..."
flyctl volumes create proxy_data --region iad --size 3 --app "$APP_NAME" || echo "Volume may already exist"

# Deploy the application
echo "Deploying application..."
cd ..
flyctl deploy --config ./fly/fly.toml --dockerfile ./fly/Dockerfile --app "$APP_NAME"

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
