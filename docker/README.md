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
- **certbot** - SSL certificate management (production only)

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
# Edit prod/.env with your domain and strong passwords
make prod-start       # Start production
ENV=prod make ssl-setup  # Setup SSL certificates  
make prod-restart     # Restart with SSL
```
Access: https://yourdomain.com

## Environment Differences

| Feature | Development | Production |
|---------|-------------|------------|
| SSL/TLS | No | Yes (Let's Encrypt) |
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
| **SSL Management (production only)** |
| `ENV=prod make ssl-setup` | Setup SSL certificates with Let's Encrypt | prod |
| `ENV=prod make ssl-renew` | Renew SSL certificates | prod |
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
# Edit prod/.env with your domain and passwords
make prod-start          # Start production
ENV=prod make ssl-setup  # Setup SSL certificates
make prod-restart        # Restart with SSL
make prod-status         # Check production status

# Environment management
make status-all          # Check both environments
make dev-stop            # Stop development only
make prod-logs           # View production logs only
ENV=prod make ssl-renew  # Renew SSL certificates

# Maintenance
make dev-rebuild         # Rebuild development
make prod-clean          # Clean production data
make clean-all           # Clean everything (dangerous!)
```

## SSL Certificate Setup

For production environments, SSL certificates are managed automatically:

### Automatic Setup (Let's Encrypt)
1. Edit `prod/.env` with your domain and email
2. Run `ENV=prod make ssl-setup`
3. Restart: `make prod-restart`

### Certificate Renewal
SSL certificates auto-renew. For manual renewal:
```bash
ENV=prod make ssl-renew
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

# 3. Check if nginx is serving the ACME challenge directory
curl http://yourdomain.com/.well-known/acme-challenge/test

# 4. If rate limited, wait and retry
ENV=prod make ssl-setup

# 5. Check Let's Encrypt logs for detailed errors
make prod-logs
# or directly:
docker compose -f prod/docker-compose.yml logs certbot

# 6. For testing, use staging environment first
# Edit docker-compose.yml and add --staging flag to certbot command
```

**Rate limiting issues:**
- Let's Encrypt has a limit of 5 failed authorizations per domain per hour
- Wait for the rate limit to reset before retrying
- Use staging environment for testing: add `--staging` to certbot command
- Check that your domain DNS points to your server IP
- Ensure ports 80 and 443 are open in your firewall

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
- `certbot-conf` - SSL certificates (production)

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
