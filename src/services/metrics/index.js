// Metrics WebSocket handling moved to wss folder
// Only HTTP endpoints remain here (if any)

module.exports = (app, api) => {
	// No HTTP endpoints for metrics currently
	// All metrics functionality is through WebSocket in wss/metrics
};
