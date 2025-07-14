// Handle request abort events
const setupAbortHandler = (res, proxy, request, queries, log) => {
	const { request: { crud: { updateStatus } } } = queries;
	
	// Check if response is still valid before setting up handler
	if (res.aborted) {
		log.warn(`Cannot setup abort handler - response already aborted for request: ${request.hex}`);
		return;
	}
	
	try {
		res.onAborted(async () => {
			proxy.request.remove(request.hex);
			if (request) {
				try {
					await updateStatus(request.hex, 'close', 'Request aborted');
				} catch (error) {
					log.error('Error updating aborted request:', error);
				}
			}
		});
	} catch (error) {
		log.warn(`Cannot setup abort handler for request ${request.hex}: ${error.message}`);
	}
};

module.exports = { setupAbortHandler };
