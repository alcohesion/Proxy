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

// Middleware to generate hex before validation (since validation happens before save)
device.pre('validate', function(next) {
	try {
		// Generate hex if not already set (for new documents)
		if (this.isNew && !this.hex) {
			this.hex = crypto.device();
		}
		next();
	} catch (error) {
		next(error);
	}
});

// Middleware to generate hex identifier before saving
device.pre('save', function(next) {
	try {
		// Generate hex if not already set (for new documents)
		if (this.isNew && !this.hex) {
			this.hex = crypto.device();
		}
		
		if (this.isModified() && !this.isNew) {
			this.updatedAt = new Date();
		}
		next();
	} catch (error) {
		next(error);
	}
});

device.pre('findOneAndUpdate', function(next) {
	try {
		// Generate hex if not already set (for updates)
		if (this._update && !this._update.hex) {
			this._update.hex = crypto.device();
		}	
		// Ensure updatedAt is set on updates
		this._update = this._update || {};
		this._update.updatedAt = new Date();
		next();
	} catch (error) {
		next(error);
	}
});

device.pre('updateOne', function(next) {
	try {
		// Generate hex if not already set (for updates)
		if (this._update && !this._update.hex) {
			this._update.hex = crypto.device();
		}
		// Ensure updatedAt is set on updates
		this._update = this._update || {};
		this._update.updatedAt = new Date();
		next();
	} catch (error) {
		next(error);
	}
});


// Index for performance
device.index({ ip: 1 });
device.index({ active: 1 });
device.index({ blocked: 1 });
device.index({ createdAt: -1 });

module.exports = device;
