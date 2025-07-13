const { 
	getData, 
	getDevice, 
	sendResponse,
	shouldSkipRoute,
	processRequest,
	setupAbortHandler,
	setupTimeoutHandler,
	validateConnection,
	setupInitialAbortHandler
} = require('./helpers');

module.exports = (app, client, queries, log, proxyConfig) => {
	// Handle all HTTP requests for forwarding
	app.any('/*', async (res, req) => {
		// Skip health and metrics endpoints - they have their own handlers
		if (shouldSkipRoute(req.getUrl())) {
			return; // Let other handlers handle these
		}

		const { device: { crud: { createOrUpdate } } } = queries;
		const { request: { crud: { create: createRequest } } } = queries;

		const abortedState = setupInitialAbortHandler(res, log);

		// Extract all request data immediately - don't access req after await
		const requestData = await getData(req)

		// Log incoming HTTP request
		log.request(`HTTP request received - Method: ${requestData.method}, Path: ${requestData.path}, IP: ${requestData.headers['x-forwarded-for'] || requestData.headers['x-real-ip'] || 'unknown'}`);

		// For methods that might have a body, set up body reading IMMEDIATELY before any async operations
		let bodyPromise = null;
		if (requestData.method !== 'GET' && requestData.method !== 'HEAD' && requestData.method !== 'DELETE') {
			log.proxy(`Setting up immediate body reading for ${requestData.method}`);
			bodyPromise = new Promise((resolve) => {
				let body = '';
				let hasReceivedData = false;
				
				res.onData((chunk, isLast) => {
					hasReceivedData = true;
					body += Buffer.from(chunk).toString();
					log.proxy(`Received data chunk for ${requestData.method}, isLast: ${isLast}, bodyLength: ${body.length}`);
					
					if (isLast) {
						log.proxy(`Body reading complete for ${requestData.method}, bodyLength: ${body.length}`);
						resolve(body);
					}
				});
				
				// Fallback timeout
				setTimeout(() => {
					if (!hasReceivedData) {
						log.proxy(`No data received within 2s for ${requestData.method}, resolving with empty body`);
						resolve('');
					}
				}, 2000);
			});
		}

		try {
			// Now we can safely do async operations
			const { device, request } = await getDevice(requestData, { device: createOrUpdate, request: createRequest }, log)

			// Validate connection and request state
			if(!await validateConnection(client, request, device, queries, sendResponse, res, abortedState.aborted, log)) return;

			// Store response object
			client.addPendingRequest(request.hex, { res, request, startTime: Date.now() });

			// Get the body (either immediately for GET/HEAD/DELETE or wait for promise)
			let body = '';
			if (bodyPromise) {
				log.proxy(`Waiting for body data for ${request.method} - RequestID: ${request.hex}`);
				body = await bodyPromise;
				log.proxy(`Body received for ${request.method} - RequestID: ${request.hex}, bodyLength: ${body.length}`);
				
				// Parse JSON body if content-type is application/json
				if (body && request.headers && 
					(request.headers['content-type'] || '').toLowerCase().includes('application/json')) {
					try {
						log.proxy(`Parsing JSON body for ${request.method} - RequestID: ${request.hex}`);
						body = JSON.parse(body);
						log.proxy(`JSON body parsed successfully for ${request.method} - RequestID: ${request.hex}`);
					} catch (error) {
						log.proxy(`Failed to parse JSON body for ${request.method} - RequestID: ${request.hex}, keeping as string`);
						// Keep as string if parsing fails
					}
				}
			} else {
				log.proxy(`No body expected for ${request.method} - RequestID: ${request.hex}`);
			}

			// Process the request with the body
			log.proxy(`Processing request for ${request.method} - RequestID: ${request.hex}, bodyLength: ${body.length || 0}`);
			await processRequest(body, request, client, log, queries, sendResponse, res, abortedState.aborted);

			// Set up abort and timeout handlers
			setupAbortHandler(res, client, request, queries, log);
			setupTimeoutHandler(client, request, queries, log, proxyConfig, sendResponse);

		} catch (error) {
			log.error('Error processing request:', error);
			log.error(`Error in request processing for ${requestData.method}:`, error);
			if (!abortedState.aborted()) {
				sendResponse(res, 500, {
					error: 'Internal Server Error',
					message: 'Failed to process request',
					timestamp: new Date().toISOString()
				});
			}
		}
	});
};