module.exports = (Request, log) => {
	// Create a new request
	const create = async (data) => {
		try {
			return await Request.create(data);
		} catch (error) {
			log.error('Error creating request:', error);
			throw error;
		}
	};

	// Update operations for requests
	const updateByHex = async (hex, updateData) => {
		try {
			return await Request.findOneAndUpdate(
				{ hex },
				{ ...updateData, updatedAt: new Date() },
				{ new: true, runValidators: true }
			);
		} catch (error) {
			log.error('Error updating request by hex:', error);
			throw error;
		}
	};

	const updateStatus = async (hex, status, error = null) => {
		try {
			const updateData = {
				status,
				updatedAt: new Date()
			};

			if (error) {
				updateData.error = error;
			}

			return await Request.findOneAndUpdate(
				{ hex },
				updateData,
				{ new: true, runValidators: true }
			);
		} catch (error) {
			log.error('Error updating request status:', error);
			throw error;
		}
	};

	const updateResponse = async (hex, responseData) => {
		try {
			return await Request.findOneAndUpdate(
				{ hex },
				{
					'response.statusCode': responseData.statusCode,
					'response.headers': responseData.headers,
					'response.body': responseData.body,
					'response.duration': responseData.duration,
					'response.receivedAt': new Date(),
					status: 'responded',
					updatedAt: new Date()
				},
				{ new: true, runValidators: true }
			);
		} catch (error) {
			log.error('Error updating request response:', error);
			throw error;
		}
	};

	return { create, updateByHex, updateStatus, updateResponse };
};
