#!/usr/bin/env node

// Simple log tester to verify logging is working
const log = require('../src/logging');

console.log('Testing logging system...');

// Test different log levels
log.info('Application starting up');
log.success('Successfully connected to database');
log.warn('This is a warning message');
log.error('This is an error message', new Error('Sample error'));
log.debug('Debug information', { key: 'value', number: 42 });

// Test different service logs
log.mongo('MongoDB connection established');
log.redis('Redis connection established');
log.wss('WebSocket server started');
log.proxy('Proxy forwarding request');
log.metrics('Metrics collected');
log.health('Health check passed');
log.worker('Worker process started');

console.log('Log test completed!');
