// Handle request abort events
const setupAbortHandler = (res, client, request, queries, log) => {
	const { request: { crud: { updateStatus } } } = queries;
	
	res.onAborted(async () => {
		client.removePendingRequest(request.hex);
		if (request) {
			try {
				await updateStatus(request.hex, 'error', 'Request aborted');
			} catch (error) {
				log.error('Error updating aborted request:', error);
			}
		}
	});
};

module.exports = { setupAbortHandler };
