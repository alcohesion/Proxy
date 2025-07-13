// Process and forward request to local WebSocket client

const processRequest = async (body, request, proxyWs, sendResponse, res, aborted, deps) => {
	const { tunnel, crypto, protocol, log, queries } = deps;
	const { request: { crud: { updateStatus, updateByHex } } } = queries;
	
	const localClient = proxyWs.activeClient;
	if (localClient && localClient.authenticated) {
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

			localClient.send(JSON.stringify(tunnelMessage));

			// Update request status
			await updateStatus(request.hex, 'forwarded');
			await updateByHex(request.hex, { body: body || null });

			log.proxy(`Request forwarded successfully - Method: ${request.method}, Path: ${request.path}, RequestID: ${request.hex}`);
		} catch (error) {
			log.error('Error sending request to local client:', error);

			// Update status to unavailable and send error response
			await updateStatus(request.hex, 'unavailable', 'Failed to forward request to local client');
			proxyWs.removePendingRequest(request.hex);
			if (!aborted()) {
				sendResponse(res, 502, {
					error: 'Bad Gateway',
					message: 'Failed to forward request to local client',
					requestId: request.hex,
					timestamp: new Date().toISOString()
				});
			}
		}
	} else {
		// Local client not available
		await updateStatus(request.hex, 'unavailable', 'Local client not available');
		proxyWs.removePendingRequest(request.hex);
		if (!aborted()) {
			sendResponse(res, 502, {
				error: 'Bad Gateway',
				message: 'Local client not available',
				requestId: request.hex,
				timestamp: new Date().toISOString()
			});
		}
	}
};

module.exports = { processRequest };
