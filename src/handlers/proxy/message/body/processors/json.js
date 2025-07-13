// JSON content processor
const processJson = (body, contentType) => {
	// Handle byte arrays - try to parse as JSON
	if (Array.isArray(body) && body.every(item => typeof item === 'number' && item >= 0 && item <= 255)) {
		try {
			const text = Buffer.from(body).toString('utf8');
			// Try to parse as JSON, if it fails return as string
			try {
				JSON.parse(text);
				return text; // Valid JSON string
			} catch (parseError) {
				return text; // Return as text if not valid JSON
			}
		} catch (error) {
			console.warn('Failed to convert byte array to JSON:', error);
			return String.fromCharCode(...body);
		}
	}
	
	// Handle Buffer objects
	if (Buffer.isBuffer(body)) {
		const text = body.toString('utf8');
		try {
			JSON.parse(text);
			return text; // Valid JSON string
		} catch (parseError) {
			return text; // Return as text if not valid JSON
		}
	}
	
	// If already a string, validate and return
	if (typeof body === 'string') {
		try {
			JSON.parse(body);
			return body; // Valid JSON string
		} catch (parseError) {
			// Not valid JSON, but return as is since content-type says JSON
			return body;
		}
	}
	
	// For objects, stringify them
	if (typeof body === 'object' && body !== null) {
		try {
			return JSON.stringify(body);
		} catch (error) {
			console.warn('Failed to stringify object to JSON:', error);
			return String(body);
		}
	}
	
	// For other types, try to create JSON
	try {
		return JSON.stringify(body);
	} catch (error) {
		console.warn('Failed to convert to JSON:', error);
		return String(body);
	}
};

module.exports = processJson;
