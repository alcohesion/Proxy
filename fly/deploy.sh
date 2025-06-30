#!/bin/bash

# Quick deployment script for Pori Proxy
# Uses MongoDB Atlas and Redis in the same container

set -e

APP_NAME="pori"

echo "Quick deploy for $APP_NAME"

# Generate secure tokens
AUTH_TOKEN=${AUTH_TOKEN:-$(openssl rand -hex 32)}
HEX_ENCRYPTION_KEY=$(openssl rand -hex 16)

# Read environment variables from src/.env file
if [ -f "../src/.env" ]; then
    echo "Loading environment variables from src/.env..."
    ENV_VARS=""
    
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
            # Extract key=value, handle quotes and spaces
            if [[ "$line" =~ ^[[:space:]]*([^=]+)=(.*)$ ]]; then
                KEY="${BASH_REMATCH[1]// /}"
                VALUE="${BASH_REMATCH[2]}"
                # Remove surrounding quotes if present
                VALUE="${VALUE%\"}"
                VALUE="${VALUE#\"}"
                ENV_VARS="$ENV_VARS $KEY=\"$VALUE\""
            fi
        fi
    done < "../src/.env"
    
    # Add the generated tokens
    ENV_VARS="$ENV_VARS AUTH_TOKEN=\"$AUTH_TOKEN\" HEX_ENCRYPTION_KEY=\"$HEX_ENCRYPTION_KEY\""
    
    echo "Setting all environment variables as Fly secrets..."
    
    # Set all secrets at once
    eval "flyctl secrets set $ENV_VARS --app \"$APP_NAME\""
else
    echo "ERROR: src/.env file not found!"
    echo "Please make sure you're running this script from the fly/ directory"
    exit 1
fi

echo "Deploying..."
cd ..
flyctl deploy --config ./fly/fly.toml --dockerfile ./fly/Dockerfile --app "$APP_NAME"

echo "Deployed! Auth token: $AUTH_TOKEN"
echo "URL: https://$APP_NAME.fly.dev"
