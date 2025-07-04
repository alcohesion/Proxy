module.exports = (ws, token) => {
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
	
	ws.send(JSON.stringify({
		type: 'auth',
		status: 'authenticated',
		timestamp: new Date().toISOString()
	}));
	
	return true;
};
