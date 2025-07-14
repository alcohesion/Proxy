// Request management logic
const add = (pendingRequests, requestId, data) => {
	pendingRequests.set(requestId, data);
};

const remove = (pendingRequests, requestId) => {
	pendingRequests.delete(requestId);
};

const get = (pendingRequests, requestId) => {
	return pendingRequests.get(requestId);
};

const has = (pendingRequests, requestId) => {
  return pendingRequests.has(requestId);
};

module.exports = {
	add,
	remove,
	get,
	has
};
