const { security, proxy } = require('../../configs');
const { Request } = require('../../models');
const { request: requestQuery } = require('../../queries');
const { pendingRequests, setLocalClient } = require('./forward');
const { bull: { metricsQueue } } = require('../../queues');

const connectionStats = {
	totalConnections: 0,
	currentConnections: 0,
	lastConnection: null,
	startTime: new Date()
};

module.exports = (app, api) => {
	app.ws('/', {
		compression: proxy.compression.enabled ? 1 : 0,
		maxCompressedSize: proxy.websocket.maxCompressedSize,
		maxBackpressure: proxy.websocket.maxBackpressure,
		
		message: async (ws, message, opCode) => {
			try {
				const data = JSON.parse(Buffer.from(message).toString());
				
				// Handle authentication
				if (data.type === 'auth') {
					if (data.token === security.authToken) {
						setLocalClient(ws);
						ws.isAuthenticated = true;
						ws.clientType = 'local';
						
						console.log('Local client authenticated and connected');
						
						ws.send(JSON.stringify({
							type: 'auth_success',
							serverInfo: {
								uptime: process.uptime(),
								timestamp: new Date().toISOString()
							}
						}));
					} else {
						console.log('Authentication failed');
						ws.send(JSON.stringify({ 
							type: 'auth_failed', 
							reason: 'Invalid token' 
						}));
						ws.close();
					}
					return;
				}
				
				// Require authentication for other messages
				if (!ws.isAuthenticated) {
					ws.send(JSON.stringify({ 
						type: 'error', 
						message: 'Authentication required' 
					}));
					return;
				}
				
				// Handle response from local server
				if (data.type === 'response') {
					const { requestId, statusCode, headers, body } = data;
					const pendingReq = pendingRequests.get(requestId);
					
					if (pendingReq) {
						const { res, request, startTime } = pendingReq;
						const duration = Date.now() - startTime;
						
						if (!res.aborted) {
							// Set headers
							if (headers) {
								Object.entries(headers).forEach(([key, value]) => {
									try {
										res.writeHeader(key, value);
									} catch (err) {
										console.warn(`Failed to set header ${key}:`, err.message);
									}
								});
							}
							
							res.writeStatus(statusCode || 200);
							res.end(body || '');
						}
						
						// Update request in database
						const responseData = {
							statusCode: statusCode || 200,
							headers: headers || {},
							body: body || null,
							duration,
							receivedAt: new Date()
						};
						
						await requestQuery.updateResponse(request.hex, responseData);
						
						// Send to metrics queue
						metricsQueue.add('response', {
							requestId: request.hex,
							statusCode: statusCode || 200,
							duration,
							timestamp: new Date().toISOString()
						});
						
						pendingRequests.delete(requestId);
						console.log(`Response sent for request ${requestId} (${duration}ms)`);
					} else {
						console.warn(`Received response for unknown request ${requestId}`);
					}
				}
				
				// Handle ping/pong
				if (data.type === 'ping') {
					ws.send(JSON.stringify({ 
						type: 'pong', 
						timestamp: new Date().toISOString() 
					}));
				}
				
			} catch (error) {
				console.error('Error parsing WebSocket message:', error);
				ws.send(JSON.stringify({ 
					type: 'error', 
					message: 'Invalid message format' 
				}));
			}
		},
		
		open: (ws) => {
			connectionStats.totalConnections++;
			connectionStats.currentConnections++;
			connectionStats.lastConnection = new Date();
			
			console.log('New WebSocket connection');
			
			ws.send(JSON.stringify({
				type: 'welcome',
				message: 'Connected to Proxy Server',
				timestamp: new Date().toISOString()
			}));
		},
		
		close: (ws, code, message) => {
			connectionStats.currentConnections--;
			
			if (ws.clientType === 'local') {
				setLocalClient(null);
				console.log('Local client disconnected');
			}
			
			console.log(`WebSocket connection closed (${code})`);
		}
	});
};
