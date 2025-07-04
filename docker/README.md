# Docker Deployment

This directory contains the Docker deployment configurations for the proxy server application, organized by environment.

## Structure

```
docker/
├── dev/                    # Development environment
│   ├── docker-compose.yml  # HTTP-only services
│   ├── .env.example        # Development configuration template
│   ├── nginx/              # Development nginx config
│   └── README.md           # Development documentation
├── prod/                   # Production environment  
│   ├── docker-compose.yml  # HTTPS services with SSL
│   ├── .env.example        # Production configuration template
│   ├── nginx/              # Production nginx config with SSL
│   │   └── ssl/            # SSL certificates directory
│   └── README.md           # Production documentation
├── Dockerfile              # Common application image
├── redis.conf              # Common Redis configuration
├── init.sh                 # Common initialization script
├── Makefile                # Main Makefile with environment-specific targets
└── README.md               # This file
```

## Architecture

Both environments use a multi-container architecture:

- **nginx** - Reverse proxy and load balancer (SSL in production)
- **app** - Main Node.js application  
- **mongo** - MongoDB database (with auth in production)
- **redis** - Redis cache and queue storage (with auth in production)

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB of available memory
- Ports 80, 443 available

## Quick Start

### Development Environment
```bash
cd docker
make setup-env        # Create environment files
make start            # Start development (default)
# or use explicit command:
make dev-start        # Start development environment
```
Access: http://localhost

### Production Environment
```bash
cd docker
make setup-env        # Create environment files
# Configure GitHub secrets: SSL_CERT, SSL_KEY, SSL_CA_BUNDLE
# Deploy via GitHub Actions workflow
make prod-start       # Start production (after deployment)
```
Access: https://yourdomain.com

## Environment Differences

| Feature | Development | Production |
|---------|-------------|------------|
| SSL/TLS | No | Yes (GitHub Secrets) |
| Authentication | No | Yes (MongoDB + Redis) |
| Logging | Debug | Info/Warn |
| Rate Limiting | Relaxed | Strict |
| Security Headers | Basic | Full CSP + HSTS |
| Resource Limits | Small | Optimized |

## Commands

### Command Reference

| Command | Description | Environment |
|---------|-------------|-------------|
| **Direct Commands (default to development)** |
| `make start` | Start development environment | dev |
| `make stop` | Stop development environment | dev |
| `make restart` | Restart development environment | dev |
| `make logs` | View development logs | dev |
| `make status` | Check development status | dev |
| `make rebuild` | Rebuild development services | dev |
| `make clean` | Clean development environment | dev |
| `make shell` | Open shell in development app | dev |
| **Development-Specific Commands** |
| `make dev-start` | Start development environment | dev |
| `make dev-stop` | Stop development environment | dev |
| `make dev-restart` | Restart development environment | dev |
| `make dev-logs` | View development logs | dev |
| `make dev-status` | Check development status | dev |
| `make dev-rebuild` | Rebuild development services | dev |
| `make dev-clean` | Clean development environment | dev |
| `make dev-shell` | Open shell in development app | dev |
| **Production-Specific Commands** |
| `make prod-start` | Start production environment | prod |
| `make prod-stop` | Stop production environment | prod |
| `make prod-restart` | Restart production environment | prod |
| `make prod-logs` | View production logs | prod |
| `make prod-status` | Check production status | prod |
| `make prod-rebuild` | Rebuild production services | prod |
| `make prod-clean` | Clean production environment | prod |
| `make prod-shell` | Open shell in production app | prod |
| `make prod-logs-nginx` | View nginx logs (production) | prod |
| `make prod-test-nginx` | Test nginx configuration | prod |
| `make prod-verify-ssl` | Verify SSL certificate chain | prod |
| **Environment Setup** |
| `make setup-env` | Create .env files from templates | both |
| `make check-env` | Check if .env files exist | both |
| `make status-all` | Show status of both environments | both |
| `make clean-all` | Clean both environments (with confirmation) | both |

> **Tip:** Run `make help` to see all available commands with descriptions.

