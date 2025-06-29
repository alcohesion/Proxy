const WebSocket = require('ws');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { log: { log, setMonitorServer } } = require('./configs');
const WebInterface = require('./web');
require('dotenv').config();

// Configuration
const config = {
  cloudProxyUrl: process.env.CLOUD_PROXY_URL || 'wss://alcohesion.fly.dev:3001',
  localServerUrl: process.env.LOCAL_SERVER_URL || 'https://localhost:3000',
  authToken: process.env.AUTH_TOKEN || 'your-secret-token-here',
  reconnectInterval: process.env.RECONNECT_INTERVAL || 5000,
  maxReconnectAttempts: process.env.MAX_RECONNECT_ATTEMPTS || 10,
  webInterfacePort: process.env.WEB_INTERFACE_PORT || 8080
};

let ws = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let webInterface = null;
let monitorServer = null;

// Create HTTPS agent for local HTTPS connections
let httpsAgent = null;
try {
  // Try to load SSL certificates for client authentication (if needed)
  const certPath = path.join(__dirname, 'ssl', 'cert.pem');
  const keyPath = path.join(__dirname, 'ssl', 'key.pem');
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    
    // For localhost HTTPS connections, we need to trust our own certificate
    httpsAgent = new https.Agent({
      ca: [cert], // Trust our own certificate as CA
      rejectUnauthorized: false, // Accept self-signed certificates for localhost
      servername: 'localhost' // Explicitly set server name for certificate validation
    });
    log('local', 'SSL certificates loaded from ssl/ folder');
  } else {
    log('warn', 'SSL certificates not found, using default HTTPS agent');
  }
} catch (error) {
  log('warn', `Error loading SSL certificates: ${error.message}`);
}

// If no custom agent was created, create one that accepts self-signed certs for localhost
if (!httpsAgent) {
  httpsAgent = new https.Agent({
    rejectUnauthorized: false, // Accept self-signed certificates for development
    servername: 'localhost'
  });
}

// Create axios instance for local server requests
const localAxios = axios.create({
  baseURL: config.localServerUrl,
  timeout: 25000, // 25 second timeout
  maxRedirects: 5,
  validateStatus: () => true, // Accept all status codes
  httpsAgent: httpsAgent, // Use our custom HTTPS agent
  transformResponse: [(data) => {
    // Handle empty responses gracefully
    if (!data || data === '') {
      return null;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return data; // Return raw data if not JSON
    }
  }]
});

