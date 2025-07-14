# Configuration Guide

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Server port | `8080` |
| `AUTH_TOKEN` | Authentication token | `abc123xyz789` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/proxy` |
| `TARGET_HOST` | Target server hostname | `localhost` |
| `TARGET_PORT` | Target server port | `3000` |
| `TARGET_PROTOCOL` | Target protocol | `http` |
| `HEX_ENCRYPTION_KEY` | 32-character hex key | `1234567890abcdef1234567890abcdef` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | `redis://localhost:6379` |
| `LOG_LEVEL` | Logging level | `info` | `debug` |
| `MAX_CONNECTIONS` | Maximum WebSocket connections | `1000` | `2000` |
| `CONNECTION_TIMEOUT` | Connection timeout in ms | `30000` | `60000` |
| `REQUEST_TIMEOUT` | Request timeout in ms | `10000` | `15000` |
| `METRICS_INTERVAL` | Metrics collection interval in ms | `60000` | `30000` |
| `CLEANUP_INTERVAL` | Cleanup interval in ms | `300000` | `600000` |
| `MAX_REQUEST_SIZE` | Maximum request size in bytes | `10485760` | `20971520` |
| `ENABLE_COMPRESSION` | Enable gzip compression | `true` | `false` |
| `CORS_ORIGIN` | CORS allowed origins | `*` | `https://example.com` |

### SSL Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `SSL_CERT_PATH` | SSL certificate file path | `/etc/ssl/certs/server.crt` |
| `SSL_KEY_PATH` | SSL private key file path | `/etc/ssl/private/server.key` |
| `SSL_CA_PATH` | SSL CA bundle file path | `/etc/ssl/certs/ca-bundle.crt` |
| `SSL_PASSPHRASE` | SSL key passphrase | `secret-passphrase` |

### Database Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_MAX_POOL_SIZE` | MongoDB connection pool size | `10` |
| `DB_MIN_POOL_SIZE` | MongoDB minimum connections | `2` |
| `DB_MAX_IDLE_TIME` | Connection idle timeout in ms | `30000` |
| `DB_SERVER_SELECTION_TIMEOUT` | Server selection timeout in ms | `5000` |
| `DB_HEARTBEAT_FREQUENCY` | Heartbeat frequency in ms | `10000` |

### Queue Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | `secret-password` |
| `REDIS_DB` | Redis database number | `0` |
| `QUEUE_CONCURRENCY` | Queue processing concurrency | `5` |
| `QUEUE_RETRY_ATTEMPTS` | Failed job retry attempts | `3` |
| `QUEUE_RETRY_DELAY` | Retry delay in ms | `5000` |

## Configuration Files

### Application Configuration

The main configuration is loaded from `src/configs/app.js`:

```javascript
module.exports = {
  server: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    timeout: parseInt(process.env.CONNECTION_TIMEOUT) || 30000
  },
  
  auth: {
    token: process.env.AUTH_TOKEN,
    required: process.env.NODE_ENV === 'production'
  },
  
  target: {
    host: process.env.TARGET_HOST || 'localhost',
    port: parseInt(process.env.TARGET_PORT) || 3000,
    protocol: process.env.TARGET_PROTOCOL || 'http'
  },
  
  encryption: {
    key: process.env.HEX_ENCRYPTION_KEY
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  }
};
```

### Database Configuration

Database settings are in `src/configs/data.js`:

```javascript
module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/proxy',
    options: {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
      maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 30000,
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
      heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQUENCY) || 10000
    }
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0
  }
};
```

### Proxy Configuration

Proxy behavior is configured in `src/configs/proxy.js`:

```javascript
module.exports = {
  connection: {
    maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 1000,
    timeout: parseInt(process.env.CONNECTION_TIMEOUT) || 30000,
    keepAlive: true,
    pingInterval: 30000
  },
  
  request: {
    timeout: parseInt(process.env.REQUEST_TIMEOUT) || 10000,
    maxSize: parseInt(process.env.MAX_REQUEST_SIZE) || 10485760,
    retries: 3,
    retryDelay: 1000
  },
  
  response: {
    compression: process.env.ENABLE_COMPRESSION === 'true',
    headers: {
      'X-Proxy-Version': '1.0.0',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff'
    }
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Tunnel-Token']
  }
};
```

## Environment Files

### Development Configuration

Create `.env.development`:

```env
NODE_ENV=development
PORT=8080
LOG_LEVEL=debug

# Database
MONGODB_URI=mongodb://localhost:27017/proxy_dev
REDIS_URL=redis://localhost:6379

# Target application
TARGET_HOST=localhost
TARGET_PORT=3000
TARGET_PROTOCOL=http

# Security (use weak keys for development only)
AUTH_TOKEN=dev-token-123
HEX_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef

# Performance
MAX_CONNECTIONS=100
CONNECTION_TIMEOUT=30000
REQUEST_TIMEOUT=5000

# Features
ENABLE_COMPRESSION=false
CORS_ORIGIN=*
```

### Production Configuration

Create `.env.production`:

```env
NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb://user:password@localhost:27017/proxy?authSource=admin
REDIS_URL=redis://:password@localhost:6379

# Target application
TARGET_HOST=internal-app
TARGET_PORT=3000
TARGET_PROTOCOL=https

# Security (use strong keys in production)
AUTH_TOKEN=super-secure-random-token-here
HEX_ENCRYPTION_KEY=secure-32-character-hex-key-here

# SSL
SSL_CERT_PATH=/etc/ssl/certs/server.crt
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CA_PATH=/etc/ssl/certs/ca-bundle.crt

# Performance
MAX_CONNECTIONS=2000
CONNECTION_TIMEOUT=60000
REQUEST_TIMEOUT=15000
METRICS_INTERVAL=30000

# Features
ENABLE_COMPRESSION=true
CORS_ORIGIN=https://yourdomain.com
```

