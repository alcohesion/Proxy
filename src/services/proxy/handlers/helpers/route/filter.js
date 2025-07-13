// Filter routes to skip only health endpoints - forward ALL other requests
const shouldSkipRoute = (url) => {
	return url.startsWith('/health');
};

module.exports = { shouldSkipRoute };
