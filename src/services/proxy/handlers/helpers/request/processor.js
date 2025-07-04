// Process and forward request to local WebSocket client
const processRequest = async (body, request, client, log, queries, sendResponse, res, aborted) => {
	const { request: { crud: { updateStatus, updateByHex } } } = queries;
	
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
			await updateStatus(request.hex, 'forwarded');
			await updateByHex(request.hex, { body: body || null });

			log.proxy(`Request forwarded successfully - Method: ${request.method}, Path: ${request.path}, RequestID: ${request.hex}`);
		} catch (error) {
			log.error('Error sending request to local client:', error);

			// Send error response
			client.removePendingRequest(request.hex);
			if (!aborted()) {
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
		if (!aborted()) {
			sendResponse(res, 502, {
				error: 'Service Unavailable',
				message: 'Local client not available',
				timestamp: new Date().toISOString()
			});
		}
	}
};

module.exports = { processRequest };
