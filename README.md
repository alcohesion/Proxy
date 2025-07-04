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
│   └── proxy.js           # Proxy settings
├── models/                 # MongoDB data models
│   ├── device.js          # Device tracking model
│   ├── metrics.js         # Analytics metrics model
│   └── request.js         # Request logging model
├── queries/                # Database query operations
│   ├── device.js          # Device CRUD operations
│   ├── metrics.js         # Metrics CRUD operations
│   └── request.js         # Request CRUD operations
├── services/               # Business logic services
│   ├── metrics/           # Analytics services
│   └── proxy/             # Proxy services
├── utils/                  # Utility functions
│   └── hex.js             # Secure hex ID generation
└── queues/                 # Background job processing
    └── bull/              # Bull queue integration
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
   ```
   Access: http://localhost

3. **Production Environment**
   ```bash
   cd docker
   make setup-env        # Create environment files
   # Configure GitHub secrets: SSL_CERT, SSL_KEY, SSL_CA_BUNDLE
   # Deploy via GitHub Actions workflow
   make prod-start       # Start production (after deployment)
   ```
   Access: https://yourdomain.com

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

The project follows a modular architecture pattern:

- **configs/**: Application configuration and settings
- **models/**: MongoDB schema definitions and hooks
- **queries/**: Database query operations and CRUD logic
- **services/**: Business logic and service layer
- **utils/**: Utility functions and helpers
- **queues/**: Background job processing

## Security Considerations

- **Token Authentication**: All WebSocket connections require valid authentication tokens
- **Input Validation**: All incoming data is validated before processing
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Secure Headers**: Security headers are set for all HTTP responses
- **Encrypted IDs**: All document IDs use encrypted hex generation

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