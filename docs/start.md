# Quick Start Guide

Get your Proxy Server up and running in just a few minutes.

## Prerequisites

- Node.js 16+ installed
- MongoDB running (local or remote)
- Redis running (local or remote)
- Git (for cloning)

## Step 1: Environment Setup

1. Navigate to the source directory:
   ```bash
   cd src
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Edit your `.env` file:
   ```bash
   nano .env
   ```

   Key variables to configure:
   ```env
   # Server Configuration
   PORT=8080
   HOST=0.0.0.0
   
   # Target Server (what you're proxying to)
   TARGET_HOST=localhost
   TARGET_PORT=3000
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/proxy
   REDIS_URL=redis://localhost:6379
   
   # Security
   AUTH_TOKEN=your-secure-token-here
   ```

## Step 2: Install Dependencies

```bash
npm install
```

This will install:
- `uws` - Ultra-fast WebSocket server
- `mongoose` - MongoDB object modeling
- `bull` - Redis-based queue system
- `ioredis` - Redis client
- `dotenv` - Environment configuration

## Step 3: Start Required Services

### MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or using system service
sudo systemctl start mongodb
```

### Redis
```bash
# Using Docker
docker run -d -p 6379:6379 --name redis redis:latest

# Or using system service
sudo systemctl start redis
```

## Step 4: Run the Application

```bash
npm start
```

You should see output like:
```
✓ MongoDB connected successfully
✓ Redis connected successfully
✓ Proxy server started on localhost:8080
✓ WebSocket endpoints available: /, /metrics
```

## Step 5: Test the Setup

### Test HTTP Health Check
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 1.234
}
```

### Test WebSocket Proxy
```javascript
const ws = new WebSocket('ws://localhost:8080/?token=your-auth-token');
ws.onopen = () => console.log('Connected to proxy');
```

### Test Metrics Dashboard
```javascript
const metricsWs = new WebSocket('ws://localhost:8080/metrics?token=your-auth-token');
metricsWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Metrics:', data);
};
```

## Next Steps

- Read the [Architecture Overview](./architecture.md) to understand the system
- Check the [API Reference](./api-reference.md) for detailed endpoint documentation
- Review [Configuration Guide](./configuration.md) for advanced settings
- See [Deployment Guide](./deployment.md) for production setup

## Common Issues

### Port Already in Use
```bash
# Find what's using the port
lsof -i :8080

# Kill the process if needed
kill -9 <PID>
```

### MongoDB Connection Failed
- Ensure MongoDB is running: `systemctl status mongodb`
- Check the connection string in `.env`
- Verify network connectivity

### Redis Connection Failed
- Ensure Redis is running: `systemctl status redis`
- Check Redis URL in `.env`
- Test connection: `redis-cli ping`

For more troubleshooting, see [Troubleshooting Guide](./troubleshooting.md).
