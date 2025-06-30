const { Request, Device } = require('../../../models');
const { request: requestQuery, device: deviceQuery } = require('../../../queries');
const { proxy } = require('../../../configs');
const { bull: { requestQueue } } = require('../../../queues');

let localClient = null;
const pendingRequests = new Map();

const getDeviceInfo = (req) => {
	const ip = req.getHeader('x-forwarded-for') || req.getHeader('x-real-ip') || 'unknown';
	const userAgent = req.getHeader('user-agent') || null;
	
	return {
		ip,
		userAgent,
		fingerprint: Buffer.from(`${ip}${userAgent}`).toString('base64'),
		connection: {
			protocol: req.getHeader('x-forwarded-proto') || 'http',
			secure: req.getHeader('x-forwarded-proto') === 'https'
		}
	};
};

const createOrUpdateDevice = async (deviceInfo) => {
	try {
		return await deviceQuery.findOrCreate(deviceInfo);
	} catch (error) {
		console.error('Error creating/updating device:', error);
		return null;
	}
};

const createRequest = async (req, device) => {
	try {
		const requestData = {
			method: req.getMethod().toUpperCase(),
			url: req.getUrl(),
			path: req.getUrl().split('?')[0],
			query: req.getQuery() || {},
			headers: {},
			body: null,
			device: device ? device._id : null,
			status: 'pending'
		};

		// Extract headers
		req.forEach((key, value) => {
			requestData.headers[key] = value;
		});

		return await requestQuery.create(requestData);
	} catch (error) {
		console.error('Error creating request:', error);
		return null;
	}
};

module.exports = (app, api) => {
	// Handle all HTTP requests for forwarding
	app.any('/*', async (res, req) => {
		if (req.getUrl().startsWith('/metrics') || req.getUrl().startsWith('/health')) {
			return; // Skip these endpoints
		}

		const deviceInfo = getDeviceInfo(req);
		const device = await createOrUpdateDevice(deviceInfo);
		const request = await createRequest(req, device);

		if (!localClient) {
			res.writeStatus('502 Bad Gateway');
			res.writeHeader('Content-Type', 'application/json');
			res.end(JSON.stringify({
				error: 'Service Unavailable',
				message: 'Local development server is not connected',
				timestamp: new Date().toISOString()
			}));
			
			if (request) {
				await requestQuery.updateStatus(request.hex, 'error', 'Local client not connected');
			}
			return;
		}

		if (!request) {
			res.writeStatus('500 Internal Server Error');
			res.writeHeader('Content-Type', 'application/json');
			res.end(JSON.stringify({
				error: 'Internal Server Error',
				message: 'Failed to create request record',
				timestamp: new Date().toISOString()
			}));
			return;
		}

		// Store response object
		pendingRequests.set(request.hex, { res, request, startTime: Date.now() });

		// Read request body
		let body = '';
		res.onData(async (chunk, isLast) => {
			body += Buffer.from(chunk).toString();
			if (isLast) {
				// Send to request queue for processing
				requestQueue.add('forward', {
					requestId: request.hex,
					method: request.method,
					url: request.url,
					path: request.path,
					query: request.query,
					headers: request.headers,
					body: body || null
				});

				// Update request status
				try {
					await requestQuery.updateStatus(request.hex, 'forwarded');
					await requestQuery.updateByHex(request.hex, { body: body || null });
				} catch (error) {
					console.error('Error updating request:', error);
				}
			}
		});

		res.onAborted(async () => {
			pendingRequests.delete(request.hex);
			if (request) {
				try {
					await requestQuery.updateStatus(request.hex, 'error', 'Request aborted');
				} catch (error) {
					console.error('Error updating aborted request:', error);
				}
			}
		});

		// Set timeout
		setTimeout(async () => {
			if (pendingRequests.has(request.hex)) {
				const { res, request: req } = pendingRequests.get(request.hex);
				pendingRequests.delete(request.hex);
				
				if (!res.aborted) {
					res.writeStatus('504 Gateway Timeout');
					res.writeHeader('Content-Type', 'application/json');
					res.end(JSON.stringify({
						error: 'Gateway Timeout',
						message: 'Local server did not respond in time',
						requestId: req.hex,
						timestamp: new Date().toISOString()
					}));
				}
				
				try {
					await requestQuery.updateStatus(req.hex, 'timeout');
				} catch (error) {
					console.error('Error updating timeout request:', error);
				}
			}
		}, proxy.timeout);
	});
};

// Export for use in websocket handler
module.exports.pendingRequests = pendingRequests;
module.exports.setLocalClient = (client) => { localClient = client; };
