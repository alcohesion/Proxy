const mongoose = require('mongoose');
const { crypto } = require('../utils');

// description This schema represents device information for requests
const device = new mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
	hex: { type: String, required: true, unique: true },
	ip: { type: String, required: true },
	userAgent: { type: String, default: null },
	fingerprint: { type: String, default: null },
	location: {
		country: { type: String, default: null },
		region: { type: String, default: null },
		city: { type: String, default: null },
		timezone: { type: String, default: null }
	},
	connection: {
		type: { type: String, default: null },
		protocol: { type: String, default: null },
		secure: { type: Boolean, default: false }
	},
	stats: {
		totalRequests: { type: Number, default: 0 },
		successfulRequests: { type: Number, default: 0 },
		failedRequests: { type: Number, default: 0 },
		lastRequestAt: { type: Date, default: null }
	},
	active: { type: Boolean, default: true },
	blocked: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

// Middleware to update the `updatedAt` timestamp on modification
device.pre('save', function(next) {
	// Generate hex if not already set (for new documents)
	if (this.isNew && !this.hex) {
		this.hex = crypto.device();
	}
	
	if (this.isModified() && !this.isNew) {
		this.updatedAt = new Date();
	}
	next();
});

device.pre('findOneAndUpdate', function() {
	this.set({ updatedAt: new Date() });
});

// Index for performance
device.index({ ip: 1 });
device.index({ active: 1 });
device.index({ blocked: 1 });
device.index({ createdAt: -1 });

module.exports = device;
