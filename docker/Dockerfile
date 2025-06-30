# Multi-service Dockerfile for Proxy Server
# Includes MongoDB, Redis, and Node.js app in a single container
FROM node:22

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies including MongoDB and Redis
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    wget \
    gnupg \
    lsb-release \
    software-properties-common \
    curl \
    supervisor \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Install MongoDB
RUN wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add - && \
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && \
    apt-get install -y mongodb-org && \
    rm -rf /var/lib/apt/lists/*

# Install Redis
RUN add-apt-repository ppa:redislabs/redis && \
    apt-get update && \
    apt-get install -y redis-server && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY src/package*.json ./

# Install dependencies and rebuild native modules
RUN npm ci --only=production && \
    npm install --build-from-source uWebSockets.js && \
    npm rebuild uWebSockets.js --update-binary && \
    npm cache clean --force

# Copy application source code
COPY src/ ./

# Create necessary directories for MongoDB and Redis
RUN mkdir -p /data/mongodb /data/redis /data/logs && \
    chown -R mongodb:mongodb /data/mongodb && \
    chown -R redis:redis /data/redis

# Copy supervisor configuration
COPY fly/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy startup script
COPY fly/startup.sh ./startup.sh
RUN chmod +x ./startup.sh

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start all services with supervisor
CMD ["./startup.sh"]
