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
├── manage.sh               # Environment switcher script (alternative)
├── Makefile                # Main Makefile with --dev/--prod flags
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
```
Access: http://localhost

### Production Environment
```bash
cd docker
make setup-env        # Create environment files
# Edit prod/.env with your domain and strong passwords
make start --prod     # Start production
make ssl-setup --prod # Setup SSL certificates  
make restart --prod   # Restart with SSL
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

### Main Makefile Commands

The main Makefile uses environment flags for clean syntax:

```bash
# Development (default)
make start              # Start development environment
make stop               # Stop development environment  
make logs               # View development logs
make status             # Check development status
make restart            # Restart development
make clean              # Clean development environment
make shell              # Open shell in development app

# Production (with --prod flag)
make start --prod       # Start production environment
make stop --prod        # Stop production environment
make logs --prod        # View production logs  
make status --prod      # Check production status
make restart --prod     # Restart production
make clean --prod       # Clean production environment
make shell --prod       # Open shell in production app

# SSL Management (production only)
make ssl-setup --prod   # Setup SSL certificates with Let's Encrypt
make ssl-renew --prod   # Renew SSL certificates

# Environment Setup
make setup-env          # Create .env files from templates
make check-env          # Check if .env files exist
make status-all         # Show status of both environments
make clean-all          # Clean both environments (with confirmation)
```

### Alternative: Environment Switcher Script

You can also use the `manage.sh` script for explicit environment management:

```bash
./manage.sh start dev         # Start development
./manage.sh start prod        # Start production  
./manage.sh ssl-setup         # Setup SSL for production
./manage.sh logs dev          # View development logs
```

## SSL Certificate Setup

For production environments, SSL certificates are managed automatically:

### Automatic Setup (Let's Encrypt)
1. Edit `prod/.env` with your domain and email
2. Run `make ssl-setup --prod`
3. Restart: `make restart --prod`

### Certificate Renewal
SSL certificates auto-renew. For manual renewal:
```bash
make ssl-renew --prod
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
# Ensure domain points to your server
# Check DNS with: dig yourdomain.com  
# Verify ports 80/443 are open
make ssl-setup --prod
```

**Services won't start:**
```bash
make status --dev     # Check development status
make status --prod    # Check production status
make logs --dev       # View development logs
make logs --prod      # View production logs
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
