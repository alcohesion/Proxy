# Architecture Overview

This document provides a comprehensive overview of the Proxy Server architecture, design patterns, and system components.

## 🏗️ High-Level Architecture

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
                    │ • Bull Queues   │
                    └─────────────────┘
```

## 📁 Directory Structure Deep Dive

### `/src` - Source Code Root
All application code is organized under the `src` directory following a clean, modular structure.

### `/configs` - Configuration Management
```
configs/
├── app.js      # Application-wide settings
├── data.js     # Database connection configs
├── proxy.js    # Proxy-specific settings
└── index.js    # Configuration aggregator
```

**Key Features:**
- Environment-based configuration
- Centralized settings management
- Type validation and defaults
- Runtime configuration updates

### `/models` - Data Models
```
models/
├── request.js  # Proxy request tracking
├── device.js   # Client device information
├── metrics.js  # Real-time analytics data
└── index.js    # Model exports
```

**Design Principles:**
- Short, descriptive names (no camelCase)
- Automatic hex ID generation
- Pre-save hooks for data processing
- Optimized indexes for performance

### `/queries` - Database Operations
```
queries/
├── request.js  # Request CRUD operations
├── device.js   # Device management queries
├── metrics.js  # Analytics data queries
└── index.js    # Query system exports
```

**Features:**
- Standardized CRUD interface
- Error handling and logging
- Query optimization
- Reusable across services

### `/services` - Business Logic
```
services/
├── proxy/
│   ├── forward.js    # HTTP request forwarding
│   └── websocket.js  # WebSocket proxy handling
└── metrics/
    └── websocket.js  # Metrics collection WebSocket
```

**Service Architecture:**
- Single responsibility principle
- Async/await error handling
- Dependency injection ready
- Event-driven communication

### `/queues` - Background Processing
```
queues/
└── bull/
    └── metrics.js    # Metrics processing queue
```

**Queue Features:**
- Redis-backed job processing
- Automatic retry logic
- Dead letter queue handling
- Priority-based processing

### `/utils` - Utility Functions
```
utils/
├── hex.js      # Unique ID generation
└── index.js    # Utility exports
```

## 🔄 Request Flow

### 1. WebSocket Proxy Flow (`/`)
```
Client Request → uWebSockets → Proxy Service → Target Server
                     ↓
            Request Logging → MongoDB
                     ↓
            Device Tracking → Redis Queue
                     ↓
            Metrics Update → Background Job
```

### 2. Metrics Dashboard Flow (`/metrics`)
```
Dashboard Client → uWebSockets `/metrics` → Metrics Service
                                                 ↓
                                    Query MongoDB → Return Data
                                                 ↓
                                    Real-time Updates → WebSocket Push
```

## 🗄️ Data Flow

### Request Lifecycle
1. **Incoming Request**: Client connects via WebSocket
2. **Authentication**: Token validation
3. **Device Fingerprinting**: Extract client info
4. **Request Logging**: Store in MongoDB
5. **Proxy Forward**: Send to target server
6. **Response Handling**: Return response to client
7. **Metrics Update**: Background processing
8. **Cleanup**: Automatic old data removal

### Metrics Collection
1. **Real-time Tracking**: Live request/response data
2. **Device Analytics**: Client usage patterns
3. **Performance Metrics**: Response times, errors
4. **Historical Data**: Trends and reporting
5. **Dashboard Updates**: Live WebSocket feeds

## 🔧 Technology Stack

### Core Technologies
- **uWebSockets.js**: Ultra-fast WebSocket and HTTP server
- **MongoDB**: Document database for flexible data storage
- **Redis**: In-memory data structure store for caching and queues
- **Bull**: Redis-based queue system for background jobs

### Key Libraries
- **Mongoose**: MongoDB object modeling
- **IORedis**: High-performance Redis client
- **dotenv**: Environment configuration management

## 🏛️ Design Patterns

### 1. Repository Pattern
The query system implements the repository pattern, providing:
- Abstract data access layer
- Consistent CRUD operations
- Easy testing and mocking
- Database agnostic queries

### 2. Service Layer Pattern
Services encapsulate business logic:
- Single responsibility
- Dependency injection
- Error handling
- Async/await patterns

### 3. Factory Pattern
Model creation uses factory patterns:
- Automatic ID generation
- Consistent validation
- Pre/post processing hooks

## 🔒 Security Architecture

### Authentication
- Token-based WebSocket authentication
- Environment variable token storage
- Request-level authorization

### Data Security
- Hex ID generation using crypto module
- Environment-based entropy
- Configurable token validation

### Network Security
- CORS configuration
- Request size limits
- Rate limiting ready

## 📊 Performance Considerations

### Optimization Features
- **Connection Pooling**: MongoDB and Redis connections
- **Async Processing**: Non-blocking I/O operations
- **Background Jobs**: Heavy processing in queues
- **Data Cleanup**: Automatic old data removal
- **Indexing**: Optimized database queries

### Scalability
- **Horizontal Scaling**: Stateless service design
- **Load Balancing**: Multiple instance support
- **Database Sharding**: MongoDB scaling patterns
- **Queue Distribution**: Redis cluster support

## 🔍 Monitoring and Observability

### Health Checks
- Application health endpoints
- Database connectivity checks
- Queue system monitoring
- Memory and CPU tracking

### Logging
- Structured JSON logging
- Error tracking and reporting
- Request/response logging
- Performance metrics

### Metrics
- Real-time system metrics
- Business intelligence data
- Performance KPIs
- Historical trending

This architecture provides a solid foundation for a high-performance, scalable proxy server with comprehensive monitoring and analytics capabilities.
