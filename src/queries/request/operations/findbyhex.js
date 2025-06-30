const { Request } = require('../../../models');

// Find request by hex
const findbyhex = async (hex) => {
	try {
		return await Request.findOne({ hex });
	} catch (error) {
		console.error('Error finding request by hex:', error);
		throw error;
	}
};

module.exports = findbyhex;
