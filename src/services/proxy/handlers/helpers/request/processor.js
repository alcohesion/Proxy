// Process and forward request to local WebSocket client

const processRequest = async (body, request, proxy, sendResponse, res, aborted) => {
	const { tunnel, crypto, protocol, log, queries } = proxy.deps;
	const { request: { crud: { updateStatus, updateByHex } } } = queries;

	try {
		// Log message being sent to local WebSocket
		log.wss(`Sending to local WS client - Method: ${request.method}, Path: ${request.path}, RequestID: ${request.hex}`);

		// Create tunnel message using helper
		const tunnelMessage = tunnel.createHttpRequestMessage(
			request.method,
			request.url,
			request.headers,
			body || null,
			request.hex,
			crypto,
			protocol
		);

		if (!proxy.send(JSON.stringify(tunnelMessage))) {
			// Local client not available - send immediate response
			await updateStatus(request.hex, 'unavailable', 'Local client not available');
			proxy.request.remove(request.hex);
			if (!aborted()) {
				sendResponse(res, 502, {
					error: 'Bad Gateway',
					message: 'Local client not available',
					requestId: request.hex,
					timestamp: new Date().toISOString()
				});
			}
			return;
		}

		// Update request status
		await updateStatus(request.hex, 'forwarded');
		await updateByHex(request.hex, { body: body || null });

		log.proxy(`Request forwarded successfully - Method: ${request.method}, Path: ${request.path}, RequestID: ${request.hex}`);
	} catch (error) {
		log.error('Error sending request to local client:', error);

		// Update status to unavailable - don't send response, let timeout handler handle it
		await updateStatus(request.hex, 'unavailable', 'Failed to forward request to local client');
	}
};

module.exports = { processRequest };
