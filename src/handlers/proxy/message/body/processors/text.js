// Text content processor
const processText = (body, contentType) => {
	// Handle byte arrays
	if (Array.isArray(body) && body.every(item => typeof item === 'number' && item >= 0 && item <= 255)) {
		try {
			return Buffer.from(body).toString('utf8');
		} catch (error) {
			console.warn('Failed to convert byte array to text:', error);
			return String.fromCharCode(...body);
		}
	}
	
	// Handle Buffer objects
	if (Buffer.isBuffer(body)) {
		return body.toString('utf8');
	}
	
	// If already a string, return as is
	if (typeof body === 'string') {
		return body;
	}
	
	// For objects, convert to string representation
	if (typeof body === 'object' && body !== null) {
		return String(body);
	}
	
	// Default case
	return String(body);
};

module.exports = processText;
