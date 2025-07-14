const { 
	getData, 
	getDevice, 
	sendResponse,
	shouldSkipRoute,
	processRequest,
	setupAbortHandler,
	setupTimeoutHandler,
	setupInitialAbortHandler
} = require('./helpers');

module.exports = class ProxyHandlers {
	constructor(app, queries, log, handler, settings, wss) {
		this.app = app;
		this.queries = queries;
		this.log = log;
		this.proxy = new wss(this.app, handler, log, queries, settings);
		this.initializeHandlers();
	}

	initializeHandlers() {
		// Handle all HTTP requests for forwarding
		this.app.any('/*', async (res, req) => {
			// Skip health and metrics endpoints - they have their own handlers
			if (shouldSkipRoute(req.getUrl())) return;

			const { device: { crud: { createOrUpdate } } } = this.queries;
			const { request: { crud: { create: createRequest } } } = this.queries;

			const abortedState = setupInitialAbortHandler(res, this.log);

			// Extract all request data immediately - don't access req after await
			const requestData = await getData(req);

			// Log incoming HTTP request
			this.log.request(`HTTP request received - Method: ${requestData.method}, Path: ${requestData.path}, IP: ${requestData.headers['x-forwarded-for'] || requestData.headers['x-real-ip'] || 'unknown'}`);

			// For methods that might have a body, set up body reading IMMEDIATELY before any async operations
			let bodyPromise = null;
			if (requestData.method !== 'GET' && requestData.method !== 'HEAD' && requestData.method !== 'DELETE') {
				this.log.proxy(`Setting up immediate body reading for ${requestData.method}`);
				bodyPromise = new Promise((resolve) => {
					let body = '';
					let hasReceivedData = false;
					
					res.onData((chunk, isLast) => {
						hasReceivedData = true;
						body += Buffer.from(chunk).toString();
						this.log.proxy(`Received data chunk for ${requestData.method}, isLast: ${isLast}, bodyLength: ${body.length}`);
						
						if (isLast) {
							this.log.proxy(`Body reading complete for ${requestData.method}, bodyLength: ${body.length}`);
							resolve(body);
						}
					});
					
					// Fallback timeout
					setTimeout(() => {
						if (!hasReceivedData) {
							this.log.proxy(`No data received within 2s for ${requestData.method}, resolving with empty body`);
							resolve('');
						}
					}, 2000);
				});
			}

			try {
				// Now we can safely do async operations
				const { device, request } = await getDevice(requestData, { device: createOrUpdate, request: createRequest }, this.log)

				// Store response object
				this.proxy.request.add(request.hex, { res, request, startTime: Date.now() });

				// Get the body (either immediately for GET/HEAD/DELETE or wait for promise)
				let body = '';
				if (bodyPromise) {
					this.log.proxy(`Waiting for body data for ${request.method} - RequestID: ${request.hex}`);
					body = await bodyPromise;
					this.log.proxy(`Body received for ${request.method} - RequestID: ${request.hex}, bodyLength: ${body.length}`);
					
					// Parse JSON body if content-type is application/json
					if (body && request.headers && 
						(request.headers['content-type'] || '').toLowerCase().includes('application/json')) {
						try {
							this.log.proxy(`Parsing JSON body for ${request.method} - RequestID: ${request.hex}`);
							body = JSON.parse(body);
							this.log.proxy(`JSON body parsed successfully for ${request.method} - RequestID: ${request.hex}`);
						} catch (error) {
							this.log.proxy(`Failed to parse JSON body for ${request.method} - RequestID: ${request.hex}, keeping as string`);
							// Keep as string if parsing fails
						}
					}
				} else {
					this.log.proxy(`No body expected for ${request.method} - RequestID: ${request.hex}`);
				}

				// Process the request with the body and dependencies
				this.log.proxy(`Processing request for ${request.method} - RequestID: ${request.hex}, bodyLength: ${body.length || 0}`);
				await processRequest(body, request, this.proxy.activeConnections, sendResponse, res, abortedState.aborted);

				// Set up abort and timeout handlers
				setupAbortHandler(res, this.proxy, request, this.queries, this.log);
				setupTimeoutHandler(this.proxy, request, this.queries, { timeout: 30000 }, sendResponse);

			} catch (error) {
				this.log.error('Error processing request:', error);
				this.log.error(`Error in request processing for ${requestData.method}:`, error);
				if (!abortedState.aborted()) {
					sendResponse(res, 500, {
						error: 'Internal Server Error',
						message: 'Failed to process request',
						timestamp: new Date().toISOString()
					});
				}
			}
		});
	}
}