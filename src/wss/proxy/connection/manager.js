const auth = require('./auth');

module.exports = {
  upgrade: (res, req, context, deps) => {
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
  },

  open: (ws, deps, connections) => {
    const { tunnel, crypto, protocol, log } = deps;
    try {
      if (!auth.validateToken(ws.token, log)) {
        log.warn(`Authentication failed for connection - Invalid token`);
        const errorMessage = tunnel.createErrorMessage('Authentication required', 'AUTH_REQUIRED', crypto, protocol);
        ws.send(JSON.stringify(errorMessage));
        ws.close();
        return null;
      }

      // Check if another connection is already established
      if (connections.size > 0) {
        log.warn('Another client is already connected - rejecting new connection');
        const errorMessage = tunnel.createErrorMessage('Another client is already connected', 'CLIENT_ALREADY_CONNECTED', crypto, protocol);
        ws.send(JSON.stringify(errorMessage));
        ws.close();
        return null;
      }

      ws.connectionId = crypto.connection();
      ws.connectedAt = new Date().toISOString();
      ws.tunnelId = crypto.tunnel();
      ws.authenticated = true;

      const deviceHex = crypto.device();
      ws.device = {
        hex: deviceHex,
        ip: ws.ip,
        userAgent: ws.userAgent,
        connectedAt: ws.connectedAt,
        status: 'connected',
        tunnelId: ws.tunnelId
      };

      const authMessage = tunnel.createAuthMessage('authenticated', 'Connection established successfully', crypto, protocol);
      ws.send(JSON.stringify(authMessage));

      log.connect(`WebSocket connection accepted - ConnectionID: ${ws.connectionId}`);
      log.connect(`Device record created - DeviceHex: ${deviceHex}, TunnelID: ${ws.tunnelId}`);
      log.connect('Local client connected and registered for request forwarding');

      return ws;
    } catch (error) {
      log.error('Error in WebSocket open handler:', error);
      ws.close();
      return null;
    }
  },

  close: (ws, code, message) => {
    return ws.connectionId;
  }
};
