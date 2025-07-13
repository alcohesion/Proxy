// Connection management logic

const handleUpgrade = (res, req, context, deps) => {
	const { log } = deps;
	try {
		const token = req.getQuery('token');
		const userAgent = req.getHeader('user-agent');
		const ip = req.getHeader('x-forwarded-for') || req.getHeader('x-real-ip') || 'unknown';
		
		res.upgrade(
			{ 
				token: token,
				userAgent: userAgent,
				ip: ip,
				authenticated: false
			},
			req.getHeader('sec-websocket-key'),
			req.getHeader('sec-websocket-protocol'),
			req.getHeader('sec-websocket-extensions'),
			context
		);
	} catch (error) {
		log.error('Proxy WebSocket upgrade error:', error);
		res.writeStatus('400 Bad Request').end('WebSocket upgrade failed');
	}
};

const handleOpen = (ws, proxyInstance, auth, deps) => {
	const { tunnel, crypto, protocol, log } = deps;
	try {
		if (!auth.validateToken(ws.token, deps)) {
			log.warn(`Authentication failed for connection - Invalid token`);
			const errorMessage = tunnel.createErrorMessage('Authentication required', 'AUTH_REQUIRED', crypto, protocol);
			ws.send(JSON.stringify(errorMessage));
			ws.close();
			return false;
		}
		
		ws.authenticated = true;
		
		if (proxyInstance.activeClient) {
			log.warn('Another client is already connected - rejecting new connection');
			const errorMessage = tunnel.createErrorMessage('Another client is already connected', 'CLIENT_ALREADY_CONNECTED', crypto, protocol);
			ws.send(JSON.stringify(errorMessage));
			ws.close();
			return false;
		}
		
		ws.connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		ws.connectedAt = new Date().toISOString();
		ws.proxyInstance = proxyInstance;
		ws.tunnelId = crypto.tunnel();
		
		const deviceHex = crypto.device();
		ws.device = {
			hex: deviceHex,
			ip: ws.ip,
			userAgent: ws.userAgent,
			connectedAt: ws.connectedAt,
			status: 'connected',
			tunnelId: ws.tunnelId
		};
		
		proxyInstance.activeClient = ws;
		
		const authMessage = tunnel.createAuthMessage('authenticated', 'Connection established successfully', crypto, protocol);
		ws.send(JSON.stringify(authMessage));
		
		log.connect(`WebSocket connection accepted - ConnectionID: ${ws.connectionId}`);
		log.connect(`Device record created - DeviceHex: ${deviceHex}, TunnelID: ${ws.tunnelId}`);
		log.connect('Local client connected and registered for request forwarding');
		
		return true;
	} catch (error) {
		log.error('Error in WebSocket open handler:', error);
		ws.close();
		return false;
	}
};

const handleClose = (ws, proxyInstance, deps) => {
	const { log } = deps;
	log.disconnect(`WebSocket connection closed - ConnectionID: ${ws.connectionId}`);
	
	if (proxyInstance.activeClient === ws) {
		proxyInstance.activeClient = null;
		log.disconnect('Local client disconnected');
	}
};

module.exports = {
	handleUpgrade,
	handleOpen,
	handleClose
};
