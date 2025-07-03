const { Device } = require('../models');
const { crypto } = require('../utils');

const device = {
	// Create a new device
	create: async (data) => {
		try {
			const newDevice = new Device(data);
			return await newDevice.save();
		} catch (error) {
			console.error('Error creating device:', error);
			throw error;
		}
	},

	// Find device by hex
	findByHex: async (hex) => {
		try {
			return await Device.findOne({ hex });
		} catch (error) {
			console.error('Error finding device by hex:', error);
			throw error;
		}
	},

	// Find device by fingerprint
	findByFingerprint: async (fingerprint) => {
		try {
			return await Device.findOne({ fingerprint });
		} catch (error) {
			console.error('Error finding device by fingerprint:', error);
			throw error;
		}
	},

	// Find device by IP
	findByIp: async (ip) => {
		try {
			return await Device.find({ ip }).sort({ createdAt: -1 });
		} catch (error) {
			console.error('Error finding devices by IP:', error);
			throw error;
		}
	},

	// Find or create device
	findOrCreate: async (deviceInfo) => {
		try {
			let device = await Device.findOne({ fingerprint: deviceInfo.fingerprint });
			
			if (!device) {
				device = new Device({
					hex: crypto.generate('RQT'),
					...deviceInfo,
					stats: {
						totalRequests: 1,
						successfulRequests: 0,
						failedRequests: 0,
						lastRequestAt: new Date()
					}
				});
				await device.save();
			} else {
				// Update existing device stats
				device.stats.totalRequests += 1;
				device.stats.lastRequestAt = new Date();
				device.updatedAt = new Date();
				await device.save();
			}
			
			return device;
		} catch (error) {
			console.error('Error finding or creating device:', error);
			throw error;
		}
	},

	// Update device by hex
	updateByHex: async (hex, updateData) => {
		try {
			return await Device.findOneAndUpdate(
				{ hex },
				{ ...updateData, updatedAt: new Date() },
				{ new: true, runValidators: true }
			);
		} catch (error) {
			console.error('Error updating device by hex:', error);
			throw error;
		}
	},

	// Update device stats
	updateStats: async (hex, statsUpdate) => {
		try {
			return await Device.findOneAndUpdate(
				{ hex },
				{
					$inc: statsUpdate,
					$set: {
						'stats.lastRequestAt': new Date(),
						updatedAt: new Date()
					}
				},
				{ new: true }
			);
		} catch (error) {
			console.error('Error updating device stats:', error);
			throw error;
		}
	},

	// Increment successful requests
	incrementSuccess: async (hex) => {
		try {
			return await device.updateStats(hex, {
				'stats.successfulRequests': 1
			});
		} catch (error) {
			console.error('Error incrementing successful requests:', error);
			throw error;
		}
	},

	// Increment failed requests
	incrementFailed: async (hex) => {
		try {
			return await device.updateStats(hex, {
				'stats.failedRequests': 1
			});
		} catch (error) {
			console.error('Error incrementing failed requests:', error);
			throw error;
		}
	},

	// Find active devices
	findActive: async (limit = 50) => {
		try {
			return await Device.find({ active: true })
				.sort({ 'stats.lastRequestAt': -1 })
				.limit(limit);
		} catch (error) {
			console.error('Error finding active devices:', error);
			throw error;
		}
	},

	// Find blocked devices
	findBlocked: async (limit = 50) => {
		try {
			return await Device.find({ blocked: true })
				.sort({ updatedAt: -1 })
				.limit(limit);
		} catch (error) {
			console.error('Error finding blocked devices:', error);
			throw error;
		}
	},

	// Block device
	blockDevice: async (hex) => {
		try {
			return await Device.findOneAndUpdate(
				{ hex },
				{ blocked: true, updatedAt: new Date() },
				{ new: true }
			);
		} catch (error) {
			console.error('Error blocking device:', error);
			throw error;
		}
	},

	// Unblock device
	unblockDevice: async (hex) => {
		try {
			return await Device.findOneAndUpdate(
				{ hex },
				{ blocked: false, updatedAt: new Date() },
				{ new: true }
			);
		} catch (error) {
			console.error('Error unblocking device:', error);
			throw error;
		}
	},

	// Deactivate device
	deactivateDevice: async (hex) => {
		try {
			return await Device.findOneAndUpdate(
				{ hex },
				{ active: false, updatedAt: new Date() },
				{ new: true }
			);
		} catch (error) {
			console.error('Error deactivating device:', error);
			throw error;
		}
	},

	// Count devices by status
	countByStatus: async (active = true) => {
		try {
			return await Device.countDocuments({ active });
		} catch (error) {
			console.error('Error counting devices by status:', error);
			throw error;
		}
	},

	// Count total devices
	countTotal: async () => {
		try {
			return await Device.countDocuments();
		} catch (error) {
			console.error('Error counting total devices:', error);
			throw error;
		}
	},

	// Find devices by location
	findByLocation: async (country, limit = 50) => {
		try {
			return await Device.find({ 'location.country': country })
				.sort({ createdAt: -1 })
				.limit(limit);
		} catch (error) {
			console.error('Error finding devices by location:', error);
			throw error;
		}
	},

	// Find recent devices
	findRecent: async (limit = 50) => {
		try {
			return await Device.find()
				.sort({ createdAt: -1 })
				.limit(limit);
		} catch (error) {
			console.error('Error finding recent devices:', error);
			throw error;
		}
	},

	// Count devices with query
	count: async (query = {}) => {
		try {
			return await Device.countDocuments(query);
		} catch (error) {
			console.error('Error counting devices:', error);
			throw error;
		}
	},

	// Find many devices with options
	findMany: async (query = {}, options = {}) => {
		try {
			let mongoQuery = Device.find(query);
			
			if (options.sort) {
				mongoQuery = mongoQuery.sort(options.sort);
			}
			
			if (options.limit) {
				mongoQuery = mongoQuery.limit(options.limit);
			}
			
			if (options.skip) {
				mongoQuery = mongoQuery.skip(options.skip);
			}
			
			return await mongoQuery.exec();
		} catch (error) {
			console.error('Error finding many devices:', error);
			throw error;
		}
	},

	// Create or update device (simplified)
	createOrUpdate: async (deviceInfo) => {
		try {
			const fingerprint = Buffer.from(`${deviceInfo.ip}${deviceInfo.userAgent}`).toString('base64');
			
			let device = await Device.findOne({ fingerprint });
			
			if (!device) {
				device = new Device({
					fingerprint,
					userAgent: deviceInfo.userAgent,
					ip: deviceInfo.ip,
					requestCount: 1,
					lastActive: new Date()
				});
			} else {
				device.requestCount = (device.requestCount || 0) + 1;
				device.lastActive = new Date();
			}
			
			return await device.save();
		} catch (error) {
			console.error('Error creating/updating device:', error);
			throw error;
		}
	},

	// Delete device by hex
	deleteByHex: async (hex) => {
		try {
			return await Device.findOneAndDelete({ hex });
		} catch (error) {
			console.error('Error deleting device by hex:', error);
			throw error;
		}
	},

	// Cleanup inactive devices
	cleanupInactive: async (daysInactive = 90) => {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
			
			return await Device.deleteMany({
				'stats.lastRequestAt': { $lt: cutoffDate },
				active: false
			});
		} catch (error) {
			console.error('Error cleaning up inactive devices:', error);
			throw error;
		}
	}
};

module.exports = device;
