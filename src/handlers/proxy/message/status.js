// Status query message handler
const status = require('../../../services/status');
const { tunnel } = require('../../../utils');

module.exports = async (ws, data, log, queries) => {
	// Initialize status service
	const statusService = status(queries, log);
	
	// Handle tunnel message format
	let queryType, queryData;
	
	if (data.message && data.message.payload && data.message.payload.kind === "Control") {
		// Extract from tunnel message format
		const controlData = data.message.payload.data;
		queryType = controlData.queryType;
		queryData = controlData.queryData || {};
		
		log.wss(`Status query received - Type: ${queryType}`);
	} else {
		// Fallback to legacy format
		queryType = data.queryType;
		queryData = data.queryData || {};
		
		log.wss(`Legacy status query received - Type: ${queryType}`);
	}

	try {
		let result;
		
		switch (queryType) {
			case 'request_status':
				const requestId = queryData.requestId;
				if (!requestId) {
					throw new Error('Missing requestId for request_status query');
				}
				result = await statusService.getRequestStatus(requestId);
				if (!result) {
					throw new Error('Request not found');
				}
				break;
				
			case 'requests_by_status':
				const statusFilter = queryData.status;
				const limit = queryData.limit || 100;
				if (!statusFilter) {
					throw new Error('Missing status for requests_by_status query');
				}
				const requests = await statusService.getRequestsByStatus(statusFilter, limit);
				result = {
					status: statusFilter,
					count: requests.length,
					requests
				};
				break;
				
			case 'status_stats':
				result = await statusService.getStatusStats();
				break;
				
			default:
				throw new Error(`Unknown status query type: ${queryType}`);
		}

		// Send success response using tunnel format
		const responseMessage = tunnel.createTunnelMessage("status_response", "Control", {
			type: "StatusQuery",
			queryType: queryType,
			success: true,
			data: result,
			timestamp: new Date().toISOString()
		});

		ws.send(JSON.stringify(responseMessage));
		log.wss(`Status query response sent - Type: ${queryType}`);

	} catch (error) {
		log.error(`Error processing status query ${queryType}:`, error);
		
		// Send error response using tunnel format
		const errorMessage = tunnel.createTunnelMessage("status_response", "Control", {
			type: "StatusQuery",
			queryType: queryType,
			success: false,
			error: error.message,
			timestamp: new Date().toISOString()
		});

		ws.send(JSON.stringify(errorMessage));
	}
};
