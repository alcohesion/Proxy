// Authentication handler for metrics WebSocket
const authenticate = (ws, token) => {
	if (!token || token !== process.env.AUTH_TOKEN) {
		ws.send(JSON.stringify({
			type: 'error',
			message: 'Authentication required',
			code: 'AUTH_REQUIRED'
		}));
		ws.close();
		return false;
	}
	
	ws.authenticated = true;
	ws.id = Date.now() + Math.random();
	
	ws.send(JSON.stringify({
		type: 'auth',
		status: 'authenticated',
		timestamp: new Date().toISOString()
	}));
	
	return true;
};

module.exports = authenticate;
