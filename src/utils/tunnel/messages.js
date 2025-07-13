// Helper functions for creating tunnel messages
const crypto = require('crypto');

const createTunnelMessage = (messageType, payloadType, data, correlationId = null) => {
	const messageId = `msg_${crypto.randomBytes(8).toString('hex')}`;
	
	return {
		envelope: {
			tunnel_id: `tunnel_${Date.now()}`,
			client_id: `client_${messageId}`
		},
		message: {
			metadata: {
				id: messageId,
				message_type: messageType,
				timestamp: Date.now(),
				...(correlationId && { correlation_id: correlationId })
			},
			payload: {
				type: payloadType,
				data: data
			}
		}
	};
};

const createHttpRequestMessage = (method, url, headers, body, requestId) => {
	return createTunnelMessage("http_request", "Http", {
		type: "Request",
		method: method,
		url: url,
		headers: headers,
		body: body,
		requestId: requestId
	});
};

const createHttpResponseMessage = (status, statusText, headers, body, requestId, correlationId) => {
	return createTunnelMessage("http_response", "Http", {
		type: "Response",
		status: status,
		status_text: statusText,
		headers: headers,
		body: body,
		requestId: requestId
	}, correlationId);
};

const createAuthMessage = (status, message) => {
	return createTunnelMessage("auth", "Control", {
		type: "Authentication",
		status: status,
		message: message,
		timestamp: new Date().toISOString()
	});
};

const createErrorMessage = (error, code, requestId = null) => {
	return createTunnelMessage("error", "Control", {
		type: "Error",
		error: error,
		code: code,
		...(requestId && { requestId: requestId }),
		timestamp: new Date().toISOString()
	});
};

module.exports = {
	createTunnelMessage,
	createHttpRequestMessage,
	createHttpResponseMessage,
	createAuthMessage,
	createErrorMessage
};
