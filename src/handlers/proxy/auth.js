const { tunnel } = require('../../utils');

module.exports = (ws, token) => {
	if (!token || token !== process.env.AUTH_TOKEN) {
		const errorMessage = tunnel.createErrorMessage('Authentication required', 'AUTH_REQUIRED');
		ws.send(JSON.stringify(errorMessage));
		ws.close();
		return false;
	}
	
	ws.authenticated = true;
	
	const authMessage = tunnel.createAuthMessage('authenticated', 'Connection established successfully');
	ws.send(JSON.stringify(authMessage));
	
	return true;
};
