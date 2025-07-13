// Read version from package.json
const packageJson = require('../package.json');

const app = {
	host: process.env.HOST || '0.0.0.0',
	port: parseInt(process.env.PORT) || 8080,
	env: process.env.NODE_ENV || 'development',
	version: packageJson.version
};

const security = {
	authToken: process.env.AUTH_TOKEN || 'your-secret-token',
	allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
	hexKey: process.HEX_ENCRYPTION_KEY || 'default-hex-key',
};

module.exports = { app, security };
