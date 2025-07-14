# Troubleshooting Guide

## Common Issues and Solutions

### Connection Issues

#### WebSocket Connection Failures

**Problem**: WebSocket connections fail to establish or drop frequently.

**Symptoms**:
- Clients cannot connect to WebSocket endpoint
- Connection established but immediately closed
- Intermittent connection drops

**Solutions**:

1. **Check Authentication Token**:
   ```bash
   # Test WebSocket connection with token
   wscat -c 'ws://localhost:8080?token=your-auth-token'
   
   # Verify token in environment
   echo $AUTH_TOKEN
   ```

2. **Verify Network Configuration**:
   ```bash
   # Check if port is accessible
   telnet localhost 8080
   
   # Check firewall rules
   sudo ufw status
   netstat -tulpn | grep :8080
   ```

3. **Review Connection Limits**:
   ```bash
   # Check ulimit settings
   ulimit -n
   
   # Check system connection limits
   cat /proc/sys/net/core/somaxconn
   ```

4. **Monitor Connection Pool**:
   ```javascript
   // Add connection monitoring
   setInterval(() => {
     console.log('Active connections:', proxy.activeConnections.size);
   }, 30000);
   ```

#### HTTP Request Timeouts

**Problem**: HTTP requests timeout or return 502 errors.

**Symptoms**:
- Requests hang and eventually timeout
- 502 Bad Gateway responses
- Slow response times

**Solutions**:

1. **Check Target Application**:
   ```bash
   # Test target application directly
   curl -v http://localhost:3000/health
   
   # Check target application logs
   tail -f /path/to/target/logs/app.log
   ```

2. **Verify Proxy Configuration**:
   ```javascript
   // Check timeout settings
   console.log('REQUEST_TIMEOUT:', process.env.REQUEST_TIMEOUT);
   console.log('CONNECTION_TIMEOUT:', process.env.CONNECTION_TIMEOUT);
   ```

3. **Monitor Request Processing**:
   ```javascript
   // Add request timing logs
   const startTime = Date.now();
   // ... process request
   const duration = Date.now() - startTime;
   if (duration > 1000) {
     console.warn(`Slow request: ${duration}ms`);
   }
   ```

### Database Issues

#### MongoDB Connection Problems

**Problem**: Application cannot connect to MongoDB or connections are dropped.

**Symptoms**:
- "MongooseServerSelectionError" errors
- Database operations fail
- Connection pool exhaustion

**Solutions**:

1. **Verify MongoDB Service**:
   ```bash
   # Check MongoDB service status
   sudo systemctl status mongod
   
   # Test MongoDB connection
   mongosh --eval "db.adminCommand('ping')"
   
   # Check MongoDB logs
   tail -f /var/log/mongodb/mongod.log
   ```

2. **Check Connection String**:
   ```bash
   # Verify environment variable
   echo $MONGODB_URI
   
   # Test connection with URI
   mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"
   ```

3. **Monitor Connection Pool**:
   ```javascript
   // Add connection pool monitoring
   mongoose.connection.on('connected', () => {
     console.log('MongoDB connected');
   });
   
   mongoose.connection.on('error', (err) => {
     console.error('MongoDB error:', err);
   });
   
   mongoose.connection.on('disconnected', () => {
     console.log('MongoDB disconnected');
   });
   ```

4. **Optimize Connection Settings**:
   ```javascript
   // Adjust connection pool settings
   const mongoOptions = {
     maxPoolSize: 10,
     minPoolSize: 2,
     maxIdleTimeMS: 30000,
     serverSelectionTimeoutMS: 5000,
     heartbeatFrequencyMS: 10000
   };
   ```

#### Redis Connection Issues

**Problem**: Redis operations fail or timeout.

**Symptoms**:
- Redis commands timeout
- Queue processing stops
- Cache operations fail

**Solutions**:

1. **Check Redis Service**:
   ```bash
   # Check Redis service status
   sudo systemctl status redis
   
   # Test Redis connection
   redis-cli ping
   
   # Check Redis logs
   tail -f /var/log/redis/redis-server.log
   ```

