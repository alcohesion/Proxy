// Helper functions for creating tunnel messages

const createTunnelMessage = (messageType, payloadType, data, crypto, protocol, correlationId = null) => {
	const messageId = crypto.message();

	return {
		envelope: {
			tunnel_id: crypto.tunnel(),
			client_id: crypto.client(messageId)
		},
		message: {
			metadata: {
				id: messageId,
				message_type: messageType,
				version: protocol.version,
				timestamp: Date.now(),
				priority: protocol.priority.default,
				delivery_mode: protocol.deliveryMode.default,
				encoding: protocol.encoding.default,
				...(correlationId && { correlation_id: correlationId })
			},
			payload: {
				kind: payloadType,
				data: data
			}
		}
	};
};

const createHttpRequestMessage = (method, url, headers, body, requestId, crypto, protocol) => {
	return createTunnelMessage("http_request", "HTTP", {
		kind: "Request",
		method: method,
		url: url,
		headers: headers,
		body: body,
		requestId: requestId
	}, crypto, protocol);
};

const createHttpResponseMessage = (status, statusText, headers, body, requestId, correlationId, crypto, protocol) => {
	return createTunnelMessage("http_response", "HTTP", {
		kind: "Response",
		status: status,
		status_text: statusText,
		headers: headers,
		body: body,
		requestId: requestId
	}, crypto, protocol, correlationId);
};

const createAuthMessage = (status, message, crypto, protocol) => {
	return createTunnelMessage("auth", "Control", {
		kind: "Authentication",
		status: status,
		message: message,
		timestamp: new Date().toISOString()
	}, crypto, protocol);
};

const createErrorMessage = (error, code, crypto, protocol, requestId = null) => {
	return createTunnelMessage("error", "Control", {
		kind: "Error",
		error: error,
		code: code,
		...(requestId && { requestId: requestId }),
		timestamp: new Date().toISOString()
	}, crypto, protocol);
};

// Create tunnel message with custom metadata options
const createCustomTunnelMessage = (messageType, payloadType, data, crypto, protocol, options = {}) => {
	const messageId = crypto.message();
	const {
		correlationId = null,
		priority = protocol.priority.default,
		deliveryMode = protocol.deliveryMode.default,
		encoding = protocol.encoding.default
	} = options;
	
	return {
		envelope: {
			tunnel_id: crypto.tunnel(),
			client_id: crypto.client(messageId)
		},
		message: {
			metadata: {
				id: messageId,
				message_type: messageType,
				version: protocol.version,
				timestamp: Date.now(),
				priority: priority,
				delivery_mode: deliveryMode,
				encoding: encoding,
				...(correlationId && { correlation_id: correlationId })
			},
			payload: {
				kind: payloadType,
				data: data
			}
		}
	};
};

module.exports = {
	createTunnelMessage,
	createCustomTunnelMessage,
	createHttpRequestMessage,
	createHttpResponseMessage,
	createAuthMessage,
	createErrorMessage
};
