const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configuration
const config = {
  port: process.env.PORT || 8080, // Fly.io uses PORT env var
  authToken: process.env.AUTH_TOKEN || 'your-secret-token',
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ limit: '10mb', type: '*/*' }));

// WebSocket server on the same port as HTTP (Fly.io handles this well)
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: {
    zlibDeflateOptions: {
      windowBits: 13,
      memLevel: 7,
    },
  }
});

let localClient = null;
const pendingRequests = new Map();
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  lastConnection: null,
  startTime: new Date()
};

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  connectionStats.totalConnections++;
  connectionStats.currentConnections++;
  connectionStats.lastConnection = new Date();
  
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`🔗 New WebSocket connection from ${clientIp}`);
  
  // Send welcome message
  ws.send(JSON.stringify({ 
    type: 'welcome', 
    message: 'Connected to Fly.io Proxy Server',
    timestamp: new Date().toISOString()
  }));
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle authentication
      if (message.type === 'auth') {
        if (message.token === config.authToken) {
          localClient = ws;
          ws.isAuthenticated = true;
          console.log('✅ Local client authenticated and connected');
          ws.send(JSON.stringify({ 
            type: 'auth_success',
            serverInfo: {
              nodeEnv: config.nodeEnv,
              uptime: process.uptime(),
              timestamp: new Date().toISOString()
            }
          }));
        } else {
          console.log('❌ Authentication failed from', clientIp);
          ws.send(JSON.stringify({ type: 'auth_failed', reason: 'Invalid token' }));
          ws.close(1008, 'Authentication failed');
        }
        return;
      }
      
      // Require authentication for other message types
      if (!ws.isAuthenticated) {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
        return;
      }
      
      // Handle response from local server
      if (message.type === 'response') {
        const { requestId, statusCode, headers, body } = message;
        const pendingReq = pendingRequests.get(requestId);
        
        if (pendingReq) {
          const { res, startTime } = pendingReq;
          const duration = Date.now() - startTime;
          
          // Set headers
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              try {
                res.setHeader(key, value);
              } catch (err) {
                console.warn(`Failed to set header ${key}:`, err.message);
              }
            });
          }
          
          // Send response
          res.status(statusCode || 200);
          if (body) {
            if (typeof body === 'string') {
              res.send(body);
            } else {
              res.json(body);
            }
          } else {
            res.end();
          }
          
          pendingRequests.delete(requestId);
          console.log(`✅ Response sent for request ${requestId} (${duration}ms)`);
        } else {
          console.warn(`⚠️  Received response for unknown request ${requestId}`);
        }
      }
      
      // Handle ping/pong for connection health
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', (code, reason) => {
    connectionStats.currentConnections--;
    if (ws === localClient) {
      localClient = null;
      console.log('❌ Local client disconnected');
    }
    console.log(`🔌 WebSocket connection closed (${code}): ${reason}`);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // Send periodic ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000); // 30 seconds
});

// Request handler middleware
const handleRequest = (req, res) => {
  if (!localClient || localClient.readyState !== WebSocket.OPEN) {
    return res.status(502).json({
      error: 'Service Unavailable',
      message: 'Local development server is not connected',
      timestamp: new Date().toISOString()
    });
  }
  
  const requestId = uuidv4();
  const startTime = Date.now();
  
  // Store the response object for later use
  pendingRequests.set(requestId, { res, startTime });
  
  // Prepare request data
  const requestData = {
    type: 'request',
    requestId,
    method: req.method,
    url: req.originalUrl || req.url, // Use originalUrl to preserve full path
    path: req.originalUrl || req.path, // Use originalUrl to preserve full path
    query: req.query,
    headers: req.headers,
    body: req.body,
    rawBody: req.rawBody,
    timestamp: new Date().toISOString()
  };
  
  // Send request to local client
  try {
    localClient.send(JSON.stringify(requestData));
    console.log(`📤 Request ${requestId} forwarded: ${req.method} ${req.originalUrl || req.url}`);
  } catch (error) {
    console.error('Error sending request to local client:', error);
    pendingRequests.delete(requestId);
    return res.status(502).json({
      error: 'Bad Gateway',
      message: 'Failed to forward request to local server',
      timestamp: new Date().toISOString()
    });
  }
  
  // Set timeout for request
  const timeout = setTimeout(() => {
    if (pendingRequests.has(requestId)) {
      pendingRequests.delete(requestId);
      if (!res.headersSent) {
        res.status(504).json({
          error: 'Gateway Timeout',
          message: 'Local server did not respond in time',
          requestId,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, 30000); // 30 second timeout
  
  // Clear timeout if request completes
  const originalDelete = pendingRequests.delete.bind(pendingRequests);
  pendingRequests.delete = function(key) {
    if (key === requestId) {
      clearTimeout(timeout);
    }
    return originalDelete(key);
  };
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Fly.io Proxy Server',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      status: '/status',
      metrics: '/metrics'
    }
  });
});

// Health check endpoint (for Fly.io health checks)
app.get('/health', (req, res) => {
  const isConnected = localClient && localClient.readyState === WebSocket.OPEN;
  const uptime = process.uptime();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    localClientConnected: isConnected,
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    port: config.port,
    nodeEnv: config.nodeEnv
  });
});

// Status endpoint with detailed info
app.get('/status', (req, res) => {
  const isConnected = localClient && localClient.readyState === WebSocket.OPEN;
  const memUsage = process.memoryUsage();
  
  res.json({
    cloudProxy: 'running',
    localClient: isConnected ? 'connected' : 'disconnected',
    pendingRequests: pendingRequests.size,
    connections: connectionStats,
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
    },
    uptime: process.uptime(),
    port: config.port,
    nodeEnv: config.nodeEnv,
    authRequired: true
  });
});

// Metrics endpoint (useful for monitoring)
app.get('/metrics', (req, res) => {
  const isConnected = localClient && localClient.readyState === WebSocket.OPEN;
  
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP proxy_local_client_connected Whether local client is connected
# TYPE proxy_local_client_connected gauge
proxy_local_client_connected ${isConnected ? 1 : 0}

# HELP proxy_pending_requests Number of pending requests
# TYPE proxy_pending_requests gauge
proxy_pending_requests ${pendingRequests.size}

# HELP proxy_total_connections Total WebSocket connections
# TYPE proxy_total_connections counter
proxy_total_connections ${connectionStats.totalConnections}

# HELP proxy_current_connections Current WebSocket connections
# TYPE proxy_current_connections gauge
proxy_current_connections ${connectionStats.currentConnections}

# HELP proxy_uptime_seconds Server uptime in seconds
# TYPE proxy_uptime_seconds counter
proxy_uptime_seconds ${process.uptime()}
  `.trim());
});

// Handle all other requests
app.use('*', handleRequest);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }
});

// Start the server
server.listen(config.port, '0.0.0.0', () => {
  console.log('🚀 Fly.io Proxy Server Started');
  console.log(`📍 HTTP/WebSocket Server: port ${config.port}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`🔑 Auth Token: ${config.authToken ? 'Set' : 'Not Set'}`);
  console.log(`✅ Health check: /health`);
  console.log(`📊 Status check: /status`);
  console.log(`📈 Metrics: /metrics`);
  console.log('');
  console.log('🔌 WebSocket server ready for connections');
  console.log('⏳ Waiting for local client connection...');
});

// Graceful shutdown for Fly.io
const shutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  // Close WebSocket server
  wss.close(() => {
    console.log('✅ WebSocket server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⚠️  Force closing server');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server, wss };