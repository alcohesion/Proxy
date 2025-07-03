const { Request } = require('../../../models');
const { crypto } = require('../../../utils');

// Create a new request
const create = async (data) => {
	try {
		// Ensure hex is generated if not provided
		if (!data.hex) {
			data.hex = crypto.request();
		}
		
		const newRequest = new Request(data);
		return await newRequest.save();
	} catch (error) {
		console.error('Error creating request:', error);
		throw error;
	}
};

module.exports = create;
