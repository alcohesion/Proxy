# Architecture Overview

## System Architecture

The tunnel proxy system is built on a microservices architecture with clear separation of concerns across multiple layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                        Load Balancer                           │
├─────────────────────────────────────────────────────────────────┤
│                       Tunnel Proxy                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │   WebSocket   │  │   HTTP API    │  │   Metrics     │      │
│  │   Handler     │  │   Endpoints   │  │   Collection  │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
├─────────────────────────────────────────────────────────────────┤
│                     Service Layer                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │   Proxy       │  │   Health      │  │   Status      │      │
│  │   Service     │  │   Service     │  │   Service     │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │   MongoDB     │  │   Redis       │  │   File        │      │
│  │   Queries     │  │   Queues      │  │   Logging     │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
├─────────────────────────────────────────────────────────────────┤
│                     Target Layer                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                Target Application                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### WebSocket Proxy Layer

The WebSocket proxy handles real-time bidirectional communication between clients and target applications:

- **Connection Management**: Maintains active WebSocket connections with automatic cleanup
- **Message Routing**: Routes HTTP requests through WebSocket tunnels to target applications
- **Authentication**: Token-based authentication for secure connections
- **Encryption**: Message payload encryption using configurable encryption keys

### HTTP API Layer

RESTful API endpoints provide management and monitoring capabilities:

- **Health Checks**: Application health and dependency status monitoring
- **Metrics Collection**: Performance and usage statistics gathering
- **Device Management**: Client device registration and tracking
- **Request Processing**: HTTP request validation and forwarding

### Service Layer

Business logic services handle core application functionality:

#### Proxy Service
- Request validation and preprocessing
- WebSocket message construction and delivery
- Response handling and error management
- Connection lifecycle management

#### Health Service  
- Application health monitoring
- Dependency status checking
- Performance metrics collection
- System resource monitoring

#### Status Service
- Real-time status reporting
- Connection state tracking
- Error rate monitoring
- Service availability reporting

### Data Layer

Persistent storage and caching systems:

#### MongoDB
- Request and response logging
- Device registration data
- Metrics and analytics data
- Configuration and settings storage

#### Redis
- Queue processing for background tasks
- Caching for frequently accessed data
- Session management
- Rate limiting and throttling

#### File System
- Application logging
- Error tracking
- Debug information
- Performance logs

## Message Flow Architecture

### Request Processing Flow

```
Client Request → Authentication → Validation → WebSocket Routing → Target Application
     ↓              ↓              ↓              ↓                    ↓
   Logging →    Token Check →  Input Check →  Message Build →    HTTP Forward
```

#### Step 1: Client Authentication
1. Extract authentication token from request headers
2. Validate token against configured AUTH_TOKEN
3. Reject unauthenticated requests with 401 status
4. Log authentication attempts for security monitoring

#### Step 2: Request Validation
1. Validate HTTP method and headers
2. Check request size against MAX_REQUEST_SIZE limit
3. Validate content type and encoding
4. Sanitize input data to prevent injection attacks

#### Step 3: WebSocket Routing
1. Check for available WebSocket connections
2. Select appropriate connection based on routing rules
3. Construct tunnel message with request data
4. Send message through WebSocket tunnel

#### Step 4: Target Processing
1. Receive message at target application
2. Reconstruct HTTP request from tunnel message
3. Process request through target application logic
4. Generate response data

### Response Processing Flow

```
Target Response → WebSocket Return → Response Build → Client Delivery
       ↓               ↓               ↓               ↓
   Data Package →  Message Send →  HTTP Build →   Status Send
```

#### Step 1: Response Packaging
1. Package response data into tunnel message format
2. Include status code, headers, and body content
3. Apply compression if enabled and beneficial
4. Add metadata for tracking and debugging

#### Step 2: WebSocket Transmission
1. Send response message through WebSocket connection
2. Handle transmission errors and retries
3. Track message delivery status
4. Log transmission metrics

#### Step 3: HTTP Response Construction
1. Reconstruct HTTP response from tunnel message
2. Set appropriate status codes and headers
3. Apply security headers and CORS policies
4. Prepare response body for client delivery

#### Step 4: Client Delivery
1. Send HTTP response to original client
2. Close connection if not keep-alive
3. Log response metrics and timing
4. Update connection statistics

## Connection Management

### WebSocket Connection Lifecycle

```
Connection Request → Authentication → Registration → Active State → Cleanup
        ↓               ↓               ↓               ↓            ↓
    Token Check →   Validation →   Map Storage →   Message Flow → Removal
```

#### Connection Establishment
1. Client initiates WebSocket connection with authentication token
2. Server validates token and connection parameters
3. Connection registered in activeConnections Map
4. Connection assigned unique identifier for tracking

#### Active Connection Management
1. Periodic ping/pong messages maintain connection health
2. Message queue handles backpressure and flow control
3. Connection metrics tracked for monitoring and debugging
4. Error handling for network interruptions and timeouts

#### Connection Cleanup
1. Detect disconnected or stale connections
2. Remove from activeConnections Map
3. Clean up associated resources and queues
4. Log disconnection events for analysis

