# Fly.io Deployment for Pori Proxy

This folder contains all the necessary files for deploying the Pori Proxy server to Fly.io.

## Files Overview

- `fly.toml` - Fly.io application configuration
- `Dockerfile` - Production Docker image configuration
- `secrets.sh` - Interactive script to set up secrets and deploy
- `deploy.sh` - Quick deployment script (requires pre-configured env vars)
- `env.example` - Example environment variables
- `database-setup.md` - Detailed guide for setting up MongoDB and Redis

## Quick Start

### 1. Prerequisites

- Install flyctl: `curl -L https://fly.io/install.sh | sh`
- Login to Fly.io: `flyctl auth login`
- Set up MongoDB Atlas and Upstash Redis accounts

### 2. Interactive Deployment

```bash
cd fly/
./secrets.sh
```

This script will:
- Prompt for MongoDB and Redis URLs
- Generate secure tokens
- Set up Fly.io secrets
- Deploy the application

### 3. Quick Deployment (if you have env vars ready)

```bash
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/pori-proxy"
export REDIS_URL="redis://default:password@host:port"
export TARGET_HOST="your-target-server.com"
export TARGET_PORT="3000"

cd fly/
./deploy.sh
```

## Configuration

### Required Environment Variables

- `MONGODB_URI` - MongoDB connection string (MongoDB Atlas recommended)
- `REDIS_URL` - Redis connection URL (Upstash Redis recommended)
- `AUTH_TOKEN` - Authentication token for WebSocket connections
- `TARGET_HOST` - Target server hostname to proxy requests to
- `TARGET_PORT` - Target server port
- `TARGET_PROTOCOL` - Target server protocol (http/https)
- `HEX_ENCRYPTION_KEY` - 32-character hex key for ID encryption

### Optional Environment Variables

- `NODE_ENV` - Node.js environment (production)
- `PORT` - Application port (8080)
- `HOST` - Application host (0.0.0.0)
- `PROXY_TIMEOUT` - Request timeout in milliseconds (30000)

## Database Setup

### MongoDB Atlas (Recommended)

1. Create a free MongoDB Atlas account
2. Create a new cluster and database named `pori-proxy`
3. Create a database user with read/write permissions
4. Get the connection string: `mongodb+srv://username:password@cluster.mongodb.net/pori-proxy`

### Upstash Redis (Recommended)

1. Create a free Upstash account
2. Create a new Redis database
3. Get the connection URL: `redis://default:password@host:port`

See `database-setup.md` for detailed instructions.

## Deployment Process

The deployment process includes:

1. **Secret Management** - All sensitive data is stored as Fly.io secrets
2. **Volume Creation** - Persistent volume for application data
3. **Health Checks** - Automatic health monitoring
4. **SSL Termination** - HTTPS and WSS support
5. **Auto Scaling** - Automatic machine management

## Monitoring

### Application Status
```bash
flyctl status --app pori-proxy
```

### View Logs
```bash
flyctl logs --app pori-proxy
```

### SSH Access
```bash
flyctl ssh console --app pori-proxy
```

### Metrics
```bash
flyctl metrics --app pori-proxy
```

## API Endpoints

Once deployed, your application will be available at:

- **Health Check**: `https://pori-proxy.fly.dev/health`
- **Proxy WebSocket**: `wss://pori-proxy.fly.dev/?token=YOUR_AUTH_TOKEN`
- **Metrics WebSocket**: `wss://pori-proxy.fly.dev/metrics?token=YOUR_AUTH_TOKEN`

## Scaling

### Vertical Scaling (More Resources)
```bash
flyctl scale memory 2048 --app pori-proxy
flyctl scale cpu-kind performance --app pori-proxy
```

### Horizontal Scaling (More Machines)
```bash
flyctl scale count 2 --app pori-proxy
```

## Updates

### Deploy New Version
```bash
cd fly/
flyctl deploy --config ./fly.toml --dockerfile ./Dockerfile --app pori-proxy
```

### Update Secrets
```bash
flyctl secrets set NEW_SECRET=value --app pori-proxy
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if MongoDB/Redis URLs are correct
   - Verify IP whitelist settings in MongoDB Atlas

2. **Authentication Errors**
   - Verify AUTH_TOKEN is set correctly
   - Check WebSocket connection parameters

3. **Deploy Failures**
   - Check Dockerfile syntax
   - Verify all secrets are set
   - Check application logs

### Debug Commands

```bash
# Check secrets
flyctl secrets list --app pori-proxy

# Restart application
flyctl apps restart pori-proxy

# Check machine status
flyctl machine list --app pori-proxy

# View detailed logs
flyctl logs --app pori-proxy -f
```

## Security

- All secrets are encrypted by Fly.io
- Database connections use TLS encryption
- Application uses secure WebSocket connections (WSS)
- Auto-generated tokens are cryptographically secure
- Non-root Docker user for enhanced security

## Cost Optimization

- Free MongoDB Atlas M0 cluster (512MB)
- Free Upstash Redis (10MB)
- Fly.io free tier includes 3 shared-cpu-1x machines
- Auto-stop/start machines to reduce costs
- Persistent volumes for data that survives deployments
