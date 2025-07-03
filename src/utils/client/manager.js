// Local client management utility
class ClientManager {
	constructor() {
		this.localClient = null;
		this.pendingRequests = new Map();
	}

	setLocalClient(client) {
		this.localClient = client;
	}

	getLocalClient() {
		return this.localClient;
	}

	clearLocalClient() {
		this.localClient = null;
	}

	isClientConnected() {
		return this.localClient && this.localClient.authenticated;
	}

	addPendingRequest(requestId, data) {
		this.pendingRequests.set(requestId, data);
	}

	removePendingRequest(requestId) {
		this.pendingRequests.delete(requestId);
	}

	getPendingRequest(requestId) {
		return this.pendingRequests.get(requestId);
	}

	hasPendingRequest(requestId) {
		return this.pendingRequests.has(requestId);
	}

	getPendingRequestsCount() {
		return this.pendingRequests.size;
	}
}

module.exports = ClientManager;
