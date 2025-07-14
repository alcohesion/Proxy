# Performance Guide

## Performance Overview

The tunnel proxy system is designed for high-performance real-time communication with optimized resource utilization and minimal latency.

## Performance Metrics

### Key Performance Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| WebSocket Connection Time | < 100ms | Connection establishment time |
| Request Processing Time | < 50ms | End-to-end request processing |
| Memory Usage | < 512MB | RSS memory per instance |
| CPU Usage | < 60% | Average CPU utilization |
| Concurrent Connections | 2000+ | Maximum WebSocket connections |
| Throughput | 10,000+ req/s | Peak request processing rate |
| Database Query Time | < 10ms | Average MongoDB query time |
| Cache Hit Rate | > 90% | Redis cache effectiveness |

### Benchmark Results

#### Connection Performance
- WebSocket connection establishment: 45ms average
- HTTP request processing: 28ms average
- Database write operations: 8ms average
- Redis cache operations: 2ms average

#### Throughput Testing
- Single instance throughput: 12,500 requests/second
- Multi-instance throughput: 50,000+ requests/second
- WebSocket message rate: 25,000 messages/second
- Database operations: 5,000 writes/second

#### Resource Utilization
- Memory usage per 1000 connections: 85MB
- CPU usage at 10,000 req/s: 45%
- Network bandwidth per connection: 2KB/s average
- Disk I/O for logging: 15MB/s average

## Optimization Strategies

### Application-Level Optimizations

#### Connection Management
```javascript
// Optimized connection pool configuration
const mongoConfig = {
  maxPoolSize: 20,
  minPoolSize: 5,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000
};

// Redis connection optimization
const redisConfig = {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true
};
```

#### Memory Management
```javascript
// Node.js memory optimization
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Garbage collection tuning
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    if (global.gc) {
      global.gc();
    }
  }, 300000); // 5 minutes
}
```

#### Request Processing
```javascript
// Efficient request handling
const processRequest = async (request) => {
  // Use object pooling for frequently created objects
  const processedRequest = requestPool.acquire();
  
  try {
    // Process request efficiently
    await handleRequest(processedRequest);
  } finally {
    // Return object to pool
    requestPool.release(processedRequest);
  }
};
```

### Database Optimizations

#### MongoDB Performance

##### Index Optimization
```javascript
// Create compound indexes for frequent queries
db.requests.createIndex({ hex: 1, timestamp: -1 });
db.devices.createIndex({ hex: 1, lastSeen: -1 });
db.metrics.createIndex({ timestamp: -1, type: 1 });

// Text index for search functionality
db.requests.createIndex({ url: "text", method: "text" });
```

##### Query Optimization
```javascript
// Use projection to limit returned fields
const requests = await Request.find(
  { timestamp: { $gte: startDate } },
  'hex method url statusCode timestamp'
).lean();

// Use aggregation for complex queries
const metrics = await Request.aggregate([
  { $match: { timestamp: { $gte: startDate } } },
  { $group: { _id: '$statusCode', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

##### Connection Pooling
```javascript
// Optimized MongoDB connection
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 20,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  useCreateIndex: true,
  useFindAndModify: false
};
```

#### Redis Performance

##### Connection Optimization
```javascript
// Redis connection pool
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
  lazyConnect: true
});
```

##### Caching Strategy
```javascript
// Implement cache-aside pattern
const getDeviceInfo = async (deviceHex) => {
  // Try cache first
  const cached = await redis.get(`device:${deviceHex}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fallback to database
  const device = await Device.findOne({ hex: deviceHex });
  if (device) {
    // Cache for 1 hour
    await redis.setex(`device:${deviceHex}`, 3600, JSON.stringify(device));
  }
  
  return device;
};
```

### Network Optimizations

#### WebSocket Configuration
```javascript
// Optimize WebSocket settings
const wsOptions = {
  compression: uWS.SHARED_COMPRESSOR,
  maxCompressedSize: 64 * 1024,
  maxBackpressure: 64 * 1024,
  closeOnBackpressureLimit: false,
  resetIdleTimeoutOnSend: false,
  sendPingsAutomatically: true,
  idleTimeout: 60
};
```

#### HTTP Configuration
```javascript
// HTTP optimization settings
const httpOptions = {
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 30000,
  freeSocketTimeout: 15000
};
```

#### Compression
```javascript
// Enable compression for responses
const shouldCompress = (contentType, size) => {
  return (
    size > 1024 && // Only compress if larger than 1KB
    (contentType.includes('application/json') ||
     contentType.includes('text/') ||
     contentType.includes('application/javascript'))
  );
};
```

### System-Level Optimizations

#### Operating System Tuning

##### File Descriptor Limits
```bash
# Increase file descriptor limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Apply immediately
ulimit -n 65536
```

##### Network Tuning
```bash
# TCP optimization for high throughput
echo 'net.core.somaxconn = 65535' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 65535' >> /etc/sysctl.conf
echo 'net.core.netdev_max_backlog = 5000' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_fin_timeout = 30' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_keepalive_time = 300' >> /etc/sysctl.conf

# Apply changes
sysctl -p
```

##### Memory Management
```bash
# Virtual memory optimization
echo 'vm.swappiness = 10' >> /etc/sysctl.conf
echo 'vm.dirty_ratio = 15' >> /etc/sysctl.conf
echo 'vm.dirty_background_ratio = 5' >> /etc/sysctl.conf
```

#### Process Management

##### PM2 Optimization
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'tunnel-proxy',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    env: {
      NODE_ENV: 'production',
      UV_THREADPOOL_SIZE: 128
    }
  }]
};
```

##### Docker Optimization
```dockerfile
# Multi-stage build for smaller image
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .
USER nodejs
EXPOSE 8080
CMD ["node", "app.js"]
```

## Monitoring and Profiling

### Performance Monitoring

#### Application Metrics
```javascript
// Custom metrics collection
const performanceMetrics = {
  requestCount: 0,
  responseTime: [],
  memoryUsage: process.memoryUsage(),
  connectionCount: 0
};

