# Installation Guide

## System Requirements

- Node.js 18.0 or higher
- MongoDB 4.4 or higher
- Redis 6.0 or higher (optional, for queue processing)
- Docker 20.10 or higher (for containerized deployment)
- 2GB RAM minimum, 4GB recommended
- 1GB disk space for application and logs

## Docker Deployment (Recommended)

### Development Environment

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Tunnel
   ```

2. Set up the development environment:
   ```bash
   cd docker
   make setup-env
   ```

3. Start the development stack:
   ```bash
   make start
   make dev-logs
   ```

4. Access the application:
   - HTTP: http://localhost
   - WebSocket: ws://localhost

### Production Environment

1. Configure environment variables in `docker/prod/.env`

2. Set up SSL certificates via GitHub secrets:
   - SSL_CERT
   - SSL_KEY  
   - SSL_CA_BUNDLE

3. Deploy via GitHub Actions workflow

4. Start production stack:
   ```bash
   make prod-start
   make prod-logs
   ```

5. Access the application:
   - HTTPS: https://yourdomain.com
   - WebSocket: wss://yourdomain.com

## Manual Installation

### Prerequisites Installation

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Redis
sudo apt-get install -y redis-server

# Start services
sudo systemctl start mongod
sudo systemctl start redis-server
sudo systemctl enable mongod
sudo systemctl enable redis-server
```

#### CentOS/RHEL
```bash
# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install MongoDB
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo << EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

sudo yum install -y mongodb-org redis

# Start services
sudo systemctl start mongod
sudo systemctl start redis
sudo systemctl enable mongod
sudo systemctl enable redis
```

### Application Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Tunnel/src
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```env
   NODE_ENV=production
   PORT=8080
   AUTH_TOKEN=your-secure-authentication-token-here
   
   MONGODB_URI=mongodb://localhost:27017/proxy
   REDIS_URL=redis://localhost:6379
   
   TARGET_HOST=localhost
   TARGET_PORT=3000
   TARGET_PROTOCOL=http
   
   HEX_ENCRYPTION_KEY=your-32-character-hex-encryption-key
   ```

5. Start the application:
   ```bash
   npm start
   ```

## Configuration Verification

### Database Connection Test
```bash
# Test MongoDB connection
mongosh --eval "db.adminCommand('ismaster')"

# Test Redis connection
redis-cli ping
```

### Application Health Check
```bash
# Test HTTP endpoint
curl http://localhost:8080/health

# Test WebSocket endpoint (using wscat)
npm install -g wscat
wscat -c ws://localhost:8080?token=your-auth-token
```

## Service Management

### SystemD Service (Linux)

Create service file at `/etc/systemd/system/tunnel-proxy.service`:

```ini
[Unit]
Description=Tunnel Proxy Server
After=network.target mongod.service redis.service

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/tunnel/src
Environment=NODE_ENV=production
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable tunnel-proxy
sudo systemctl start tunnel-proxy
sudo systemctl status tunnel-proxy
```

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start app.js --name tunnel-proxy

# Enable startup script
pm2 startup
pm2 save

# Monitor logs
pm2 logs tunnel-proxy
```

## Security Considerations

### Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow custom port if needed
sudo ufw allow 8080

# Enable firewall
sudo ufw enable
```

### SSL Certificate Setup

For production deployments, configure SSL certificates:

1. Obtain certificates from a trusted CA
2. Place certificates in secure location
3. Configure environment variables:
   ```env
   SSL_CERT_PATH=/path/to/certificate.crt
   SSL_KEY_PATH=/path/to/private.key
   SSL_CA_PATH=/path/to/ca-bundle.crt
   ```

### Database Security

```bash
# Enable MongoDB authentication
mongo admin --eval "
  db.createUser({
    user: 'admin',
    pwd: 'secure-password',
    roles: ['userAdminAnyDatabase', 'dbAdminAnyDatabase', 'readWriteAnyDatabase']
  })
"

# Enable authentication in MongoDB config
sudo sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf
sudo systemctl restart mongod
```

Update connection string in environment:
```env
MONGODB_URI=mongodb://admin:secure-password@localhost:27017/proxy?authSource=admin
```

## Troubleshooting

### Common Installation Issues

1. **Node.js version mismatch**:
   ```bash
   node --version  # Should be 18.0 or higher
   ```

2. **MongoDB connection failed**:
   ```bash
   sudo systemctl status mongod
   mongosh --eval "db.adminCommand('ping')"
   ```

3. **Redis connection failed**:
   ```bash
   sudo systemctl status redis
   redis-cli ping
   ```

4. **Permission issues**:
   ```bash
   # Fix file permissions
   sudo chown -R nodejs:nodejs /opt/tunnel
   sudo chmod -R 755 /opt/tunnel
   ```

5. **Port already in use**:
   ```bash
   # Check what's using the port
   sudo netstat -tulpn | grep :8080
   
   # Kill process if needed
   sudo fuser -k 8080/tcp
   ```

### Log Locations

- Application logs: Check PM2 logs or systemd journal
- MongoDB logs: `/var/log/mongodb/mongod.log`
- Redis logs: `/var/log/redis/redis-server.log`
- Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`

### Performance Tuning

1. **MongoDB optimization**:
   ```bash
   # Create indexes for better performance
   mongosh proxy --eval "
     db.requests.createIndex({hex: 1});
     db.devices.createIndex({hex: 1});
     db.metrics.createIndex({timestamp: -1});
   "
   ```

2. **System limits**:
   ```bash
   # Increase file descriptor limits
   echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
   echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
   ```

3. **Memory management**:
   ```env
   # Add to environment
   NODE_OPTIONS=--max-old-space-size=4096
   ```
