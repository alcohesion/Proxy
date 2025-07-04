// Validate connection and request state
const validateConnection = async (client, request, device, queries, sendResponse, res, aborted, log) => {
	const { request: { crud: { updateStatus } } } = queries;

	if (!client.isClientConnected()) {
		if (!aborted()) {
			sendResponse(res, 502, {
				error: 'Service Unavailable',
				message: 'Local development server is not connected',
				timestamp: new Date().toISOString()
			});
		}

		if (request) {
			await updateStatus(request.hex, 'error', 'Local client not connected');
		}
		return false;
	}

	if (!request || !device) {
		if (!aborted()) {
			sendResponse(res, 500, {
				error: 'Internal Server Error',
				message: 'Failed to create request record',
				timestamp: new Date().toISOString()
			});
		}
		return false;
	}

	return true;
};

module.exports = { validateConnection };
