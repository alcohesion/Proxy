const crypto = require('crypto');
const { security } = require('../../configs');

// Generate a unique hex identifier using environment key, timestamp, and prefix
const generateHex = (prefix = 'RQT') => {
	// Use hexKey as default env key for entropy
	const key = security.hexKey || 'default-key';
	
	// Get current timestamp in milliseconds
	const timestamp = Date.now().toString();
	
	// Add some random bytes for additional uniqueness
	const randomBytes = crypto.randomBytes(4).toString('hex');
	
	// Combine key + timestamp + random for hashing
	const combined = `${key}${timestamp}${randomBytes}`;
	
	// Create hash and truncate to 12 characters
	const hash = crypto.createHash('sha256')
		.update(combined)
		.digest('hex')
		.substring(0, 12)
		.toUpperCase();
	
	// Return with prefix
	return `${prefix.toUpperCase()}${hash}`;
};

/**
 * Generate hex for different document types
 */
const hex = {
	// Request documents
	request: () => generateHex('R0X'),
	
	// Device documents  
	device: () => generateHex('D0X'),
	
	// Metrics documents
	metrics: () => generateHex('M0X'),

	// Generic hex generator
	generate: generateHex
};

module.exports = hex;
