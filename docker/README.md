# Docker Deployment

This directory contains the Docker deployment configuration for the proxy server application, converted from the Fly.io deployment setup.

## Architecture

The Docker deployment uses a multi-container architecture with the following services:

- **nginx** - Reverse proxy and load balancer
- **app** - Main Node.js application
- **mongo** - MongoDB database
- **redis** - Redis cache and queue storage

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+ (or docker-compose 1.29+)
- At least 2GB of available memory
- Ports 80, 443, 6379, 8080, and 27017 available

## Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd /path/to/Tunnel/docker
   ```

2. **Create environment file:**
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

3. **Start the services:**
   ```bash
   docker compose up -d
   # Or using make
   make start
   ```

4. **Check service status:**
   ```bash
   docker compose ps
   # Or using make
   make status
   ```

5. **View logs:**
   ```bash
   docker compose logs -f
   # Or using make
   make logs
   ```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

### Service Configuration

- **nginx**: Configuration files in `nginx/`
- **redis**: Configuration in `redis.conf`
- **app**: Environment variables and Docker build context
- **mongo**: Uses official MongoDB 7.0 image

## Docker Commands

### Using Make (Recommended)

The project includes a Makefile for convenient command shortcuts:

```bash
# Start all services
make start

# Stop all services
make stop

# Restart all services
make restart

# View logs (follow mode)
make logs

# Check service status
make status

# Rebuild and restart services
make rebuild

# Clean up containers and volumes
make clean

# Open shell in app container
make shell

# Show all available commands
make help
```

### Direct Docker Compose Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart all services
docker compose restart

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f app

# Check service status
docker compose ps
```

### Development Commands

```bash
# Rebuild and restart services
docker compose down
docker compose build --no-cache
docker compose up -d

# Access container shell
docker compose exec app /bin/sh
docker compose exec mongo mongosh
docker compose exec redis redis-cli

# View resource usage
docker compose top
```

### Maintenance Commands

```bash
# Clean up containers, networks, and volumes
docker compose down -v --remove-orphans
docker system prune -f

# Update images
docker compose pull
docker compose up -d

# View detailed service info
docker compose config
```

## Service Details

### Application (app)
- **Port**: 8080
- **Health Check**: `/health` endpoint
- **Dependencies**: MongoDB, Redis
- **Image**: Custom Node.js 22 Alpine-based image

### Nginx (nginx)
- **Ports**: 80, 443
- **Purpose**: Reverse proxy to app service
- **Configuration**: `nginx/nginx.conf`, `nginx/default.conf`

### MongoDB (mongo)
- **Port**: 27017
- **Database**: `proxy`
- **Persistence**: `mongo-data` volume
- **Health Check**: `mongosh --eval "db.adminCommand('ping')"`

### Redis (redis)
- **Port**: 6379
- **Configuration**: `redis.conf`
- **Persistence**: `redis-data` volume
- **Health Check**: `redis-cli ping`

## Accessing Services

- **Application**: http://localhost:80 (via nginx)
- **Application (HTTPS)**: https://localhost:443 (via nginx, if SSL configured)

### Internal Services (Docker Network Only)

The following services are only accessible within the Docker network for security:
- **Direct App**: http://app:8080 (internal)
- **MongoDB**: mongodb://mongo:27017 (internal)
- **Redis**: redis://redis:6379 (internal)

### Development Access

For development purposes, you can temporarily expose internal services by adding port mappings to docker-compose.yml:

```yaml
# Add to respective services if needed for development
ports:
  - "8080:8080"  # Direct app access
  - "27017:27017"  # MongoDB access
  - "6379:6379"  # Redis access
```

## Monitoring and Logs

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f nginx
docker compose logs -f mongo
docker compose logs -f redis

# Last N lines
docker compose logs --tail=100 app
```

### Health Checks
All services include health checks that can be monitored:
```bash
# Check health status
docker compose ps

# Detailed health info
docker inspect $(docker compose ps -q app) | jq '.[0].State.Health'
```

## Volumes and Data Persistence

The following volumes are created for data persistence:
- `mongo-data`: MongoDB database files
- `mongo-config`: MongoDB configuration
- `mongo-logs`: MongoDB logs
- `redis-data`: Redis persistence files
- `app-logs`: Application logs
- `nginx-logs`: Nginx access and error logs

## Networking

All services communicate through the `proxy-network` bridge network:
- Internal service discovery via service names
- External access via published ports
- Isolated from other Docker networks

## Troubleshooting

### Common Issues

1. **Services not starting:**
   ```bash
   docker compose logs
   docker compose ps
   ```

2. **Port conflicts:**
   ```bash
   # Check port usage
   netstat -tulpn | grep :80
   # Modify ports in docker-compose.yml
   ```

3. **Database connection issues:**
   ```bash
   # Check MongoDB
   docker compose exec mongo mongosh --eval "db.adminCommand('ping')"
   
   # Check Redis
   docker compose exec redis redis-cli ping
   ```

4. **Application not responding:**
   ```bash
   # Check app logs
   docker compose logs app
   
   # Check health endpoint via nginx
   curl http://localhost:80/health
   
   # Check direct app health (from within network)
   docker compose exec nginx curl http://app:8080/health
   ```

### Performance Monitoring

```bash
# Resource usage
docker stats

# Service-specific stats
docker compose top

# Disk usage
docker system df
```

## Security Considerations

- Services run as non-root users where possible
- Internal network isolation
- No default passwords (configure in .env)
- Security headers configured in nginx
- Health checks prevent exposure of unhealthy services

## Scaling

To scale the application:
```bash
# Scale app service
docker compose up -d --scale app=3

# Load balancing handled by nginx
```

## Backup and Restore

### Database Backup
```bash
# MongoDB backup
docker compose exec mongo mongodump --out /tmp/backup
docker compose cp mongo:/tmp/backup ./mongodb-backup

# Redis backup
docker compose exec redis redis-cli BGSAVE
```

### Volume Backup
```bash
# Backup all volumes
docker run --rm -v proxy_mongo-data:/data -v $(pwd):/backup alpine tar czf /backup/mongo-backup.tar.gz /data
```

## Migration from Fly.io

This Docker deployment maintains compatibility with the Fly.io deployment:
- Same environment variables
- Same service architecture
- Same port configurations
- Same health check endpoints

## Support

For issues or questions:
1. Check the logs: `docker compose logs -f`
2. Verify service health: `docker compose ps`
3. Check resource usage: `docker stats`
4. Review configuration: `docker compose config`
