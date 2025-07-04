# Proxy Server

A high-performance HTTP/WebSocket proxy server built with uWebSockets.js and MongoDB, designed for real-time request forwarding and comprehensive analytics.

## Features

- **High-Performance WebSocket Proxy**: Built on uWebSockets.js for maximum throughput
- **Real-time Analytics Dashboard**: Live metrics and device tracking via WebSocket
- **MongoDB Integration**: Persistent storage for requests, devices, and analytics
- **Secure Authentication**: Token-based authentication for all endpoints
- **Comprehensive Logging**: Detailed request/response logging with analytics
- **Scalable Architecture**: Modular design with separation of concerns
- **Professional Documentation**: Complete API reference and usage examples

## Architecture

```
src/
├── app.js                  # Main application entry point
├── configs/                # Configuration management
│   ├── app.js             # Application configuration
│   ├── data.js            # Database configuration
│   ├── index.js           # Configuration exports
│   └── proxy.js           # Proxy settings
├── models/                 # MongoDB data models
│   ├── connect.js         # Database connection
│   ├── device.js          # Device tracking model
│   ├── index.js           # Model exports
│   ├── metrics.js         # Analytics metrics model
│   └── request.js         # Request logging model
├── queries/                # Database query operations (factory pattern)
│   ├── device/            # Device query operations
│   │   ├── index.js       # Device query factory
│   │   └── operations/    # Modular operations
│   │       ├── crud.js    # Create, update, delete operations
│   │       ├── find.js    # Find operations
│   │       ├── index.js   # Operations exports
│   │       └── stats.js   # Statistics operations
│   ├── metrics/           # Metrics query operations
│   │   ├── index.js       # Metrics query factory
│   │   └── operations/    # Modular operations
│   │       ├── crud.js    # Create, update, delete operations
│   │       └── index.js   # Operations exports
│   ├── request/           # Request query operations
│   │   ├── index.js       # Request query factory
│   │   └── operations/    # Modular operations
│   │       ├── crud.js    # Create, update, delete operations
│   │       ├── find.js    # Find operations
│   │       └── stats.js   # Statistics operations
│   └── index.js           # Query factory exports
├── handlers/               # WebSocket event handlers
│   ├── index.js           # Handler exports
│   ├── metrics/           # Metrics handlers
│   │   ├── auth.js        # Authentication handler
│   │   ├── connection.js  # Connection handler
│   │   ├── index.js       # Metrics handler exports
│   │   ├── interval.js    # Interval metrics handler
│   │   └── message.js     # Message handler
│   └── proxy/             # Proxy handlers
│       ├── auth.js        # Authentication handler
│       ├── index.js       # Proxy handler exports
│       ├── connection/    # Connection management
│       │   ├── handle.js  # Connection handler
│       │   ├── index.js   # Connection exports
│       │   ├── manager.js # Connection manager
│       │   ├── tester.js  # Connection tester
│       │   └── validator.js # Connection validator
│       └── message/       # Message handling
│           ├── error.js   # Error message handler
│           ├── index.js   # Message exports
│           ├── req.js     # Request message handler
│           └── res.js     # Response message handler
├── services/               # Business logic services
│   ├── health/            # Health check services
│   │   ├── index.js       # Health service exports
│   │   └── handlers/      # Health handlers
│   │       ├── index.js   # Handler exports
│   │       └── status.js  # Status handler
│   ├── metrics/           # Analytics services
│   │   └── index.js       # Metrics service
│   ├── proxy/             # Proxy services
│   │   ├── index.js       # Proxy service exports
│   │   └── handlers/      # Proxy handlers
│   │       ├── index.js   # Handler exports
│   │       └── request.js # Request handler
│   └── index.js           # Service exports
├── wss/                   # WebSocket servers
│   ├── index.js           # WebSocket exports
│   ├── metrics.js         # Metrics WebSocket server
│   └── proxy.js           # Proxy WebSocket server
├── utils/                 # Utility functions
│   ├── client/            # Client utilities
│   │   ├── index.js       # Client exports
│   │   └── manager.js     # Client manager
│   ├── crypto/            # Cryptographic utilities
│   │   ├── generator.js   # Hex ID generator
│   │   └── index.js       # Crypto exports
│   ├── http/              # HTTP utilities
│   │   ├── forward.js     # Request forwarding
│   │   └── index.js       # HTTP exports
│   ├── metrics/           # Metrics utilities
│   │   ├── broadcast.js   # Metrics broadcasting
│   │   └── index.js       # Metrics exports
│   └── index.js           # Utility exports
├── queues/                # Background job processing
│   ├── bull/              # Bull queue integration
│   │   ├── index.js       # Bull exports
│   │   ├── metrics.js     # Metrics queue
│   │   ├── queues.js      # Queue definitions
│   │   └── request.js     # Request queue
│   └── index.js           # Queue exports
└── logging/               # Logging utilities
    └── index.js           # Logging configuration
```

