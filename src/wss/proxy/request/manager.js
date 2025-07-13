// Request management logic
const manager = {
	add: (pendingRequests, requestId, data) => {
		pendingRequests.set(requestId, data);
	},
	
	remove: (pendingRequests, requestId) => {
		pendingRequests.delete(requestId);
	},
	
	get: (pendingRequests, requestId) => {
		return pendingRequests.get(requestId);
	}
};

module.exports = {
	manager
};