2. **Verify Connection Configuration**:
   ```bash
   # Test Redis URL
   redis-cli -u "$REDIS_URL" ping
   
   # Check Redis configuration
   redis-cli CONFIG GET maxmemory
   ```

3. **Monitor Redis Performance**:
   ```bash
   # Monitor Redis operations
   redis-cli MONITOR
   
   # Check Redis info
   redis-cli INFO stats
   ```

### Performance Issues

#### High Memory Usage

**Problem**: Application memory usage grows continuously or exceeds limits.

**Symptoms**:
- Node.js process killed by OOM killer
- Memory usage increases over time
- Slow garbage collection

**Solutions**:

1. **Monitor Memory Usage**:
   ```javascript
   // Add memory monitoring
   setInterval(() => {
     const usage = process.memoryUsage();
     console.log('Memory usage:', {
       rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
       heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
       heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB'
     });
   }, 60000);
   ```

2. **Generate Heap Snapshots**:
   ```javascript
   // Heap snapshot generation
   const v8 = require('v8');
   const fs = require('fs');
   
   function generateHeapSnapshot() {
     const snapshot = v8.writeHeapSnapshot();
     console.log('Heap snapshot written to:', snapshot);
   }
   
   // Generate snapshot on high memory usage
   if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) {
     generateHeapSnapshot();
   }
   ```

3. **Optimize Memory Usage**:
   ```javascript
   // Use object pooling for frequently created objects
   const requestPool = {
     pool: [],
     acquire() {
       return this.pool.pop() || {};
     },
     release(obj) {
       Object.keys(obj).forEach(key => delete obj[key]);
       this.pool.push(obj);
     }
   };
   ```

4. **Configure Node.js Memory Limits**:
   ```bash
   # Set memory limit
   export NODE_OPTIONS="--max-old-space-size=1024"
   
   # Enable garbage collection logging
   export NODE_OPTIONS="--max-old-space-size=1024 --trace-gc"
   ```

#### High CPU Usage

**Problem**: CPU usage remains consistently high.

**Symptoms**:
- CPU usage above 80%
- Slow request processing
- Event loop lag

**Solutions**:

1. **Profile CPU Usage**:
   ```bash
   # Generate CPU profile
   node --prof app.js
   
   # Process profile data
   node --prof-process isolate-*.log > cpu-profile.txt
   ```

2. **Monitor Event Loop**:
   ```javascript
   // Monitor event loop lag
   const { performance, PerformanceObserver } = require('perf_hooks');
   
   const obs = new PerformanceObserver((list) => {
     const entries = list.getEntries();
     entries.forEach((entry) => {
       if (entry.duration > 100) {
         console.warn(`Event loop lag: ${entry.duration}ms`);
       }
     });
   });
   obs.observe({ entryTypes: ['measure'] });
   ```

3. **Optimize Async Operations**:
   ```javascript
   // Use Promise.all for parallel operations
   const results = await Promise.all([
     database.query1(),
     database.query2(),
     cache.get('key')
   ]);
   
   // Avoid blocking operations in main thread
   const worker = require('worker_threads');
   ```

### Application Errors

#### Authentication Failures

**Problem**: Requests fail with authentication errors.

**Symptoms**:
- 401 Unauthorized responses
- WebSocket connections rejected
- "Invalid token" errors

**Solutions**:

1. **Verify Token Configuration**:
   ```bash
   # Check token environment variable
   echo "Token length: ${#AUTH_TOKEN}"
   
   # Verify token in request
   curl -H "Authorization: Bearer $AUTH_TOKEN" http://localhost:8080/health
   ```

2. **Debug Token Validation**:
   ```javascript
   // Add token validation logging
   const validateToken = (token) => {
     console.log('Validating token:', token ? 'present' : 'missing');
     const isValid = token === process.env.AUTH_TOKEN;
     console.log('Token valid:', isValid);
     return isValid;
   };
   ```

3. **Check Request Headers**:
   ```javascript
   // Log request headers for debugging
   app.use((req, res, next) => {
     console.log('Request headers:', req.headers);
     next();
   });
   ```