// Connect to cloud proxy
function connect() {
  log('proxy', `Connecting to ${config.cloudProxyUrl}`);
  
  ws = new WebSocket(config.cloudProxyUrl);
  
  ws.on('open', () => {
    log('proxy', 'Connected to cloud proxy');
    reconnectAttempts = 0;
    
    // Authenticate
    ws.send(JSON.stringify({
      type: 'auth',
      token: config.authToken
    }));
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'auth_success':
          log('proxy', 'Authentication successful');
          log('local', `Ready to forward requests to ${config.localServerUrl}`);
          break;
          
        case 'auth_failed':
          log('error', 'Authentication failed - check your AUTH_TOKEN');
          process.exit(1);
          break;
          
        case 'request':
          handleRequest(message);
          break;
          
        default:
          log('warn', `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      log('error', `Error parsing message: ${error.message}`);
    }
  });
  
  ws.on('close', (code, reason) => {
    log('error', `Connection closed: ${code} ${reason}`);
    scheduleReconnect();
  });
  
  ws.on('error', (error) => {
    log('error', `WebSocket error: ${error.message}`);
  });
}

// Handle incoming requests from cloud proxy
async function handleRequest(message) {
  const { requestId, method, url, headers, body, query } = message;
  
  // Build full URL with query parameters for logging
  let fullUrl = url;
  if (query && Object.keys(query).length > 0) {
    const queryString = new URLSearchParams(query).toString();
    fullUrl = `${url}?${queryString}`;
  }
  
  log('server', `${method} ${fullUrl} [${requestId.substring(0, 8)}]`);
  
  // Broadcast request to monitor
  if (monitorServer) {
    monitorServer.broadcastRequest({
      requestId,
      method,
      url: fullUrl,
      headers,
      body
    });
  }
  
  try {
    // Prepare request options
    const requestOptions = {
      method: method.toLowerCase(),
      url: url.startsWith('/') ? url : '/' + url,
      params: query,
      headers: { ...headers },
      timeout: 25000
    };
    
    // Remove problematic headers
    delete requestOptions.headers.host;
    delete requestOptions.headers.connection;
    delete requestOptions.headers['content-length'];
    
    // Add body for POST/PUT/PATCH requests
    if (body && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      requestOptions.data = body;
    }
    
    // Make request to local server
    const response = await localAxios(requestOptions);
    
    // Send response back to cloud proxy
    const responseMessage = {
      type: 'response',
      requestId,
      statusCode: response.status,
      headers: response.headers,
      body: response.data
    };
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(responseMessage));
      log('server', `${response.status} ${method} ${fullUrl} [${requestId.substring(0, 8)}]`);
      
      // Broadcast response to monitor
      if (monitorServer) {
        monitorServer.broadcastResponse({
          requestId,
          method,
          url: fullUrl,
          statusCode: response.status,
          responseTime: Date.now() - message.timestamp
        });
      }
    } else {
      log('error', `Cannot send response for request [${requestId.substring(0, 8)}]: WebSocket not connected`);
    }
    
  } catch (error) {
    log('error', `Error ${method} ${fullUrl} [${requestId.substring(0, 8)}]: ${error.message}`);
    
    // Determine appropriate status code and response based on error type
    let statusCode = 500;
    let errorBody = {
      error: 'Local Server Error',
      message: error.message
    };
    
    // Handle different types of connection errors
    if (error.code === 'ECONNREFUSED') {
      statusCode = 502;
      errorBody = {
        error: 'Connection Refused',
        message: 'Local server is not running or not accepting connections',
        details: `Failed to connect to ${config.localServerUrl}`
      };
    } else if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
      statusCode = 502;
      errorBody = {
        error: 'Connection Reset',
        message: 'Local server closed the connection unexpectedly',
        details: 'The local server may not be configured to handle HTTP requests properly'
      };
    } else if (error.code === 'ETIMEDOUT') {
      statusCode = 504;
      errorBody = {
        error: 'Gateway Timeout',
        message: 'Local server did not respond within the timeout period'
      };
    } else if (error.response) {
      statusCode = error.response.status;
      errorBody = error.response.data || errorBody;
    }
    
    // Send error response back to cloud proxy
    const errorResponse = {
      type: 'response',
      requestId,
      statusCode,
      headers: { 
        'content-type': 'application/json',
        'x-tunnel-error': 'true'
      },
      body: errorBody
    };
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(errorResponse));
      log('error', `${statusCode} ${method} ${fullUrl} [${requestId.substring(0, 8)}] ERROR`);
      
      // Broadcast error response to monitor
      if (monitorServer) {
        monitorServer.broadcastResponse({
          requestId,
          method,
          url: fullUrl,
          statusCode,
          error: true
        });
      }
    } else {
      log('error', `Cannot send error response for request [${requestId.substring(0, 8)}]: WebSocket not connected`);
    }
  }
}

// Schedule reconnection
function scheduleReconnect() {
  if (reconnectAttempts >= config.maxReconnectAttempts) {
    log('error', `Max reconnection attempts (${config.maxReconnectAttempts}) reached. Exiting.`);
    process.exit(1);
  }
  
  reconnectAttempts++;
  log('warn', `Scheduling reconnection attempt ${reconnectAttempts}/${config.maxReconnectAttempts} in ${config.reconnectInterval}ms`);
  
  reconnectTimer = setTimeout(() => {
    connect();
  }, config.reconnectInterval);
}

// Graceful shutdown
function shutdown() {
  log('local', 'Shutting down local client...');
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  
  if (ws) {
    ws.close();
  }
  
  if (webInterface) {
    webInterface.close();
  }
  
  process.exit(0);
}

// Handle process signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the client
console.log('Local Tunnel Client Starting');
console.log(`Cloud Proxy: ${config.cloudProxyUrl}`);
console.log(`Local Server: ${config.localServerUrl}`);
console.log(`Auth Token: ${config.authToken}`);
console.log(`Web Interface: http://localhost:${config.webInterfacePort}`);
console.log('');

// Initialize web interface
webInterface = new WebInterface();
monitorServer = webInterface.init(config.webInterfacePort);

// Connect logging to monitor
setMonitorServer(monitorServer);

// Test local server connectivity first
localAxios.get('/').then(() => {
  log('local', 'Server is reachable');
  connect();
}).catch((error) => {
  log('warn', 'Server test failed, but continuing anyway...');
  log('warn', `Error: ${error.message}`);
  connect();
});