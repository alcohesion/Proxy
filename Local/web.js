const { web: { setupWeb } } = require('./configs');
const { MonitorServer } = require('./wss');

class WebInterface {
  constructor() {
    this.expressApp = null;
    this.monitorServer = null;
    this.httpServer = null;
  }
  
  init(port = 8080) {
    // Setup Express app
    this.expressApp = setupWeb();
    
    // Start HTTP server with Express
    this.httpServer = this.expressApp.listen(port, () => {
      console.log(`Web interface running on http://localhost:${port}`);
    });
    
    // Setup WebSocket server using uWebSockets.js on a different port
    this.monitorServer = new MonitorServer();
    const wsPort = port + 1; // Use next port for WebSocket
    this.monitorServer.init();
    this.monitorServer.listen(wsPort);
    
    return this.monitorServer;
  }
  
  getMonitorServer() {
    return this.monitorServer;
  }
  
  close() {
    if (this.httpServer) {
      this.httpServer.close();
    }
    // uWebSockets.js will close automatically
  }
}

module.exports = WebInterface;
