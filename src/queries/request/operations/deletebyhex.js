const { Request } = require('../../../models');

// Delete request by hex
const deletebyhex = async (hex) => {
	try {
		return await Request.findOneAndDelete({ hex });
	} catch (error) {
		console.error('Error deleting request by hex:', error);
		throw error;
	}
};

module.exports = deletebyhex;
