// WebSocket event handlers
const drain = (ws, deps) => {
	const { log } = deps;
	log.proxy('WebSocket backpressure: ' + ws.getBufferedAmount());
};

module.exports = {
	drain
};
