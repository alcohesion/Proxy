const queries = require('../queries');
const log = require('../logging');
const { auth, tunnel } = require('../utils');

const {
	proxy: { message }
} = require('../handlers');

// Main proxy WebSocket endpoint
class ProxyWebSocket {
	constructor(app, settings) {
		this.app = app;
		this.activeClient = null; // Store the single active client directly
		this.pendingRequests = new Map(); // Store pending HTTP requests
		
		this.init(app, settings);
	}
	
	init = (app, settings) => {
		// Main proxy WebSocket endpoint
		app.ws('/', {
			compression: settings.compression,
			maxPayloadLength: 16 * 1024 * 1024,
			idleTimeout: 0,
			
			upgrade: async (res, req, context) => {
				try {
					const token = req.getQuery('token');
					const userAgent = req.getHeader('user-agent');
					const ip = req.getHeader('x-forwarded-for') || req.getHeader('x-real-ip') || 'unknown';
					
					// Pass connection data to WebSocket
					res.upgrade(
						{ 
							token: token,
							userAgent: userAgent,
							ip: ip,
							authenticated: false
						},
						req.getHeader('sec-websocket-key'),
						req.getHeader('sec-websocket-protocol'),
						req.getHeader('sec-websocket-extensions'),
						context
					);
				} catch (error) {
					log.error('Proxy WebSocket upgrade error:', error);
					res.writeStatus('400 Bad Request').end('WebSocket upgrade failed');
				}
			},
			
			open: async (ws) => {
				try {
					// Authenticate first - check ws.token
					if (!auth.validateToken(ws.token)) {
						log.warn(`Authentication failed for connection - Invalid token`);
						const errorMessage = tunnel.createErrorMessage('Authentication required', 'AUTH_REQUIRED');
						ws.send(JSON.stringify(errorMessage));
						ws.close();
						return;
					}
					
					// Set authenticated flag
					ws.authenticated = true;
					
					// Check if we already have an active client
					if (this.activeClient) {
						log.warn('Another client is already connected - rejecting new connection');
						const errorMessage = tunnel.createErrorMessage('Another client is already connected', 'CLIENT_ALREADY_CONNECTED');
						ws.send(JSON.stringify(errorMessage));
						ws.close();
						return;
					}
					
					// Set up the WebSocket client object with connection data
					ws.connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
					ws.connectedAt = new Date().toISOString();
					ws.proxyInstance = this;
					
					// Create device/connection record and store on ws
					const deviceHex = `D0X${require('crypto').randomBytes(6).toString('hex').toUpperCase()}`;
					const device = {
						hex: deviceHex,
						ip: ws.ip,
						userAgent: ws.userAgent,
						connectedAt: ws.connectedAt,
						status: 'connected'
					};
					
					// Store device data on ws object
					ws.device = device;
					
					// Set as active client
					this.activeClient = ws;
					
					// Send authentication success message using tunnel format
					const authMessage = tunnel.createAuthMessage('authenticated', 'Connection established successfully');
					ws.send(JSON.stringify(authMessage));
					
					log.connect(`WebSocket connection accepted - ConnectionID: ${ws.connectionId}`);
					log.connect(`Device record created - DeviceHex: ${deviceHex}`);
					log.connect('Local client connected and registered for request forwarding');
				} catch (error) {
					log.error('Error in WebSocket open handler:', error);
					ws.close();
				}
			},
			
			message: async (ws, messageData, isBinary) => {
				await message(ws, messageData, isBinary, log, queries);
			},
			
			close: (ws, code, message) => {
				log.disconnect(`WebSocket connection closed - ConnectionID: ${ws.connectionId}`);
				
				// Clear active client if this was the active one
				if (this.activeClient === ws) {
					this.activeClient = null;
					log.disconnect('Local client disconnected');
				}
			},
			
			drain: (ws) => {
				log.proxy('WebSocket backpressure: ' + ws.getBufferedAmount());
			}
		});
	}
	
	// Get connection statistics
	getStats() {
		return {
			total: this.activeClient ? 1 : 0,
			authenticated: this.activeClient ? 1 : 0,
			hasActiveConnection: !!this.activeClient
		};
	}
	
	// Check if there's an active connection
	hasActiveConnection() {
		return !!this.activeClient;
	}
	
	// Add a pending request
	addPendingRequest(requestId, data) {
		this.pendingRequests.set(requestId, data);
	}

	// Remove a pending request
	removePendingRequest(requestId) {
		this.pendingRequests.delete(requestId);
	}

	// Get a pending request
	getPendingRequest(requestId) {
		return this.pendingRequests.get(requestId);
	}

	// Send response back to pending HTTP request
	sendResponse(requestId, responseData) {
		const pendingRequest = this.pendingRequests.get(requestId);
		if (!pendingRequest) {
			log.warn(`No pending request found for ID: ${requestId}`);
			return false;
		}

		const { res, request } = pendingRequest;
		
		// Check if response is already sent or aborted
		if (res.aborted) {
			log.warn(`Response already aborted for request: ${requestId}`);
			this.removePendingRequest(requestId);
			return false;
		}

		try {
			// Send response using cork for proper uWebSockets handling
			res.cork(() => {
				res.writeStatus(`${responseData.statusCode} ${this.getStatusText(responseData.statusCode)}`);
				
				// Normalize and deduplicate headers to prevent conflicts
				if (responseData.headers) {
					const normalizedHeaders = {};
					
					// Headers that uWebSockets.js automatically adds - exclude these to prevent duplicates
					const autoAddedHeaders = new Set([
						'date',           // uWebSockets.js adds Date header automatically
						'content-length', // uWebSockets.js calculates this based on body
						'connection',     // Managed by uWebSockets.js
						'server'          // May be added automatically
					]);
					
					// Normalize header names to lowercase and remove duplicates
					Object.keys(responseData.headers).forEach(key => {
						const normalizedKey = key.toLowerCase();
						
						// Skip headers that uWebSockets.js adds automatically to prevent duplicates
						if (autoAddedHeaders.has(normalizedKey)) {
							return;
						}
						
						// Only keep the first occurrence of each header (case-insensitive)
						if (!normalizedHeaders[normalizedKey]) {
							normalizedHeaders[normalizedKey] = responseData.headers[key];
						}
					});
					
					// Write normalized headers
					Object.keys(normalizedHeaders).forEach(key => {
						res.writeHeader(key, normalizedHeaders[key]);
					});
				}
				
				// Send response body
				if (responseData.body) {
					res.end(responseData.body);
				} else {
					res.end();
				}
			});

			// Clean up pending request
			this.removePendingRequest(requestId);
			return true;

		} catch (error) {
			log.error(`Error sending response for request ${requestId}:`, error);
			this.removePendingRequest(requestId);
			return false;
		}
	}

	getStatusText(status) {
		const statuses = {
			200: 'OK',
			201: 'Created',
			202: 'Accepted',
			204: 'No Content',
			400: 'Bad Request',
			401: 'Unauthorized',
			403: 'Forbidden',
			404: 'Not Found',
			405: 'Method Not Allowed',
			500: 'Internal Server Error',
			502: 'Bad Gateway',
			503: 'Service Unavailable',
			504: 'Gateway Timeout'
		};
		return statuses[status] || 'Unknown';
	}
}

module.exports = ProxyWebSocket;