### Usage Examples

```bash
# Development workflow
make setup-env           # Create environment files
make start               # Start development (default)
make status              # Check status  
make logs                # View logs
make dev-restart         # Restart development

# Production workflow
make setup-env           # Create environment files  
# Configure GitHub secrets and deploy via GitHub Actions
make prod-start          # Start production (after deployment)
make prod-test-nginx     # Test nginx configuration
make prod-verify-ssl     # Verify SSL certificate chain
make prod-status         # Check production status

# Environment management
make status-all          # Check both environments
make dev-stop            # Stop development only
make prod-logs           # View production logs only
make prod-logs-nginx     # View nginx logs (production)

# Maintenance
make dev-rebuild         # Rebuild development
make prod-clean          # Clean production data
make clean-all           # Clean everything (dangerous!)
```

## SSL Certificate Setup

For production environments, SSL certificates are managed automatically via GitHub Actions:

### Automated Deployment Setup
1. Configure GitHub secrets: `SSL_CERT`, `SSL_KEY`, `SSL_CA_BUNDLE`
2. Deploy via GitHub Actions workflow
3. Certificates are automatically placed and configured

### Manual Testing
For testing nginx configuration:
```bash
make prod-test-nginx  # Test nginx config
make prod-logs-nginx  # View nginx logs
make prod-verify-ssl  # Verify SSL certificate chain
```

## Configuration Files

### Environment Variables
- `dev/.env` - Development configuration
- `prod/.env` - Production configuration (passwords, domain, SSL)

### Service Configuration  
- `redis.conf` - Redis configuration (shared)
- `init.sh` - Database initialization script (shared)
- `Dockerfile` - Application container image (shared)
- `dev/nginx/` - Development nginx configuration
- `prod/nginx/` - Production nginx configuration with SSL

## Troubleshooting

### Common Issues

**Environment files missing:**
```bash
make check-env    # Check which files are missing
make setup-env    # Create missing files from templates
```

**SSL setup fails:**
```bash
# 1. Check if domain points to your server
dig yourdomain.com  
nslookup yourdomain.com

# 2. Verify ports 80/443 are open and accessible
curl -I http://yourdomain.com
telnet yourdomain.com 80

# 3. Check nginx configuration and logs
make prod-test-nginx

# 4. View nginx logs for errors
make prod-logs-nginx

# 5. Ensure SSL certificates are properly placed
# Check that cert.pem and key.pem exist in docker/prod/nginx/ssl/
```

**SSL Certificate issues:**
- Ensure your SSL certificate files are properly placed in `docker/prod/nginx/ssl/`
- Required files: `cert.pem` (certificate chain) and `key.pem` (private key)
- Check nginx configuration: `make prod-test-nginx`
- View nginx logs: `make prod-logs-nginx`
- Verify certificate chain is complete (includes intermediate certificates)
- Check that certificate matches your domain name

**Services won't start:**
```bash
make dev-status       # Check development status
make prod-status      # Check production status
make dev-logs         # View development logs
make prod-logs        # View production logs
```

### Accessing Services

| Environment | Application | MongoDB | Redis |
|-------------|-------------|---------|-------|
| Development | http://localhost | Internal only | Internal only |
| Production | https://yourdomain.com | Internal only | Internal only |

### Data Persistence

All data is stored in Docker volumes:
- `mongo-data` - MongoDB database files
- `redis-data` - Redis persistence files  
- `app-logs` - Application log files

To backup data:
```bash
docker volume ls                        # List volumes
docker run --rm -v mongo-data:/data -v $(pwd):/backup alpine tar czf /backup/mongo-backup.tar.gz /data
```

## Security Notes

### Development
- No authentication on services
- HTTP only (no encryption)
- Debug logging enabled
- Relaxed security headers

### Production  
- MongoDB authentication required
- Redis authentication required
- HTTPS with strong SSL configuration
- Security headers and CSP enabled
- Rate limiting active
- Production logging only

**Important:** Always change default passwords in `prod/.env` before deployment!
