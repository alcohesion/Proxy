// Filter routes to skip health and metrics endpoints
const shouldSkipRoute = (url) => {
	return url.startsWith('/metrics') || 
		   url.startsWith('/health') || 
		   url.startsWith('/status');
};

module.exports = { shouldSkipRoute };
