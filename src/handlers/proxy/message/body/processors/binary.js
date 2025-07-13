// Binary content processor
const processBinary = (body, contentType) => {
	// Handle byte arrays - return as Buffer for binary data
	if (Array.isArray(body) && body.every(item => typeof item === 'number' && item >= 0 && item <= 255)) {
		return Buffer.from(body);
	}
	
	// Handle Buffer objects - return as is
	if (Buffer.isBuffer(body)) {
		return body;
	}
	
	// If string, convert to Buffer
	if (typeof body === 'string') {
		return Buffer.from(body, 'utf8');
	}
	
	// For objects, stringify then convert to Buffer
	if (typeof body === 'object' && body !== null) {
		try {
			const jsonString = JSON.stringify(body);
			return Buffer.from(jsonString, 'utf8');
		} catch (error) {
			console.warn('Failed to stringify object for binary:', error);
			return Buffer.from(String(body), 'utf8');
		}
	}
	
	// Default case - convert to Buffer
	return Buffer.from(String(body), 'utf8');
};

module.exports = processBinary;