### Connection Pool Management

The system maintains connection pools for optimal resource utilization:

#### MongoDB Connection Pool
- Configurable pool size based on expected load
- Automatic connection health monitoring
- Connection recycling and cleanup
- Query optimization and indexing

#### Redis Connection Pool  
- Persistent connections for queue operations
- Connection multiplexing for high throughput
- Automatic failover and reconnection
- Memory management and cache optimization

## Security Architecture

### Authentication Layer

```
Request → Token Extraction → Validation → Authorization → Processing
   ↓           ↓               ↓              ↓             ↓
Headers →   Parse Token →  Check Valid →  Grant Access → Continue
```

#### Token-Based Authentication
1. Authentication tokens required for all WebSocket connections
2. HTTP API endpoints protected with same token system
3. Token validation against configured AUTH_TOKEN environment variable
4. Failed authentication attempts logged for security monitoring

#### Encryption Layer
1. Message payloads encrypted using HEX_ENCRYPTION_KEY
2. Symmetric encryption for performance optimization
3. Key rotation supported through configuration updates
4. Encrypted data storage for sensitive information

### Security Headers

Standard security headers applied to all HTTP responses:

```javascript
{
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': "default-src 'self'"
}
```

### Input Validation

Multi-layer input validation protects against common attacks:

1. **Size Limits**: Request size validation prevents DoS attacks
2. **Content Validation**: JSON schema validation for structured data
3. **Sanitization**: Input sanitization prevents injection attacks
4. **Rate Limiting**: Request rate limiting prevents abuse

## Performance Architecture

### Asynchronous Processing

The system uses event-driven architecture for optimal performance:

#### Non-Blocking I/O
- All database operations use async/await patterns
- WebSocket operations handled asynchronously
- HTTP requests processed without blocking
- Background tasks run in separate event loop cycles

#### Connection Pooling
- MongoDB connection pooling reduces connection overhead
- Redis connection reuse improves performance
- WebSocket connection reuse minimizes handshake costs
- HTTP keep-alive connections reduce latency

### Caching Strategy

Multi-tier caching improves response times:

#### Memory Caching
- Frequently accessed configuration data cached in memory
- Active connection information stored in Map structures
- Request routing information cached for quick lookup
- Authentication tokens cached to reduce validation overhead

#### Redis Caching
- Database query results cached in Redis
- Session data stored in Redis for quick access
- Rate limiting counters maintained in Redis
- Queue processing state cached for recovery

### Monitoring and Metrics

Comprehensive monitoring provides visibility into system performance:

#### Real-Time Metrics
- WebSocket connection counts and status
- HTTP request rates and response times
- Database query performance and connection health
- Memory usage and garbage collection statistics

#### Historical Analytics
- Request and response logs stored in MongoDB
- Performance trends tracked over time
- Error rates and patterns analyzed
- Capacity planning data collected

## Scalability Architecture

### Horizontal Scaling

The system supports horizontal scaling through stateless design:

#### Stateless Services
- No server-side session state maintained
- All state stored in external databases
- WebSocket connections can be load balanced
- Multiple instances can run simultaneously

#### Load Distribution
- Nginx load balancer distributes requests
- WebSocket connections balanced across instances
- Database connections pooled and distributed
- Queue processing distributed across workers

### Vertical Scaling

Resource optimization supports vertical scaling:

#### Memory Management
- Configurable memory limits prevent resource exhaustion
- Garbage collection optimization reduces pause times
- Connection pooling minimizes memory usage
- Caching strategies reduce memory pressure

#### CPU Optimization
- Asynchronous processing minimizes CPU blocking
- Efficient algorithms reduce computational overhead
- Background task processing optimized for throughput
- Database query optimization reduces CPU usage

## Error Handling Architecture

### Error Classification

Errors are classified and handled based on severity and type:

#### Client Errors (4xx)
- Authentication failures
- Validation errors
- Rate limiting violations
- Malformed requests

#### Server Errors (5xx)
- Database connection failures
- Internal service errors
- Timeout exceptions
- Resource exhaustion

#### Network Errors
- WebSocket disconnections
- Target application unavailability
- DNS resolution failures
- Connection timeouts

### Recovery Mechanisms

Automatic recovery mechanisms maintain system stability:

#### Connection Recovery
- Automatic WebSocket reconnection attempts
- Database connection pool recovery
- Redis connection failover
- Circuit breaker patterns for external services

#### Data Recovery
- Transaction rollback for failed operations
- Message queue persistence for reliability
- Request replay for transient failures
- Graceful degradation for service outages

## Integration Architecture

### External Service Integration

The system integrates with external services through well-defined interfaces:

#### Target Application Integration
- HTTP/HTTPS protocol support
- Custom header forwarding
- Request/response transformation
- Health check integration

#### Database Integration
- MongoDB for persistent storage
- Redis for caching and queuing
- Connection pooling and optimization
- Backup and recovery procedures

#### Monitoring Integration
- Log aggregation systems
- Metrics collection platforms
- Alerting and notification systems
- Performance monitoring tools
