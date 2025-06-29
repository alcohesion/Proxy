const uWS = require('uWebSockets.js');

class MonitorServer {
  constructor() {
    this.clients = new Set();
    this.app = null;
  }
  
  init(server) {
    this.app = uWS.App({
      // Configure for HTTP server integration
    }).ws('/ws', {
      message: (ws, message, opCode) => {
        // Handle incoming messages from clients if needed
        try {
          const data = JSON.parse(Buffer.from(message).toString());
          // Process client messages if needed
        } catch (error) {
          console.log('Error parsing client message:', error.message);
        }
      },
      
      open: (ws) => {
        this.clients.add(ws);
        console.log('Monitor client connected');
        
        // Send initial connection message
        this.sendToClient(ws, {
          type: 'log',
          kind: 'local',
          message: 'Monitor connected',
          timestamp: new Date().toISOString()
        });
      },
      
      close: (ws, code, message) => {
        this.clients.delete(ws);
        console.log('Monitor client disconnected');
      }
    }).get('/*', (res, req) => {
      // Let Express handle HTTP requests
      res.writeStatus('404 Not Found').end('WebSocket endpoint only');
    });
    
    return this.app;
  }
  
  listen(port) {
    this.app.listen(port, (token) => {
      if (token) {
        console.log(`WebSocket server listening on port ${port}`);
      } else {
        console.log('Failed to listen on port', port);
      }
    });
  }
  
  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      try {
        client.send(message);
      } catch (error) {
        // Remove dead connections
        this.clients.delete(client);
      }
    });
  }
  
  sendToClient(client, data) {
    try {
      client.send(JSON.stringify(data));
    } catch (error) {
      this.clients.delete(client);
    }
  }
  
  broadcastLog(kind, message) {
    this.broadcast({
      type: 'log',
      kind,
      message,
      timestamp: new Date().toISOString()
    });
  }
  
  broadcastRequest(requestData) {
    this.broadcast({
      type: 'request',
      ...requestData,
      timestamp: new Date().toISOString()
    });
  }
  
  broadcastResponse(responseData) {
    this.broadcast({
      type: 'response',
      ...responseData,
      timestamp: new Date().toISOString()
    });
  }
  
  broadcastStats(stats) {
    this.broadcast({
      type: 'stats',
      stats,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = MonitorServer;