#### Request Processing Errors

**Problem**: Requests fail with 500 errors or unexpected responses.

**Symptoms**:
- 500 Internal Server Error responses
- Malformed response data
- Processing exceptions

**Solutions**:

1. **Enable Detailed Error Logging**:
   ```javascript
   // Comprehensive error logging
   process.on('uncaughtException', (error) => {
     console.error('Uncaught Exception:', error);
     console.error(error.stack);
   });
   
   process.on('unhandledRejection', (reason, promise) => {
     console.error('Unhandled Rejection at:', promise, 'reason:', reason);
   });
   ```

2. **Add Request Tracing**:
   ```javascript
   // Request tracing middleware
   const { v4: uuidv4 } = require('uuid');
   
   app.use((req, res, next) => {
     req.traceId = uuidv4();
     console.log(`[${req.traceId}] ${req.method} ${req.url}`);
     next();
   });
   ```

3. **Validate Request Data**:
   ```javascript
   // Input validation
   const validateRequest = (req) => {
     if (!req.body) {
       throw new Error('Request body is required');
     }
     
     if (typeof req.body !== 'object') {
       throw new Error('Request body must be JSON object');
     }
   };
   ```

### Network Issues

#### Load Balancer Problems

**Problem**: Load balancer reports unhealthy instances or distributes traffic unevenly.

**Symptoms**:
- Health check failures
- Uneven traffic distribution
- Connection routing issues

**Solutions**:

1. **Verify Health Check Endpoint**:
   ```bash
   # Test health endpoint
   curl -v http://localhost:8080/health
   
   # Check response time
   time curl http://localhost:8080/health
   ```

2. **Monitor Load Balancer Logs**:
   ```bash
   # Nginx access logs
   tail -f /var/log/nginx/access.log
   
   # Nginx error logs
   tail -f /var/log/nginx/error.log
   ```

3. **Configure Proper Health Checks**:
   ```nginx
   # Nginx upstream health checks
   upstream tunnel_proxy {
     server 127.0.0.1:8080 max_fails=3 fail_timeout=30s;
     server 127.0.0.1:8081 max_fails=3 fail_timeout=30s;
   }
   ```

#### SSL/TLS Issues

**Problem**: SSL certificate errors or HTTPS connection failures.

**Symptoms**:
- Certificate validation errors
- SSL handshake failures
- Mixed content warnings

**Solutions**:

1. **Verify SSL Certificate**:
   ```bash
   # Check certificate details
   openssl x509 -in /path/to/cert.crt -text -noout
   
   # Test SSL connection
   openssl s_client -connect your-domain.com:443
   
   # Check certificate expiration
   echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
   ```

2. **Validate Certificate Chain**:
   ```bash
   # Verify certificate chain
   openssl verify -CAfile /path/to/ca-bundle.crt /path/to/cert.crt
   ```

3. **Check SSL Configuration**:
   ```nginx
   # Nginx SSL configuration
   ssl_certificate /path/to/cert.crt;
   ssl_certificate_key /path/to/private.key;
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
   ```

## Debugging Tools and Techniques

### Logging Configuration

#### Application Logging

```javascript
// Enhanced logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### Debug Mode

```bash
# Enable debug mode
export DEBUG=tunnel:*
export LOG_LEVEL=debug
node app.js
```

### Monitoring Commands

#### System Monitoring

```bash
# Monitor system resources
top -p $(pgrep -f "node.*app.js")

# Check network connections
netstat -tulpn | grep :8080

# Monitor file descriptors
lsof -p $(pgrep -f "node.*app.js")

# Check disk usage
df -h
du -sh /path/to/app/logs
```

#### Application Monitoring

```bash
# Monitor application logs
tail -f logs/combined.log | grep ERROR

# Check memory usage
ps aux | grep node | grep -v grep

# Monitor database connections
mongosh --eval "db.serverStatus().connections"

