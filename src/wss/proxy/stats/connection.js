// Connection statistics
const getConnectionStats = (activeClient) => {
	return {
		total: activeClient ? 1 : 0,
		authenticated: activeClient ? 1 : 0,
		hasActiveConnection: !!activeClient
	};
};

const hasActiveConnection = (activeClient) => {
	return !!activeClient;
};

module.exports = {
	getConnectionStats,
	hasActiveConnection
};
