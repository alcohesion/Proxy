# Tunnel Proxy Server

# Tunnel Proxy Server

High-performance WebSocket tunnel proxy system for secure HTTP request forwarding with comprehensive monitoring and analytics capabilities.

## Overview

The tunnel proxy provides secure, real-time HTTP request forwarding through WebSocket tunnels with enterprise-grade features including authentication, encryption, monitoring, and analytics.

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- [Installation Guide](docs/installation.md) - Complete installation and setup instructions
- [Configuration Guide](docs/configuration.md) - Environment variables and configuration options
- [Architecture Overview](docs/architecture.md) - System architecture and design patterns
- [API Reference](docs/api.md) - Complete API documentation
- [Performance Guide](docs/performance.md) - Performance optimization and benchmarks
- [Deployment Guide](docs/deployment.md) - Production deployment strategies
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions

## Quick Start

### Docker Deployment (Recommended)

```bash
git clone <repository-url>
cd Tunnel/docker
make setup-env
make start
```

### Manual Installation

```bash
cd Tunnel/src
npm install
cp .env.example .env
# Configure environment variables
npm start
```

## Core Features

- **High-Performance WebSocket Proxy**: Built on uWebSockets.js for maximum throughput
- **Secure Authentication**: Token-based authentication with message encryption
- **Real-Time Analytics**: Live metrics dashboard with WebSocket streaming
- **Persistent Storage**: MongoDB logging for requests, devices, and metrics
- **Background Processing**: Redis-backed queue system for analytics
- **Health Monitoring**: Comprehensive health checks and status reporting
- **Container Ready**: Complete Docker configuration for all environments
- **Production Scalable**: Horizontal and vertical scaling support

## System Requirements

- Node.js 18.0 or higher
- MongoDB 4.4 or higher
- Redis 6.0 or higher (optional)
- Docker 20.10 or higher (for containerized deployment)

## Configuration

### Required Environment Variables

```env
NODE_ENV=production
PORT=8080
AUTH_TOKEN=your-secure-authentication-token
MONGODB_URI=mongodb://localhost:27017/proxy
TARGET_HOST=localhost
TARGET_PORT=3000
TARGET_PROTOCOL=http
HEX_ENCRYPTION_KEY=your-32-character-hex-key
```

See [Configuration Guide](docs/configuration.md) for complete configuration options.

## API Endpoints

### WebSocket Proxy
- **Endpoint**: `/`
- **Protocol**: WebSocket
- **Authentication**: Query parameter `token`

### Metrics Dashboard
- **Endpoint**: `/metrics`
- **Protocol**: WebSocket
- **Authentication**: Query parameter `token`

### Health Check
- **Endpoint**: `/health`
- **Method**: GET
- **Authentication**: None

Complete API documentation available in [API Reference](docs/api.md).

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │  Proxy Server   │    │  Target Server  │
│                 │    │                 │    │                 │
│ • Web Browser   │◄──►│ • uWebSockets   │◄──►│ • Local App     │
│ • Mobile App    │    │ • Request Queue │    │ • API Service   │
│ • Desktop App   │    │ • Metrics       │    │ • Web Service   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Data Layer    │
                    │                 │
                    │ • MongoDB       │
                    │ • Redis         │
                    │ • File Logging  │
                    └─────────────────┘
```

Detailed architecture information available in [Architecture Overview](docs/architecture.md).

## Performance

- **Concurrent Connections**: 10,000+ WebSocket connections
- **Request Throughput**: 50,000+ requests per second
- **Memory Usage**: 100MB for 1,000 active connections
- **Response Time**: <50ms average processing time

See [Performance Guide](docs/performance.md) for optimization strategies and benchmarks.

## Security Features

- Token-based WebSocket authentication
- AES-256 message encryption
- Request validation and sanitization
- Comprehensive audit logging
- Configurable rate limiting
- Security header injection

## Deployment Options

- **Docker Compose**: Development and production configurations
- **Kubernetes**: Complete manifests with scaling and health checks
- **Cloud Platforms**: AWS ECS, Google Cloud Run, Azure Container Instances
- **Traditional Servers**: SystemD service configuration

Complete deployment instructions in [Deployment Guide](docs/deployment.md).

## Monitoring

- Real-time performance metrics
- Health check endpoints
- Structured JSON logging
- Database query monitoring
- Connection tracking
- Error rate monitoring

## Troubleshooting

Common issues and solutions:

- WebSocket connection failures
- Database connectivity problems
- Performance optimization
- Memory usage analysis
- SSL certificate issues

See [Troubleshooting Guide](docs/troubleshooting.md) for detailed solutions.

## Development

```bash
# Install dependencies
cd src && npm install

# Run tests
npm test

# Development mode with hot reload
npm run dev

# Linting
npm run lint
```

## License

MIT License - see LICENSE file for details.