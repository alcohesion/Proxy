const log = require('../../../logging');
const { Request, Device } = require('../../../models');
const { request: requestQuery, device: deviceQuery } = require('../../../queries');
const { proxy } = require('../../../configs');

const createOrUpdateDevice = async (deviceInfo) => {
	try {
		return await deviceQuery.findOrCreate(deviceInfo);
	} catch (error) {
		log.error('Error creating/updating device:', error);
		return null;
	}
};

const createRequest = async (reqData, device) => {
	try {
		const requestData = {
			method: reqData.method,
			url: reqData.url,
			path: reqData.path,
			query: reqData.query,
			headers: reqData.headers,
			body: null,
			device: device ? device._id : null,
			status: 'pending'
		};

		return await requestQuery.create(requestData);
	} catch (error) {
		log.error('Error creating request:', error);
		return null;
	}
};

const sendResponse = (res, status, data, contentType = 'application/json') => {
	res.cork(() => {
		res.writeStatus(`${status} ${getStatusText(status)}`)
			.writeHeader('Content-Type', contentType);
		
		if (contentType === 'application/json') {
			res.end(JSON.stringify(data));
		} else {
			res.end(data);
		}
	});
};

const getStatusText = (status) => {
	const statuses = {
		200: 'OK',
		500: 'Internal Server Error',
		502: 'Bad Gateway',
		504: 'Gateway Timeout'
	};
	return statuses[status] || 'Unknown';
};

module.exports = (app, client) => {
	// Handle all HTTP requests for forwarding
	app.any('/*', async (res, req) => {
		// Skip health and metrics endpoints - they have their own handlers
		if (req.getUrl().startsWith('/metrics') || req.getUrl().startsWith('/health') || req.getUrl().startsWith('/status')) {
			return; // Let other handlers handle these
		}

		let aborted = false;
		res.onAborted(() => {
			aborted = true;
			log.warn('Proxy request aborted');
		});

		// Extract all request data immediately - don't access req after await
		const requestData = {
			method: req.getMethod().toUpperCase(),
			url: req.getUrl(),
			path: req.getUrl().split('?')[0],
			query: req.getQuery(),
			headers: {}
		};

		// Extract headers immediately
		req.forEach((key, value) => {
			requestData.headers[key] = value;
		});

		// Log incoming HTTP request
		log.request(`HTTP request received - Method: ${requestData.method}, Path: ${requestData.path}, IP: ${requestData.headers['x-forwarded-for'] || requestData.headers['x-real-ip'] || 'unknown'}`);

		// Extract device info immediately
		const deviceInfo = {
			ip: requestData.headers['x-forwarded-for'] || requestData.headers['x-real-ip'] || 'unknown',
			userAgent: requestData.headers['user-agent'] || null,
			fingerprint: Buffer.from(`${requestData.headers['x-forwarded-for'] || requestData.headers['x-real-ip'] || 'unknown'}${requestData.headers['user-agent'] || ''}`).toString('base64'),
			connection: {
				protocol: requestData.headers['x-forwarded-proto'] || 'http',
				secure: requestData.headers['x-forwarded-proto'] === 'https'
			}
		};

		try {
			// Now we can safely do async operations
			const device = await createOrUpdateDevice(deviceInfo);
			const request = await createRequest(requestData, device);

			// Log request creation with hex ID
			if (request) {
				log.proxy(`Request created - Method: ${requestData.method}, Path: ${requestData.path}, RequestID: ${request.hex}`);
			}

			if (!client.isClientConnected()) {
				if (!aborted) {
					sendResponse(res, 502, {
						error: 'Service Unavailable',
						message: 'Local development server is not connected',
						timestamp: new Date().toISOString()
					});
				}
				
				if (request) {
					await requestQuery.updateStatus(request.hex, 'error', 'Local client not connected');
				}
				return;
			}

			if (!request) {
				if (!aborted) {
					sendResponse(res, 500, {
						error: 'Internal Server Error',
						message: 'Failed to create request record',
						timestamp: new Date().toISOString()
					});
				}
				return;
			}

			// Store response object
			client.addPendingRequest(request.hex, { res, request, startTime: Date.now() });

			// Function to process and forward request
			const processRequest = async (body = '') => {
				const localClient = client.getLocalClient();
				if (localClient && localClient.authenticated) {
					try {
						// Log message being sent to local WebSocket
						log.wss(`Sending to local WS client - Method: ${request.method}, Path: ${request.path}, RequestID: ${request.hex}`);
						
						// Send request to local client
						localClient.send(JSON.stringify({
							type: 'request',
							requestId: request.hex,
							method: request.method,
							url: request.url,
							path: request.path,
							query: request.query,
							headers: request.headers,
							body: body || null,
							timestamp: new Date().toISOString()
						}));

						// Update request status
						await requestQuery.updateStatus(request.hex, 'forwarded');
						await requestQuery.updateByHex(request.hex, { body: body || null });
						
						log.proxy(`Request forwarded successfully - Method: ${request.method}, Path: ${request.path}, RequestID: ${request.hex}`);
					} catch (error) {
						log.error('Error sending request to local client:', error);
						
						// Send error response
						client.removePendingRequest(request.hex);
						if (!aborted) {
							sendResponse(res, 500, {
								error: 'Internal Server Error',
								message: 'Failed to forward request to local client',
								timestamp: new Date().toISOString()
							});
						}
					}
				} else {
					// Local client not available
					client.removePendingRequest(request.hex);
					if (!aborted) {
						sendResponse(res, 502, {
							error: 'Service Unavailable',
							message: 'Local client not available',
							timestamp: new Date().toISOString()
						});
					}
				}
			};

			// Handle request body reading
			if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'DELETE') {
				// For methods that typically don't have a body, process immediately
				await processRequest('');
			} else {
				// For methods that might have a body, read it first
				let body = '';
				res.onData(async (chunk, isLast) => {
					body += Buffer.from(chunk).toString();
					if (isLast) {
						await processRequest(body);
					}
				});
			}

			res.onAborted(async () => {
				client.removePendingRequest(request.hex);
				if (request) {
					try {
						await requestQuery.updateStatus(request.hex, 'error', 'Request aborted');
					} catch (error) {
						log.error('Error updating aborted request:', error);
					}
				}
			});

			// Set timeout
			setTimeout(async () => {
				if (client.hasPendingRequest(request.hex)) {
					const { res, request: req } = client.getPendingRequest(request.hex);
					client.removePendingRequest(request.hex);

					if (!res.aborted) {
						sendResponse(res, 504, {
							error: 'Gateway Timeout',
							message: 'Local server did not respond in time',
							requestId: req.hex,
							timestamp: new Date().toISOString()
						});
					}
					
					try {
						await requestQuery.updateStatus(req.hex, 'timeout');
						log.proxy(`Request timeout - RequestID: ${req.hex}, Duration: ${proxy.timeout}ms`);
					} catch (error) {
						log.error('Error updating timeout request:', error);
					}
				}
			}, proxy.timeout);

		} catch (error) {
			log.error('Error processing request:', error);
			if (!aborted) {
				sendResponse(res, 500, {
					error: 'Internal Server Error',
					message: 'Failed to process request',
					timestamp: new Date().toISOString()
				});
			}
		}
	});
};