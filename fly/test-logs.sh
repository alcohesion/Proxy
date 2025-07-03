#!/bin/bash
# Test script to verify logging is working properly

echo "Testing logging configuration..."

# Test if we can see logs from fly logs
echo "Running fly logs to check current logs..."
fly logs --app pori

echo ""
echo "Deploying with logging changes..."
fly deploy --config fly.toml

echo ""
echo "Waiting for deployment to complete..."
sleep 10

echo ""
echo "Checking health endpoint..."
curl -s https://pori.fly.dev/health | jq . || echo "Health check failed"

echo ""
echo "Checking logs after deployment..."
fly logs --app pori

echo ""
echo "To monitor logs in real-time, run:"
echo "fly logs --app pori -f"
