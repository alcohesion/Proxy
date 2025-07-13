module.exports = (ws, token, deps) => {
	const { tunnel, crypto, protocol } = deps;
	
	if (!token || token !== process.env.AUTH_TOKEN) {
		const errorMessage = tunnel.createErrorMessage('Authentication required', 'AUTH_REQUIRED', crypto, protocol);
		ws.send(JSON.stringify(errorMessage));
		ws.close();
		return false;
	}
	
	ws.authenticated = true;
	
	const authMessage = tunnel.createAuthMessage('authenticated', 'Connection established successfully', crypto, protocol);
	ws.send(JSON.stringify(authMessage));
	
	return true;
};
