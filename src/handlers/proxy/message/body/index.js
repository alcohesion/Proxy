// Main body processor - determines which processor to use based on content type
const processors = require('./processors');

// Content type mapping to processors
const CONTENT_TYPE_MAP = {
	// JSON types
	'application/json': 'json',
	'text/json': 'json',
	'application/ld+json': 'json',
	
	// Text types
	'text/plain': 'text',
	'text/css': 'text',
	'text/csv': 'text',
	'text/javascript': 'text',
	
	// HTML types
	'text/html': 'html',
	'application/xhtml+xml': 'html',
	
	// XML types
	'application/xml': 'xml',
	'text/xml': 'xml',
	'application/soap+xml': 'xml',
	'application/rss+xml': 'xml',
	'application/atom+xml': 'xml',
	
	// Binary types
	'application/octet-stream': 'binary',
	'application/pdf': 'binary',
	'image/jpeg': 'binary',
	'image/png': 'binary',
	'image/gif': 'binary',
	'image/webp': 'binary',
	'audio/mpeg': 'binary',
	'video/mp4': 'binary',
	'application/zip': 'binary',
	'application/gzip': 'binary'
};

// Get content type from headers (case insensitive)
const getContentType = (headers = {}) => {
	const contentTypeKey = Object.keys(headers).find(key => 
		key.toLowerCase() === 'content-type'
	);
	
	if (!contentTypeKey) return null;
	
	const contentType = headers[contentTypeKey];
	if (!contentType) return null;
	
	// Extract main content type (remove charset, boundary, etc.)
	return contentType.toLowerCase().split(';')[0].trim();
};

// Determine processor type from content type
const getProcessorType = (contentType) => {
	if (!contentType) return 'text'; // Default to text
	
	// Check exact match first
	if (CONTENT_TYPE_MAP[contentType]) {
		return CONTENT_TYPE_MAP[contentType];
	}
	
	// Check partial matches
	if (contentType.includes('json')) return 'json';
	if (contentType.includes('html')) return 'html';
	if (contentType.includes('xml')) return 'xml';
	if (contentType.startsWith('text/')) return 'text';
	if (contentType.startsWith('image/')) return 'binary';
	if (contentType.startsWith('audio/')) return 'binary';
	if (contentType.startsWith('video/')) return 'binary';
	if (contentType.startsWith('application/')) {
		// Most application types are binary unless specified otherwise
		if (contentType.includes('text') || contentType.includes('javascript')) {
			return 'text';
		}
		return 'binary';
	}
	
	// Default to text for unknown types
	return 'text';
};

// Main body processing function
const processResponseBody = (body, headers = {}) => {
	// Handle null/undefined
	if (body === null || body === undefined) {
		return '';
	}
	
	// Get content type and determine processor
	const contentType = getContentType(headers);
	const processorType = getProcessorType(contentType);
	
	// Get the appropriate processor
	const processor = processors[processorType];
	if (!processor) {
		console.warn(`Unknown processor type: ${processorType}, falling back to text`);
		return processors.text(body, contentType);
	}
	
	// Process the body
	try {
		const result = processor(body, contentType);
		
		// For binary processors that return Buffers, convert to string for HTTP response
		if (Buffer.isBuffer(result)) {
			// For binary content, we might want to return base64 or keep as buffer
			// For now, convert to string for compatibility
			return result.toString('utf8');
		}
		
		return result;
	} catch (error) {
		console.warn(`Error processing body with ${processorType} processor:`, error);
		// Fallback to text processor
		return processors.text(body, contentType);
	}
};

module.exports = {
	processResponseBody,
	getContentType,
	getProcessorType,
	CONTENT_TYPE_MAP
};
