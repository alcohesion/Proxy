const { Request } = require('../../../models');

// Create a new request
const create = async (data) => {
	try {
		const newRequest = new Request(data);
		return await newRequest.save();
	} catch (error) {
		console.error('Error creating request:', error);
		throw error;
	}
};

module.exports = create;
