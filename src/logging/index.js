// ANSI color codes for different log kinds
const colors = {
    info: '\x1b[34m',      // blue
    debug: '\x1b[90m',     // gray
    redis: '\x1b[31m',     // red
    mongo: '\x1b[32m',     // green
    wss: '\x1b[35m',       // magenta
    request: '\x1b[36m',   // cyan
    queue: '\x1b[33m',     // yellow
    error: '\x1b[1m\x1b[31m',  // bold red
    warn: '\x1b[1m\x1b[33m',   // bold yellow
    success: '\x1b[1m\x1b[32m', // bold green
    proxy: '\x1b[94m',     // bright blue
    metrics: '\x1b[95m',   // bright magenta
    health: '\x1b[92m',    // bright green
    worker: '\x1b[93m',    // bright yellow
    connect: '\x1b[96m',   // bright cyan
    disconnect: '\x1b[91m' // bright red
};

const reset = '\x1b[0m';
const gray = '\x1b[90m';

// Default color for unknown kinds
const defaultColor = '';

// Check if we should use JSON logging (for production/fly.io)
const useJsonLogging = process.env.NODE_ENV === 'production' || process.env.FORCE_CONSOLE_OUTPUT === 'true';

/**
 * Format timestamp in readable format
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Get color code for a specific kind
 * @param {string} kind - The log kind
 * @returns {string} ANSI color code
 */
function getColor(kind) {
    return colors[kind.toLowerCase()] || defaultColor;
}

/**
 * Format log message with timestamp, kind, and color
 * @param {string} kind - The log kind
 * @param {*} message - The message to log
 * @param {*} additionalData - Additional data to log
 * @returns {string} Formatted log message
 */
function formatMessage(kind, message, additionalData = null) {
    const timestamp = new Date().toISOString();
    
    // For production/fly.io, use JSON format
    if (useJsonLogging) {
        const logEntry = {
            timestamp,
            level: kind.toUpperCase(),
            message: String(message),
            service: 'proxy-server'
        };
        
        if (additionalData !== null) {
            if (additionalData instanceof Error) {
                logEntry.error = {
                    message: additionalData.message,
                    stack: additionalData.stack,
                    name: additionalData.name
                };
            } else if (typeof additionalData === 'object') {
                logEntry.data = additionalData;
            } else {
                logEntry.additional = String(additionalData);
            }
        }
        
        return JSON.stringify(logEntry);
    }
    
    // For development, use colored format
    const timestampFormatted = `${gray}[${timestamp.replace('T', ' ').slice(0, 19)}]${reset}`;
    const kindColor = getColor(kind);
    const kindLabel = `${kindColor}${kind.toUpperCase()}:${reset}`;
    
    let formattedMessage = `${timestampFormatted} ${kindLabel} ${message}`;
    
    if (additionalData !== null) {
        if (additionalData instanceof Error) {
            formattedMessage += '\n' + colors.error + (additionalData.stack || additionalData.message) + reset;
        } else if (typeof additionalData === 'object') {
            formattedMessage += '\n' + gray + JSON.stringify(additionalData, null, 2) + reset;
        } else {
            formattedMessage += ` ${additionalData}`;
        }
    }
    
    return formattedMessage;
}

/**
 * Main logging function
 * @param {string} kind - The log kind (defaults to 'info')
 * @param {*} message - The message to log
 * @param {*} additionalData - Additional data to log
 */
function log(kind = 'info', message, additionalData = null) {
    // If only one parameter is provided, treat it as message with 'info' kind
    if (arguments.length === 1) {
        message = kind;
        kind = 'info';
    }
    
    const formattedMessage = formatMessage(kind, message, additionalData);
    console.log(formattedMessage);
}

/**
 * Convenience methods for common log types
 */
log.info = (message, data) => log('info', message, data);
log.debug = (message, data) => log('debug', message, data);
log.redis = (message, data) => log('redis', message, data);
log.mongo = (message, data) => log('mongo', message, data);
log.wss = (message, data) => log('wss', message, data);
log.request = (message, data) => log('request', message, data);
log.queue = (message, data) => log('queue', message, data);
log.error = (message, data) => log('error', message, data);
log.warn = (message, data) => log('warn', message, data);
log.success = (message, data) => log('success', message, data);
log.proxy = (message, data) => log('proxy', message, data);
log.metrics = (message, data) => log('metrics', message, data);
log.health = (message, data) => log('health', message, data);
log.worker = (message, data) => log('worker', message, data);
log.connect = (message, data) => log('connect', message, data);
log.disconnect = (message, data) => log('disconnect', message, data);

/**
 * Override console methods to use our logger
 */
log.overrideConsole = () => {
    console.log = (...args) => log('info', args.join(' '));
    console.info = (...args) => log('info', args.join(' '));
    console.warn = (...args) => log('warn', args.join(' '));
    console.error = (...args) => log('error', args.join(' '));
    console.debug = (...args) => log('debug', args.join(' '));
};

/**
 * Restore original console methods
 */
log.restoreConsole = (() => {
    const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };
    
    return () => {
        Object.assign(console, originalConsole);
    };
})();

module.exports = log;
