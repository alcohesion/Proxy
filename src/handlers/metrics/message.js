const queries = require('../../queries');
const log = require('../../logging');
const statusService = require('../../services/status')(queries, log);

// Message handler for metrics WebSocket
const handleMessage = async (ws, message, isBinary, metricsInstance) => {
	if (!ws.authenticated) {
		return;
	}
	
	try {
		const data = JSON.parse(Buffer.from(message).toString('utf-8'));
		
		switch (data.type) {
			case 'get_metrics':
				await metricsInstance.sendMetrics(ws);
				break;
			case 'get_devices':
				await metricsInstance.sendDevices(ws, data.limit || 50);
				break;
			case 'get_recent_requests':
				await metricsInstance.sendRecentRequests(ws, data.limit || 50);
				break;
			case 'get_system':
				await metricsInstance.sendSystemStatus(ws);
				break;
			case 'get_status_stats':
				await sendStatusStats(ws);
				break;
			case 'get_requests_by_status':
				await sendRequestsByStatus(ws, data.status, data.limit || 100);
				break;
			case 'get_request_status':
				await sendRequestStatus(ws, data.requestId);
				break;
			default:
				ws.send(JSON.stringify({
					type: 'error',
					message: 'Unknown message type',
					code: 'UNKNOWN_TYPE'
				}));
		}
		
	} catch (error) {
		log.error('Error processing metrics message:', error);
		ws.send(JSON.stringify({
			type: 'error',
			message: 'Invalid message format',
			code: 'INVALID_JSON'
		}));
	}
};

// Send status statistics
const sendStatusStats = async (ws) => {
	try {
		const stats = await statusService.getStatusStats();
		
		ws.send(JSON.stringify({
			type: 'status_stats',
			timestamp: new Date().toISOString(),
			data: stats
		}));
	} catch (error) {
		log.error('Error sending status stats:', error);
		ws.send(JSON.stringify({
			type: 'error',
			message: 'Failed to get status statistics',
			code: 'STATUS_STATS_ERROR'
		}));
	}
};

// Send requests by status
const sendRequestsByStatus = async (ws, status, limit) => {
	try {
		if (!status) {
			ws.send(JSON.stringify({
				type: 'error',
				message: 'Status parameter required',
				code: 'MISSING_STATUS'
			}));
			return;
		}

		const requests = await statusService.getRequestsByStatus(status, limit);
		
		ws.send(JSON.stringify({
			type: 'requests_by_status',
			timestamp: new Date().toISOString(),
			data: {
				status,
				count: requests.length,
				requests
			}
		}));
	} catch (error) {
		log.error('Error sending requests by status:', error);
		ws.send(JSON.stringify({
			type: 'error',
			message: 'Failed to get requests by status',
			code: 'REQUESTS_BY_STATUS_ERROR'
		}));
	}
};

// Send individual request status
const sendRequestStatus = async (ws, requestId) => {
	try {
		if (!requestId) {
			ws.send(JSON.stringify({
				type: 'error',
				message: 'RequestId parameter required',
				code: 'MISSING_REQUEST_ID'
			}));
			return;
		}

		const requestStatus = await statusService.getRequestStatus(requestId);
		
		if (!requestStatus) {
			ws.send(JSON.stringify({
				type: 'error',
				message: 'Request not found',
				code: 'REQUEST_NOT_FOUND'
			}));
			return;
		}
		
		ws.send(JSON.stringify({
			type: 'request_status',
			timestamp: new Date().toISOString(),
			data: requestStatus
		}));
	} catch (error) {
		log.error('Error sending request status:', error);
		ws.send(JSON.stringify({
			type: 'error',
			message: 'Failed to get request status',
			code: 'REQUEST_STATUS_ERROR'
		}));
	}
};

module.exports = handleMessage;