### Testing Configuration

Create `.env.test`:

```env
NODE_ENV=test
PORT=0
LOG_LEVEL=error

# Database (use separate test databases)
MONGODB_URI=mongodb://localhost:27017/proxy_test
REDIS_URL=redis://localhost:6379/1

# Target application (mock server)
TARGET_HOST=localhost
TARGET_PORT=0
TARGET_PROTOCOL=http

# Security (test keys)
AUTH_TOKEN=test-token
HEX_ENCRYPTION_KEY=test0123456789abcdef0123456789abcd

# Performance (fast timeouts for tests)
CONNECTION_TIMEOUT=5000
REQUEST_TIMEOUT=2000
CLEANUP_INTERVAL=10000

# Features
ENABLE_COMPRESSION=false
CORS_ORIGIN=*
```

## Docker Configuration

### Development Docker Compose

Configuration in `docker/dev/docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: ../..
      dockerfile: docker/Dockerfile
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/proxy
      - REDIS_URL=redis://redis:6379
      - TARGET_HOST=target-app
      - TARGET_PORT=3000
    ports:
      - "8080:8080"
    depends_on:
      - mongodb
      - redis
    volumes:
      - ../../src:/app/src
      - ../../docs:/app/docs

  mongodb:
    image: mongo:6.0
    environment:
      - MONGO_INITDB_DATABASE=proxy
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7.0
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  mongodb_data:
  redis_data:
```

### Production Docker Compose

Configuration in `docker/prod/docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: tunnel-proxy:latest
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/proxy
      - REDIS_URL=redis://redis:6379
    secrets:
      - ssl_cert
      - ssl_key
      - auth_token
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx:/etc/nginx/conf.d
    secrets:
      - ssl_cert
      - ssl_key
    depends_on:
      - app

secrets:
  ssl_cert:
    external: true
  ssl_key:
    external: true
  auth_token:
    external: true
```

## Security Configuration

### Authentication Setup

1. Generate secure authentication token:
   ```bash
   # Generate random token
   openssl rand -hex 32
   ```

2. Generate encryption key:
   ```bash
   # Generate hex encryption key
   openssl rand -hex 16
   ```

3. Set environment variables:
   ```env
   AUTH_TOKEN=generated-token-here
   HEX_ENCRYPTION_KEY=generated-key-here
   ```

### SSL Certificate Configuration

1. Place certificates in secure location:
   ```bash
   sudo mkdir -p /etc/ssl/tunnel
   sudo cp server.crt /etc/ssl/tunnel/
   sudo cp server.key /etc/ssl/tunnel/
   sudo cp ca-bundle.crt /etc/ssl/tunnel/
   sudo chmod 600 /etc/ssl/tunnel/*
   ```

2. Update environment:
   ```env
   SSL_CERT_PATH=/etc/ssl/tunnel/server.crt
   SSL_KEY_PATH=/etc/ssl/tunnel/server.key
   SSL_CA_PATH=/etc/ssl/tunnel/ca-bundle.crt
   ```

### Database Security

1. Enable MongoDB authentication:
   ```bash
   mongosh admin --eval "
     db.createUser({
       user: 'proxyuser',
       pwd: 'secure-password',
       roles: ['readWrite']
     })
   "
   ```

2. Update connection string:
   ```env
   MONGODB_URI=mongodb://proxyuser:secure-password@localhost:27017/proxy
   ```

### Redis Security

1. Configure Redis password in `/etc/redis/redis.conf`:
   ```
   requirepass secure-redis-password
   ```

2. Update connection:
   ```env
   REDIS_URL=redis://:secure-redis-password@localhost:6379
   ```

## Performance Configuration

### Connection Limits

```env
# Maximum concurrent WebSocket connections
MAX_CONNECTIONS=2000

# Connection timeout in milliseconds
CONNECTION_TIMEOUT=60000

# Request timeout in milliseconds
REQUEST_TIMEOUT=15000

# Maximum request body size in bytes (10MB)
MAX_REQUEST_SIZE=10485760
```

### Memory Management

```env
# Node.js memory options
NODE_OPTIONS=--max-old-space-size=4096

# MongoDB connection pool
DB_MAX_POOL_SIZE=20
DB_MIN_POOL_SIZE=5
DB_MAX_IDLE_TIME=60000
```

### Monitoring Configuration

```env
# Metrics collection interval (30 seconds)
METRICS_INTERVAL=30000

# Cleanup interval (10 minutes)
CLEANUP_INTERVAL=600000

# Enable detailed logging
LOG_LEVEL=info
```

### Compression Settings

```env
# Enable gzip compression for responses
ENABLE_COMPRESSION=true

# Compression level (1-9, 6 is default)
COMPRESSION_LEVEL=6

# Minimum size to compress (bytes)
COMPRESSION_THRESHOLD=1024
```

## Validation

### Configuration Validation Script

Create `scripts/validate-config.js`:

```javascript
const configs = require('../src/configs');

function validateConfig() {
  const required = [
    'AUTH_TOKEN',
    'MONGODB_URI', 
    'TARGET_HOST',
    'TARGET_PORT',
    'HEX_ENCRYPTION_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }
  
  console.log('Configuration validation passed');
}

validateConfig();
```

Run validation:
```bash
node scripts/validate-config.js
```
