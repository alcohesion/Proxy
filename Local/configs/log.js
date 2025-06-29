const fs = require('fs');
const path = require('path');

// Color codes for different log types
const colors = {
  local: '\x1b[32m',    // Green
  proxy: '\x1b[36m',    // Cyan
  server: '\x1b[36m',   // Cyan
  error: '\x1b[31m',    // Red
  warn: '\x1b[33m',     // Yellow
  reset: '\x1b[0m'      // Reset
};

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const logFile = path.join(logsDir, 'tunnel.log');
const errorFile = path.join(logsDir, 'error.log');

// Monitor server reference (set by main app)
let monitorServer = null;

function setMonitorServer(server) {
  monitorServer = server;
}

function log(kind, message) {
  const timestamp = new Date().toISOString();
  const color = colors[kind] || colors.reset;
  
  // Console output with colors
  console.log(`${color}${kind.charAt(0).toUpperCase() + kind.slice(1)}:${colors.reset} ${message}`);
  
  // File output without colors
  const logEntry = `[${timestamp}] ${kind.toUpperCase()}: ${message}\n`;
  
  // Write to main log file
  fs.appendFileSync(logFile, logEntry);
  
  // Write errors to separate error log
  if (kind === 'error') {
    fs.appendFileSync(errorFile, logEntry);
  }
  
  // Broadcast to web monitor if available
  if (monitorServer) {
    try {
      monitorServer.broadcastLog(kind, message);
    } catch (error) {
      // Ignore monitor errors to avoid infinite loops
    }
  }
}

module.exports = { log, setMonitorServer };