# Check Redis stats
redis-cli INFO stats
```

### Performance Analysis

#### Request Timing

```javascript
// Request timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
});
```

#### Database Query Analysis

```javascript
// MongoDB query profiling
mongoose.set('debug', true);

// Custom query timing
const query = Model.find({ conditions });
const start = Date.now();
const results = await query.exec();
const queryTime = Date.now() - start;

if (queryTime > 100) {
  console.warn(`Slow query: ${queryTime}ms`);
}
```

### Diagnostic Scripts

#### Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "=== Application Health Check ==="

# Check application process
if pgrep -f "node.*app.js" > /dev/null; then
  echo "✓ Application process running"
else
  echo "✗ Application process not found"
  exit 1
fi

# Check HTTP endpoint
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
  echo "✓ HTTP endpoint responding"
else
  echo "✗ HTTP endpoint not responding"
  exit 1
fi

# Check WebSocket endpoint
if wscat -c ws://localhost:8080?token=$AUTH_TOKEN -x 'ping' > /dev/null 2>&1; then
  echo "✓ WebSocket endpoint responding"
else
  echo "✗ WebSocket endpoint not responding"
  exit 1
fi

# Check database connection
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
  echo "✓ MongoDB connection working"
else
  echo "✗ MongoDB connection failed"
  exit 1
fi

# Check Redis connection
if redis-cli ping > /dev/null 2>&1; then
  echo "✓ Redis connection working"
else
  echo "✗ Redis connection failed"
  exit 1
fi

echo "=== All checks passed ==="
```

#### Performance Report Script

```bash
#!/bin/bash
# performance-report.sh

echo "=== Performance Report ==="

# CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
echo "CPU Usage: ${CPU_USAGE}%"

# Memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')
echo "Memory Usage: ${MEM_USAGE}%"

# Application memory
APP_PID=$(pgrep -f "node.*app.js")
if [ ! -z "$APP_PID" ]; then
  APP_MEM=$(ps -p $APP_PID -o rss= | awk '{print $1/1024}')
  echo "Application Memory: ${APP_MEM}MB"
fi

# Database connections
MONGO_CONN=$(mongosh --quiet --eval "db.serverStatus().connections.current" 2>/dev/null)
echo "MongoDB Connections: ${MONGO_CONN}"

# Redis memory
REDIS_MEM=$(redis-cli INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
echo "Redis Memory: ${REDIS_MEM}"

# Active connections
ACTIVE_CONN=$(netstat -an | grep :8080 | grep ESTABLISHED | wc -l)
echo "Active Connections: ${ACTIVE_CONN}"

echo "=== Report Complete ==="
```

### Emergency Procedures

#### Service Recovery

```bash
#!/bin/bash
# emergency-restart.sh

echo "=== Emergency Service Recovery ==="

# Stop application gracefully
echo "Stopping application..."
pkill -TERM -f "node.*app.js"
sleep 10

# Force kill if still running
if pgrep -f "node.*app.js" > /dev/null; then
  echo "Force killing application..."
  pkill -KILL -f "node.*app.js"
fi

# Clean up resources
echo "Cleaning up resources..."
rm -f /tmp/tunnel-proxy-*.tmp
rm -f /var/run/tunnel-proxy.pid

# Restart services
echo "Restarting dependencies..."
sudo systemctl restart mongod
sudo systemctl restart redis

# Start application
echo "Starting application..."
cd /path/to/app
npm start &

# Wait for startup
sleep 30

# Verify recovery
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
  echo "✓ Service recovery successful"
else
  echo "✗ Service recovery failed"
  exit 1
fi
```

#### Log Cleanup

```bash
#!/bin/bash
# log-cleanup.sh

echo "=== Log Cleanup ==="

# Rotate large log files
find logs/ -name "*.log" -size +100M -exec mv {} {}.old \;

# Compress old logs
find logs/ -name "*.log.old" -exec gzip {} \;

# Remove logs older than 30 days
find logs/ -name "*.log.gz" -mtime +30 -delete

# Clean up temporary files
find /tmp -name "tunnel-proxy-*" -mtime +1 -delete

echo "=== Cleanup Complete ==="
```