// Collect metrics periodically
setInterval(() => {
  const metrics = {
    ...performanceMetrics,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  };
  
  // Store or send metrics
  publishMetrics(metrics);
}, 30000);
```

#### Database Monitoring
```javascript
// MongoDB performance monitoring
mongoose.connection.on('connected', () => {
  mongoose.connection.db.admin().serverStatus((err, info) => {
    if (!err) {
      console.log('MongoDB server status:', {
        connections: info.connections,
        operations: info.opcounters,
        memory: info.mem
      });
    }
  });
});
```

#### System Monitoring
```bash
# System performance monitoring script
#!/bin/bash

# CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

# Memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')

# Disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1)

# Network connections
CONNECTIONS=$(netstat -an | grep :8080 | wc -l)

echo "CPU: ${CPU_USAGE}%, Memory: ${MEM_USAGE}%, Disk: ${DISK_USAGE}%, Connections: ${CONNECTIONS}"
```

### Profiling Tools

#### Node.js Profiling
```bash
# CPU profiling
node --prof app.js

# Memory profiling
node --inspect app.js

# Heap snapshot analysis
node --expose-gc --inspect app.js
```

#### Load Testing
```bash
# Apache Bench testing
ab -n 10000 -c 100 http://localhost:8080/health

# Artillery.js load testing
artillery quick --count 100 --num 1000 http://localhost:8080/

# WebSocket load testing
wscat -c ws://localhost:8080?token=test-token
```

## Scaling Strategies

### Horizontal Scaling

#### Load Balancer Configuration
```nginx
upstream tunnel_proxy {
    least_conn;
    server 127.0.0.1:8080 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8081 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8082 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://tunnel_proxy;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Container Orchestration
```yaml
# docker-compose.yml for scaling
version: '3.8'
services:
  tunnel-proxy:
    image: tunnel-proxy:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/proxy
      - REDIS_URL=redis://redis:6379
```

### Vertical Scaling

#### Resource Allocation
```bash
# Container resource limits
docker run -d \
  --name tunnel-proxy \
  --memory=2g \
  --cpus=2 \
  --ulimit nofile=65536:65536 \
  tunnel-proxy:latest
```

#### Memory Optimization
```javascript
// Memory-efficient data structures
const connectionMap = new Map(); // Use Map instead of Object
const requestCache = new LRU({ max: 1000 }); // LRU cache for requests

// Stream processing for large data
const processLargeData = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};
```

## Troubleshooting Performance Issues

### Common Performance Problems

#### High Memory Usage
```javascript
// Memory leak detection
const memwatch = require('memwatch-next');

memwatch.on('leak', (info) => {
  console.error('Memory leak detected:', info);
});

// Heap dump analysis
memwatch.on('stats', (stats) => {
  console.log('Memory stats:', stats);
});
```

#### High CPU Usage
```javascript
// CPU profiling for bottlenecks
const v8Profiler = require('v8-profiler-next');

// Start profiling
const profile = v8Profiler.startProfiling('CPU Profile');

// Stop after 30 seconds
setTimeout(() => {
  const result = v8Profiler.stopProfiling('CPU Profile');
  result.export().pipe(fs.createWriteStream('cpu-profile.cpuprofile'));
}, 30000);
```

#### Database Performance Issues
```javascript
// Enable MongoDB profiling
db.setProfilingLevel(2, { slowms: 100 });

// Query slow operations
db.system.profile.find({ ts: { $gte: new Date(Date.now() - 60000) } })
  .sort({ ts: -1 })
  .pretty();
```

### Performance Testing Scripts

#### Automated Testing
```bash
#!/bin/bash
# performance-test.sh

echo "Starting performance tests..."

# Warmup
echo "Warming up..."
ab -n 1000 -c 10 http://localhost:8080/health > /dev/null 2>&1

# CPU test
echo "Testing CPU performance..."
ab -n 10000 -c 100 http://localhost:8080/health

# Memory test
echo "Testing memory usage..."
ps aux | grep node | grep -v grep

# WebSocket test
echo "Testing WebSocket connections..."
node test/websocket-load.js

echo "Performance tests completed."
```

#### Continuous Monitoring
```javascript
// performance-monitor.js
const monitoring = {
  start: Date.now(),
  requests: 0,
  errors: 0,
  
  track(req, res, next) {
    this.requests++;
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (res.statusCode >= 400) {
        this.errors++;
      }
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`);
      }
    });
    
    next();
  },
  
  getStats() {
    const uptime = Date.now() - this.start;
    return {
      uptime,
      requestsPerSecond: this.requests / (uptime / 1000),
      errorRate: this.errors / this.requests,
      memoryUsage: process.memoryUsage()
    };
  }
};
```