## Installation & Deployment

### Option 1: Docker Deployment (Recommended for Production)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tunnel
   ```

2. **Development Environment**
   ```bash
   cd docker
   make setup-env        # Create environment files
   make start            # Start development environment
   make dev-logs         # View development logs
   ```
   Access: http://localhost

3. **Production Environment**
   ```bash
   cd docker
   make setup-env        # Create environment files
   # Configure GitHub secrets: SSL_CERT, SSL_KEY, SSL_CA_BUNDLE, etc.
   # Deploy via GitHub Actions workflow (includes smart cache management)
   make prod-start       # Start production (after deployment)
   make prod-logs        # View production logs
   make prod-status      # Check production status
   ```
   Access: https://yourdomain.com

### Docker Build Commands

The project supports intelligent cache management for faster, more efficient deployments:

```bash
# Development with no cache
make dev-build-no-cache   # Rebuild development without cache
make dev-clean           # Clean development environment

# Production with no cache  
make prod-build-no-cache  # Rebuild production without cache
make prod-clean          # Clean production environment

# Smart cache management (preserves MongoDB/Redis/Nginx images for faster deployments)
make clean-app-only      # Clean only application containers/images (ultra-safe)
make clean-cache         # Clean application caches (preserve base images)
make clean-docker-cache  # Clean Docker cache (preserve base images)
make status-all          # Check status of both environments
```

### Option 2: Manual Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tunnel
   ```

2. **Install dependencies**
   ```bash
   cd src
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## Configuration

### Docker Configuration (Recommended)

For Docker deployments, configuration is managed through environment files:

- **Development**: `docker/dev/.env` - HTTP-only configuration
- **Production**: `docker/prod/.env` - HTTPS with SSL configuration

Key configuration areas:
- **SSL Certificates**: Managed via GitHub secrets (SSL_CERT, SSL_KEY, SSL_CA_BUNDLE)
- **Database**: MongoDB with authentication in production
- **Cache**: Redis with authentication in production
- **Security**: Token-based authentication and rate limiting
- **No-Cache Builds**: Automatic cache clearing in deployment workflow

The deployment workflow automatically:
- Clears all Docker, Node.js, and application caches
- Forces no-cache Docker builds using BuildKit
- Ensures fresh code deployment without any cached artifacts
- Removes all temporary files and build artifacts

See [docker/README.md](docker/README.md) for complete Docker configuration guide.

### Manual Configuration

Copy `src/.env.example` to `src/.env` and configure the following variables:

```env
# Application Configuration
NODE_ENV=development
PORT=8080
AUTH_TOKEN=your-secure-auth-token

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/proxy
REDIS_URL=redis://localhost:6379

# Proxy Configuration
TARGET_HOST=localhost
TARGET_PORT=3000
TARGET_PROTOCOL=http

# Security Configuration
HEX_ENCRYPTION_KEY=your-32-char-hex-encryption-key
```

### Database Setup

**Docker Deployment (Recommended):**
- MongoDB and Redis are automatically configured and started with the Docker environment
- Production includes authentication and security features
- Data persistence through Docker volumes

**Manual Setup:**
- Ensure MongoDB is running and accessible at the configured URI
- Ensure Redis is running for queue processing (optional)
- The application will automatically create necessary collections and indexes

## API Endpoints

### HTTP Endpoints

- **GET /health** - Health check endpoint
- **GET /status** - Detailed system status
- **GET /static/** - Static file serving

### WebSocket Endpoints

- **WS /** - Main proxy endpoint for request forwarding
- **WS /metrics** - Real-time analytics and metrics dashboard

For complete API documentation, see [docs/api.md](docs/api.md).

## Database Query Architecture

The project uses a modular factory pattern for database queries with dependency injection:

### Query Factory Pattern

```javascript
// Query factories accept model and log dependencies
const queries = require('./queries');

// Initialize with dependencies
const deviceQueries = queries.device(DeviceModel, logger);
const requestQueries = queries.request(RequestModel, logger);
const metricsQueries = queries.metrics(MetricsModel, logger);

// Use operations by category
await deviceQueries.crud.createOrUpdate(deviceData);
await deviceQueries.find.byHex(hexId);
await deviceQueries.stats.getCount();

await requestQueries.crud.create(requestData);
await requestQueries.find.byDevice(deviceId);
await requestQueries.stats.getSuccessRate();

