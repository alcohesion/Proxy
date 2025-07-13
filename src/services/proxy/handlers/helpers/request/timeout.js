// Handle request timeout events
const setupTimeoutHandler = (client, request, queries, log, proxyConfig, sendResponse) => {
	const { request: { crud: { updateStatus } } } = queries;
	
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
				await updateStatus(req.hex, 'close', 'Gateway Timeout');
				log.proxy(`Request timeout - RequestID: ${req.hex}, Duration: ${proxyConfig.timeout}ms`);
			} catch (error) {
				log.error('Error updating timeout request:', error);
			}
			
			// NOTE: Do NOT clear client connection on timeout
			// The WebSocket may still be connected, just the local server didn't respond
		}
	}, proxyConfig.timeout);
};

module.exports = { setupTimeoutHandler };
