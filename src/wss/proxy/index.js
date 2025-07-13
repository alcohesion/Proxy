const queries = require('../../queries');
const log = require('../../logging');
const { proxy: { message } } = require('../../handlers');
const connection = require('./connection');
const handlers = require('./handlers');
const request = require('./request');
const stats = require('./stats');

// Import all dependencies centrally
const { tunnel, crypto } = require('../../utils');
const { protocol } = require('../../configs');

// Main proxy WebSocket class
class ProxyWebSocket {
	constructor(app, settings) {
		this.app = app;
		this.activeClient = null;
		this.pendingRequests = new Map();
		
		// Centralized dependencies object
		this.deps = {
			tunnel,
			crypto,
			protocol,
			queries,
			log
		};
		
		this.init(app, settings);
	}
	
	init = (app, settings) => {
		app.ws('/', {
			compression: settings.compression,
			maxPayloadLength: 16 * 1024 * 1024,
			idleTimeout: 0,
			
			upgrade: (res, req, context) => {
				connection.manager.handleUpgrade(res, req, context, this.deps);
			},
			
			open: (ws) => {
				connection.manager.handleOpen(ws, this, connection.auth, this.deps);
			},
			
			message: async (ws, messageData, isBinary) => {
				await message(ws, messageData, isBinary, this.deps);
			},
			
			close: (ws, code, message) => {
				connection.manager.handleClose(ws, this, this.deps);
			},
			
			drain: (ws) => {
				handlers.events.drain(ws, this.deps);
			}
		});
	}
	
	getStats() {
		return stats.connection.getConnectionStats(this.activeClient);
	}
	
	hasActiveConnection() {
		return stats.connection.hasActiveConnection(this.activeClient);
	}
	
	addPendingRequest(requestId, data) {
		request.manager.add(this.pendingRequests, requestId, data);
	}

	removePendingRequest(requestId) {
		request.manager.remove(this.pendingRequests, requestId);
	}

	getPendingRequest(requestId) {
		return request.manager.get(this.pendingRequests, requestId);
	}

	hasPendingRequest(requestId) {
		return this.pendingRequests.has(requestId);
	}

	sendResponse(requestId, responseData) {
		return request.response.send(this.pendingRequests, requestId, responseData, log);
	}
}

module.exports = ProxyWebSocket;
