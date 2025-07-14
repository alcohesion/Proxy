// Connection authentication logic
const validateToken = (token, log) => {
	if (!token || typeof token !== 'string') {
		return false;
	}
	
	const validToken = process.env.AUTH_TOKEN;
	if (!validToken) {
		log.error('AUTH_TOKEN environment variable not set');
		return false;
	}
	
	return token === validToken;
};

module.exports = {
	validateToken
};
