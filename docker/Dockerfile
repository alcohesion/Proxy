# Multi-service Dockerfile for Proxy Server
# Optimized for Docker Compose deployment
FROM node:22-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash

# Set working directory
WORKDIR /app

# Copy package files
COPY src/package*.json ./

# Install dependencies and rebuild native modules
RUN npm ci --only=production && \
    npm rebuild uWebSockets.js --update-binary && \
    npm cache clean --force

# Copy application source code
COPY src/ ./

# Create necessary directories
RUN mkdir -p /app/logs && \
    chmod -R 755 /app/logs

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -D -u 1001 -G nodejs nodejs

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "app.js"]
