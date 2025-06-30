# API Reference

Complete documentation for all HTTP and WebSocket endpoints.

## HTTP Endpoints

### Health Check
**GET** `/health`

Returns the current health status of the application.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456,
  "version": "1.0.0"
}
```

**Status Codes:**
- `200 OK` - Service is healthy
- `503 Service Unavailable` - Service is unhealthy

---

### System Status
**GET** `/status`

Returns detailed system information including database connections, memory usage, and active connections.

**Response:**
```json
{
  "status": "operational",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456,
  "connections": {
    "websocket": 42,
    "http": 5
  },
  "database": {
    "mongodb": "connected",
    "redis": "connected"
  },
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB",
    "usage": "8.8%"
  },
  "queues": {
    "metrics": {
      "waiting": 0,
      "active": 2,
      "completed": 1247,
      "failed": 3
    }
  }
}
```

---

### Static Files
**GET** `/static/*`

Serves static files (CSS, JavaScript, images) for the dashboard interface.

**Examples:**
- `/static/css/dashboard.css`
- `/static/js/dashboard.js`
- `/static/images/logo.png`

## WebSocket Endpoints

### Proxy WebSocket
**WS** `/`

Main proxy endpoint for forwarding requests to the target server.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8080/?token=your-auth-token');
```

**Query Parameters:**
- `token` (required) - Authentication token

**Message Format:**
```json
{
  "id": "unique-request-id",
  "method": "GET|POST|PUT|DELETE|PATCH",
  "path": "/api/endpoint",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token"
  },
  "body": "request body data",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response Format:**
```json
{
  "id": "unique-request-id",
  "status": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "response body data",
  "timestamp": "2024-01-15T10:30:15.000Z",
  "duration": 150
}
```

**Error Response:**
```json
{
  "id": "unique-request-id",
  "error": true,
  "message": "Connection refused",
  "code": "ECONNREFUSED",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Connection Events:**
- `open` - Connection established
- `message` - Request/response data
- `close` - Connection closed
- `error` - Connection error

---

### Metrics WebSocket
**WS** `/metrics`

Real-time metrics and analytics dashboard endpoint.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8080/metrics?token=your-auth-token');
```

**Query Parameters:**
- `token` (required) - Authentication token
- `interval` (optional) - Update interval in seconds (default: 5)

**Message Types:**

#### Real-time Metrics
```json
{
  "type": "metrics",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "requests": {
      "total": 1247,
      "successful": 1244,
      "failed": 3,
      "rate": 12.5
    },
    "devices": {
      "active": 42,
      "total": 156,
      "new": 3
    },
    "performance": {
      "avgResponseTime": 145.6,
      "minResponseTime": 12.3,
      "maxResponseTime": 2150.8
    }
  }
}
```

#### Device Analytics
```json
{
  "type": "devices",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": [
    {
      "hex": "prx_a1b2c3d4e5f6",
      "userAgent": "Mozilla/5.0...",
      "ip": "192.168.1.100",
      "requestCount": 25,
      "lastActive": "2024-01-15T10:29:45.000Z"
    }
  ]
}
```

#### Request Analytics
```json
{
  "type": "requests",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": [
    {
      "hex": "req_x1y2z3a4b5c6",
      "method": "GET",
      "path": "/api/users",
      "status": 200,
      "duration": 145,
      "deviceHex": "prx_a1b2c3d4e5f6",
      "timestamp": "2024-01-15T10:29:30.000Z"
    }
  ]
}
```

#### System Status
```json
{
  "type": "system",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "uptime": 123.456,
    "memory": {
      "used": 47185920,
      "total": 536870912,
      "percentage": 8.8
    },
    "connections": {
      "websocket": 42,
      "http": 5
    },
    "database": {
      "mongodb": "connected",
      "redis": "connected"
    }
  }
}
```

## Authentication

All WebSocket endpoints require authentication via the `token` query parameter.

**Valid Token Example:**
```
ws://localhost:8080/?token=your-secure-auth-token
```

**Authentication Flow:**
1. Client connects with token parameter
2. Server validates token against `AUTH_TOKEN` environment variable
3. Connection established or rejected based on validation

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Token validation failed

## Rate Limiting

Current implementation includes basic rate limiting:
- **Connection Limit**: 100 concurrent connections per IP
- **Message Limit**: 1000 messages per minute per connection
- **Request Size Limit**: 10MB per message

## Error Handling

### HTTP Errors
```json
{
  "error": true,
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### WebSocket Errors
```json
{
  "error": true,
  "type": "connection|authentication|proxy|system",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Common Error Codes
- `AUTH_REQUIRED` - Authentication token required
- `INVALID_TOKEN` - Authentication token is invalid
- `CONNECTION_FAILED` - Failed to connect to target server
- `REQUEST_TIMEOUT` - Request exceeded timeout limit
- `RATE_LIMITED` - Too many requests
- `INVALID_FORMAT` - Message format is invalid
- `SERVER_ERROR` - Internal server error

## Testing Examples

### cURL Examples
```bash
# Health check
curl http://localhost:8080/health

# System status
curl http://localhost:8080/status
```

### JavaScript Examples
```javascript
// Proxy WebSocket
const proxyWs = new WebSocket('ws://localhost:8080/?token=your-token');

proxyWs.onopen = () => {
  // Send a request
  proxyWs.send(JSON.stringify({
    id: 'req-123',
    method: 'GET',
    path: '/api/users',
    headers: {
      'Content-Type': 'application/json'
    }
  }));
};

proxyWs.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('Response:', response);
};

// Metrics WebSocket
const metricsWs = new WebSocket('ws://localhost:8080/metrics?token=your-token');

metricsWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`${data.type}:`, data.data);
};
```

### Node.js Example
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/?token=your-token');

ws.on('open', () => {
  console.log('Connected to proxy');
  
  // Send a POST request
  ws.send(JSON.stringify({
    id: 'post-123',
    method: 'POST',
    path: '/api/data',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key: 'value' })
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log('Response received:', response);
});
```

This API reference provides all the necessary information to interact with the Proxy Server endpoints effectively.
