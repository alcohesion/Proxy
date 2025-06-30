# Project Documentation

## Overview

This project is a high-performance HTTP/WebSocket proxy server designed for real-time request forwarding and comprehensive analytics. Built with modern Node.js technologies, it provides a scalable solution for proxying requests while collecting detailed metrics and analytics.

## Technology Stack

### Core Technologies
- **Node.js 18+**: Runtime environment
- **uWebSockets.js**: High-performance WebSocket and HTTP server
- **MongoDB**: Primary database for persistent storage
- **Mongoose**: MongoDB object modeling
- **Bull**: Background job processing (with Redis)

### Key Libraries
- **crypto**: Secure hex ID generation
- **dotenv**: Environment variable management
- **validator**: Input validation
- **compression**: Response compression

## Project Structure

The project follows a modular, scalable architecture with clear separation of concerns:

```
Proxy/
├── src/                    # Source code
│   ├── app.js             # Application entry point
│   ├── .env               # Environment variables
│   ├── .env.example       # Environment template
│   ├── configs/           # Configuration management
│   ├── models/            # Data models and schemas
│   ├── queries/           # Database operations
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── queues/            # Background processing
├── docs/                  # Documentation
│   └── api-reference.md   # Complete API documentation
├── package.json           # Dependencies and scripts
├── README.md              # Project overview
└── Dockerfile             # Container configuration
```

## Architecture Patterns

### 1. Modular Design
Each module has a specific responsibility:
- **configs/**: Centralized configuration management
- **models/**: Data structure definitions
- **queries/**: Database abstraction layer
- **services/**: Business logic implementation
- **utils/**: Reusable utility functions

### 2. Database Query Abstraction
All database operations are abstracted into the `queries/` folder to:
- Avoid code duplication
- Centralize query logic
- Improve maintainability
- Enable easy testing

### 3. Service Layer Pattern
Business logic is separated into service modules:
- **proxy/**: Request forwarding logic
- **metrics/**: Analytics and monitoring
- **queues/**: Background job processing

## Data Models

### Request Model
Tracks all proxied requests with comprehensive metadata:
```javascript
{
  hex: String,           // Unique identifier (prx_xxxxxxxxxxxx)
  method: String,        // HTTP method
  path: String,          // Request path
  headers: Object,       // Request headers
  body: String,          // Request body
  status: Number,        // Response status
  responseHeaders: Object, // Response headers
  responseBody: String,  // Response body
  duration: Number,      // Processing time in ms
  deviceHex: String,     // Associated device ID
  timestamp: Date        // Request timestamp
}
```

### Device Model
Tracks client devices and their usage patterns:
```javascript
{
  hex: String,           // Unique identifier (dev_xxxxxxxxxxxx)
  userAgent: String,     // Browser/client information
  ip: String,            // Client IP address
  requestCount: Number,  // Total requests from device
  lastActive: Date,      // Last activity timestamp
  createdAt: Date        // First seen timestamp
}
```

### Metrics Model
Stores aggregated analytics data:
```javascript
{
  hex: String,           // Unique identifier (met_xxxxxxxxxxxx)
  type: String,          // Metric type (requests, devices, system)
  data: Object,          // Metric data payload
  timestamp: Date,       // Metric timestamp
  expiresAt: Date        // Auto-cleanup timestamp
}
```

## Security Features

### Authentication
- Token-based authentication for all WebSocket connections
- Environment variable-based token configuration
- Automatic authentication validation

### Data Security
- Encrypted hex ID generation using crypto module
- Secure random ID generation with timestamp salting
- Input validation for all incoming data

### Rate Limiting
- Connection limits per IP address
- Message rate limiting per connection
- Request size limitations

## Performance Optimizations

### WebSocket Performance
- uWebSockets.js for maximum throughput
- Efficient message handling
- Connection pooling

### Database Performance
- Indexed queries for fast lookups
- Automatic document expiration for metrics
- Optimized query patterns

### Memory Management
- Proper cleanup of WebSocket connections
- Garbage collection-friendly code patterns
- Efficient data structures

## Monitoring and Analytics

### Real-time Metrics
- Request count and success rates
- Response time statistics
- Active device tracking
- Connection statistics

### Health Monitoring
- Database connection status
- Memory usage tracking
- System uptime monitoring
- Queue status reporting

## Development Guidelines

### Code Style
- Use async/await for asynchronous operations
- Follow modular architecture patterns
- Implement proper error handling
- Use descriptive variable and function names

### Testing
- Unit tests for utility functions
- Integration tests for API endpoints
- Performance tests for WebSocket connections
- End-to-end tests for complete workflows

### Documentation
- Comprehensive API documentation
- Code comments for complex logic
- Architecture decision records
- Usage examples and tutorials

## Deployment

### Environment Requirements
- Node.js 18 or higher
- MongoDB 4.4 or higher
- Redis 6.0 or higher (optional)
- Minimum 1GB RAM
- SSL certificates (for production)

### Configuration
- Environment variables for all settings
- Separate configurations for development/production
- Database connection pooling
- Logging configuration

### Monitoring
- Health check endpoints
- Metrics collection
- Error tracking
- Performance monitoring

## Troubleshooting

### Common Issues
1. **WebSocket Connection Failures**
   - Check authentication token
   - Verify network connectivity
   - Review server logs

2. **Database Connection Issues**
   - Verify MongoDB service status
   - Check connection string format
   - Review database permissions

3. **Performance Issues**
   - Monitor memory usage
   - Check database query performance
   - Review WebSocket connection counts

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` for comprehensive debug information.

## Future Enhancements

### Planned Features
- Advanced rate limiting strategies
- Enhanced security features
- Performance optimizations
- Additional analytics capabilities

### Scalability Improvements
- Horizontal scaling support
- Load balancing integration
- Distributed caching
- Microservices architecture

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request

### Code Review Process
- Automated testing validation
- Code style verification
- Security review
- Performance assessment
- Documentation updates

This documentation provides a comprehensive overview of the project architecture, implementation details, and operational considerations.
