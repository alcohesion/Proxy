// Global metrics WebSocket instance for broadcasting
let metricsWebSocketInstance = null;

const setMetricsWebSocket = (instance) => {
	metricsWebSocketInstance = instance;
};

const broadcastToMetrics = (message) => {
	if (metricsWebSocketInstance) {
		metricsWebSocketInstance.broadcast(message);
	}
};

module.exports = {
	setMetricsWebSocket,
	broadcastToMetrics
};
