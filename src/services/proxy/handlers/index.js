const { 
	getData, 
	getDevice, 
	sendResponse,
	shouldSkipRoute,
	readRequestBody,
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

		try {
			// Now we can safely do async operations
			const { device, request } = await getDevice(requestData, { device: createOrUpdate, request: createRequest }, log)

			// Validate connection and request state
			if(!await validateConnection(client, request, device, queries, sendResponse, res, abortedState.aborted, log)) return;

			// Store response object
			client.addPendingRequest(request.hex, { res, request, startTime: Date.now() });

			// Create the process function with bound parameters
			const boundProcessRequest = async (body = '') => {
				await processRequest(body, request, client, log, queries, sendResponse, res, abortedState.aborted);
			};

			// Handle request body reading
			readRequestBody(res, request, boundProcessRequest);

			// Set up abort and timeout handlers
			setupAbortHandler(res, client, request, queries, log);
			setupTimeoutHandler(client, request, queries, log, proxyConfig, sendResponse);

		} catch (error) {
			log.error('Error processing request:', error);
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