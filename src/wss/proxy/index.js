const manager = require('./connection');
const { request, response } = require('./request');

// Import all dependencies centrally
const { tunnel, crypto } = require('../../utils');
const { protocol } = require('../../configs');

// Main proxy WebSocket class
module.exports = class ProxyWebSocket {
	constructor(app, handler, log, queries, settings) {
		this.app = app;
		this.pendingRequests = new Map();
		this.activeConnections = new Map();
		this.deps = { tunnel, crypto, protocol, queries, log };
    this.handler = handler;
		this.init(app, settings);
	}
	
	init = (app, settings) => {
		app.ws('/', {
			compression: settings.compression,
			maxPayloadLength: 16 * 1024 * 1024,
			idleTimeout: 0,
			
			upgrade: (res, req, context) => {
				manager.upgrade(res, req, context, this.deps);
			},
			
			open: (ws) => {
				this.connection.add(manager.open(ws, this.deps, this.activeConnections));
			},
			
			message: async (ws, messageData, isBinary) => {
				await this.handler.message(ws, messageData, isBinary, this.deps);
			},
			
			close: (ws, code, message) => {
				this.connection.close(manager.close(ws, this.app, this.deps));
			},
			
			drain: (ws) => {
				log.proxy('WebSocket backpressure: ' + ws.getBufferedAmount());
			},

      error: (ws, error) => {
        log.error(`WebSocket error on connection ${ws.connectionId}: ${error.message}`);
        if (ws) {
          const errorMessage = tunnel.createErrorMessage('WebSocket error occurred', 'WEBSOCKET_ERROR', this.deps.crypto, this.deps.protocol);
          ws.send(JSON.stringify(errorMessage));
          ws.close();
        }
      }
		});
	}

  connection = {
    add: ws => {
      if (!ws || !ws.connectionId) throw new Error('Invalid WebSocket connection');
      this.activeConnections.set(ws.connectionId, ws);
    },
    remove: id => {
      if (!id) throw new Error('Connection ID is required');
      this.activeConnections.delete(id);
      // delete all connections if needed
      if (this.activeConnections.size > 0) this.activeConnections.clear();
      // delete all pending requests
      if (this.pendingRequests.size > 0) this.pendingRequests.clear();
      log.disconnect(`Connection removed - ID: ${id}`);
    },
    get: () => {
      // get the first active connection
      if (this.activeConnections.size === 0) return null;
      const id = Array.from(this.activeConnections.keys())[0];
      if (!id) return null;
      if (!this.activeConnections.has(id)) return null;
      return this.activeConnections.get(id);
    },
  }

  send = message => {
    const connection = this.connection.get();
    if (connection && connection.readyState === 1) {
      connection.send(message);
      return true;
    }
    return false; // No active connection to send the message
  }

  request = {
    add: (requestId, data) => request.add(this.pendingRequests, requestId, data),
    remove: (requestId) => request.remove(this.pendingRequests, requestId),
    get: (requestId) => request.get(this.pendingRequests, requestId),
    has: (requestId) => request.has(this.pendingRequests, requestId),
  }

  response = {
    send: (requestId, responseData) => response.send(this.pendingRequests, requestId, responseData, log),
  }
}