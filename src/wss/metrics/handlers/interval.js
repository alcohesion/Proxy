// Interval management for metrics WebSocket
const startMetricsInterval = (ws, metricsInstance) => {
	const intervalId = setInterval(async () => {
		if (ws.authenticated) {
			await metricsInstance.sendMetrics(ws);
			await metricsInstance.sendSystemStatus(ws);
		}
	}, ws.interval * 1000);
	
	return intervalId;
};

module.exports = startMetricsInterval;
