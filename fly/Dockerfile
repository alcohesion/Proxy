# Multi-service Dockerfile for Proxy Server
# Includes MongoDB, Redis, Node.js app, and Nginx in a single container

FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
  wget \
  gnupg \
  lsb-release \
  software-properties-common \
  curl \
  build-essential \
  supervisor \
  nginx \
  && rm -rf /var/lib/apt/lists/*

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
  apt-get install -y nodejs && \
  rm -rf /var/lib/apt/lists/*

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

# Create application directory
WORKDIR /app

# Copy application files
COPY src/ ./

# Install dependencies
RUN npm ci --only=production

# Copy configuration files
COPY fly/nginx/nginx.conf /etc/nginx/nginx.conf
COPY fly/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy supervisor configuration
COPY fly/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create necessary directories
RUN mkdir -p /data/mongodb /data/redis /data/logs /var/log/nginx && \
    chmod -R 755 /data && \
    chown -R root:root /data

# Copy service initialization scripts
COPY fly/startup.sh ./startup.sh
COPY fly/init.sh ./init.sh
RUN chmod +x ./startup.sh ./init.sh

# Remove default nginx site
RUN rm -f /etc/nginx/sites-enabled/default

# Expose ports
EXPOSE 80 443 8080 27017 6379

# Set environment variables
ENV NODE_ENV=production
ENV PATH="/app/node_modules/.bin:$PATH"

# Default command - will be overridden by fly.toml processes
CMD ["./startup.sh"]