await metricsQueries.crud.create(metricsData);
```

### Query Operations Structure

Each query module is organized by operation type:

- **crud.js**: Create, update, delete operations
- **find.js**: Find and search operations  
- **stats.js**: Statistics and aggregation operations

This ensures:
- **Single responsibility** - Each file handles one type of operation
- **Dependency injection** - No hardcoded logging or model dependencies
- **Testability** - Easy to mock dependencies for testing
- **Consistency** - All error handling uses injected logger

## Usage Examples

### Basic Proxy Connection

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/?token=your-auth-token');

ws.on('open', () => {
  // Send HTTP request through proxy
  ws.send(JSON.stringify({
    id: 'unique-request-id',
    method: 'GET',
    path: '/api/data',
    headers: {
      'Content-Type': 'application/json'
    }
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log('Response:', response);
});
```

### Metrics Dashboard Connection

```javascript
const metricsWs = new WebSocket('ws://localhost:8080/metrics?token=your-auth-token');

metricsWs.on('message', (data) => {
  const metrics = JSON.parse(data.toString());
  console.log(`${metrics.type}:`, metrics.data);
});
```

## Development

### Prerequisites

- Node.js 18+ 
- MongoDB 4.4+
- Redis 6+ (optional, for advanced queuing)

### Running in Development Mode

```bash
# Install dependencies
npm install

# Start with automatic restarts
npm run dev

# Run tests
npm test

# Check code style
npm run lint
```

### Project Structure

The project follows a deep modular architecture pattern with strict naming conventions:

- **All folder and file names are lowercase** - No hyphens, underscores, camelCase, or dots
- **Maximum folder depth** - Extensive subfolders to categorize functionality
- **Single responsibility** - Each file focuses on one specific function or feature
- **Factory pattern for queries** - All database queries use dependency injection

Key architectural principles:
- **configs/**: Application configuration and settings
- **models/**: MongoDB schema definitions with automatic hex generation hooks
- **queries/**: Database query factories accepting model and log dependencies
  - **operations/**: Split by operation type (crud, find, stats, etc.)
- **handlers/**: WebSocket event handlers split by responsibility
- **services/**: Business logic services with health checks
- **utils/**: Utility functions organized by domain (crypto, http, metrics, etc.)
- **queues/**: Background job processing with Bull integration
- **logging/**: Centralized logging with dependency injection (no console statements)

All query modules now use passed-in logging instead of console statements, enabling better error tracking and debugging.

## Security Considerations

- **Token Authentication**: All WebSocket connections require valid authentication tokens
- **Input Validation**: All incoming data is validated before processing
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Secure Headers**: Security headers are set for all HTTP responses
- **Encrypted IDs**: All document IDs use robust hex generation with pre-validate hooks
- **No-Cache Builds**: Deployment ensures no cached code or credentials in builds
- **SSL/TLS**: Production deployment with proper certificate chain validation
- **Environment Isolation**: Separate configurations for development and production
- **Dependency Injection**: Logging and database connections use dependency injection pattern

## Performance

- **uWebSockets.js**: High-performance WebSocket implementation
- **Connection Pooling**: Efficient database connection management
- **Async Processing**: Non-blocking I/O operations throughout
- **Memory Management**: Proper cleanup and garbage collection
- **Metrics Tracking**: Built-in performance monitoring

## Monitoring

### Available Metrics

- Request count and success rates
- Response time statistics
- Active device tracking
- Connection statistics
- Database performance metrics

### Health Checks

- **GET /health**: Basic health status
- **GET /status**: Comprehensive system status including database connections

## Troubleshooting

### Common Issues

1. **Connection refused errors**: Verify target server is running and accessible
2. **Authentication failures**: Check AUTH_TOKEN environment variable
3. **Database connection errors**: Verify MongoDB is running and URI is correct
4. **High memory usage**: Monitor request logging and adjust retention policies

### Debugging

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

### Build and Deployment Issues

1. **Cache-related problems**: Use `make clean-cache` or `make prod-build-no-cache` to force clean builds
2. **Docker build failures**: Check Docker daemon and clear system cache with `make clean-docker-cache`
3. **Stale code in production**: The deployment workflow automatically clears all caches and forces fresh builds
4. **SSL certificate issues**: Use `make prod-verify-ssl` to check certificate chain
5. **Environment configuration**: Use `make check-env` to verify environment file status

### Development Workflow

For development with cache clearing:
```bash
# Clean development environment
make dev-clean

# Rebuild without cache
make dev-build-no-cache

# Check logs for issues
make dev-logs
```