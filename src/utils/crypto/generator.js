const crypto = require('crypto');

/**
 * Generate a unique hex identifier using environment key, timestamp, and prefix
 * @param {string} prefix - The prefix for the hex (e.g., 'RQT', 'DEV', 'MET')
 * @param {string} envKey - Environment key for additional entropy (defaults to AUTH_TOKEN)
 * @returns {string} - Formatted hex string with prefix
 */
const generateHex = (prefix = 'RQT', envKey = null) => {
	// Use AUTH_TOKEN as default env key for entropy
	const key = envKey || process.env.AUTH_TOKEN || 'default-key';
	
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
	request: () => generateHex('RQT'),
	
	// Device documents  
	device: () => generateHex('DEV'),
	
	// Metrics documents
	metrics: () => generateHex('MET'),
	
	// Generic hex generator
	generate: generateHex
};

module.exports = hex;
