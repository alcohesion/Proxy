const request = require('./request');
const device = require('./device');
const metrics = require('./metrics');
const { Request, Metrics, Device } = require('../models');

module.exports = {
	request: request(Request),
	device: device(Device),
	metrics: metrics(Metrics)
};
