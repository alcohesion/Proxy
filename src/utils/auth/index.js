// Simple token validation utility
const validateToken = (token) => {
	if (!token || typeof token !== 'string') {
		return false;
	}
	
	// Check against environment variable
	const validToken = process.env.AUTH_TOKEN;
	if (!validToken) {
		console.error('AUTH_TOKEN environment variable not set');
		return false;
	}
	
	return token === validToken;
};

module.exports = {
	validateToken
};
