# Docker Deployment

This directory contains the Docker deployment configurations for the proxy server application, organized by environment with comprehensive no-cache build support.

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
│   ├── nginx/              # Production nginx configuration with SSL
│   │   └── ssl/            # SSL certificates directory
│   └── README.md           # Production documentation
├── Dockerfile              # Common application image (with no-cache support)
├── redis.conf              # Common Redis configuration
├── init.sh                 # Common initialization script
├── manage.sh               # Docker management utilities
├── Makefile                # Main Makefile with no-cache build targets
└── README.md               # This file
```

## Architecture

Both environments use a multi-container architecture with automatic cache clearing:

- **nginx** - Reverse proxy and load balancer (SSL in production)
- **app** - Main Node.js application with modular query architecture
- **mongo** - MongoDB database (with auth in production)
- **redis** - Redis cache and queue storage (with auth in production)

### No-Cache Build System

The deployment system ensures fresh builds without any cached code:

- **Docker BuildKit** - Uses DOCKER_BUILDKIT=1 for advanced caching control
- **Automatic Cache Clearing** - Deployment workflow clears all relevant caches
- **Fresh Dependencies** - npm cache is cleared before each build
- **Clean Artifacts** - All temporary files and build artifacts are removed
- **Forced Rebuilds** - `--no-cache` flag ensures Docker doesn't use layer cache

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

# For clean development builds
make dev-build-no-cache  # Rebuild without any cache
make dev-clean           # Clean environment and data
```
Access: http://localhost

### Production Environment
```bash
cd docker
make setup-env        # Create environment files
# Configure GitHub secrets: SSL_CERT, SSL_KEY, SSL_CA_BUNDLE
# Deploy via GitHub Actions workflow (includes automatic cache clearing)
make prod-start       # Start production (after deployment)

# For manual clean production builds
make prod-build-no-cache  # Rebuild without any cache
make prod-clean           # Clean environment and data
```
Access: https://yourdomain.com

## Environment Differences

| Feature | Development | Production |
|---------|-------------|------------|
| SSL/TLS | No | Yes (GitHub Secrets) |
| Authentication | No | No (simplified) |
| Logging | Debug | Info/Warn |
| Rate Limiting | Relaxed | Strict |
| Security Headers | Basic | Full CSP + HSTS |
| Resource Limits | Small | Optimized |
| Build Cache | No-cache options | Automatic cache clearing |
| Code Deployment | Manual builds | GitHub Actions with cache clearing |
| Query Architecture | Modular factory pattern | Modular factory pattern |
| Error Handling | Console + injected logging | Injected logging only |

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
| **No-Cache Build Commands** |
| `make dev-build-no-cache` | Rebuild development without cache | dev |
| `make prod-build-no-cache` | Rebuild production without cache | prod |
| `make clean-cache` | Clean all Docker caches | both |
| `make clean-docker-cache` | Clean Docker system cache | both |
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

# Development with no-cache builds
make dev-build-no-cache  # Clean rebuild without cache
make dev-clean           # Clean environment completely
make clean-cache         # Clear all Docker caches

# Production workflow
make setup-env           # Create environment files  
# Configure GitHub secrets and deploy via GitHub Actions
make prod-start          # Start production (after deployment)
make prod-test-nginx     # Test nginx configuration
make prod-verify-ssl     # Verify SSL certificate chain
make prod-status         # Check production status

# Production with no-cache builds
make prod-build-no-cache # Clean rebuild without cache
make prod-clean          # Clean production data
make clean-docker-cache  # Clean Docker system cache

# Environment management
make status-all          # Check both environments
make dev-stop            # Stop development only
make prod-logs           # View production logs only
make prod-logs-nginx     # View nginx logs (production)

# Maintenance and troubleshooting
make dev-rebuild         # Standard rebuild development
make prod-clean          # Clean production data
make clean-all           # Clean everything (dangerous!)
```

## No-Cache Deployment Workflow

The project includes comprehensive no-cache build support to ensure fresh deployments:

### Automatic Deployment (GitHub Actions)

The deployment workflow automatically performs cache clearing:

1. **Code Checkout** - Fresh repository checkout
2. **Cache Clearing** - Clears all Docker, Node.js, and application caches
3. **Container Cleanup** - Removes all existing containers and images
4. **Fresh Build** - Forces Docker build with `--no-cache` flag
5. **Clean Start** - Starts services with fresh code and dependencies

### Manual No-Cache Builds

For manual deployments or development:

```bash
# Complete clean rebuild (development)
make dev-clean              # Stop and remove all containers/volumes
make clean-cache            # Clear Docker build cache
make dev-build-no-cache     # Rebuild with --no-cache flag

# Complete clean rebuild (production)
make prod-clean             # Stop and remove all containers/volumes  
make clean-docker-cache     # Clear Docker system cache
make prod-build-no-cache    # Rebuild with --no-cache flag
```

### What Gets Cleared

The no-cache system clears:

- **Docker Layer Cache** - All intermediate layers and build cache
- **Docker Images** - Project-related Docker images
- **Node.js Cache** - npm cache and node_modules directories
- **Application Files** - logs, temp files, build artifacts
- **Docker Volumes** - Optionally clears persistent data volumes
- **BuildKit Cache** - Advanced Docker build cache

### Dockerfile No-Cache Features

The Dockerfile includes built-in cache clearing:

- Explicit `npm cache clean --force` commands
- Removal of `package-lock.json` before fresh installs
- Clean npm ci installation process
- No package-lock.json in Docker build context (via .dockerignore)

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

**Build cache issues:**
```bash
# Development cache problems
make dev-clean              # Clean development completely
make clean-cache            # Clear all Docker caches
make dev-build-no-cache     # Force clean rebuild

# Production cache problems  
make prod-clean             # Clean production completely
make clean-docker-cache     # Clear Docker system cache
make prod-build-no-cache    # Force clean rebuild

# Nuclear option - clear everything
make clean-all              # Clean both environments
```

**Stale code in containers:**
```bash
# The deployment workflow automatically handles this, but for manual builds:
make clean-docker-cache     # Clear Docker system cache
make [env]-build-no-cache   # Rebuild specific environment
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

# If services still won't start after cache issues:
make [env]-clean      # Clean specific environment
make clean-cache      # Clear Docker caches
make [env]-build-no-cache  # Force rebuild
```

**Application code not updating:**
```bash
# This should not happen with the no-cache deployment workflow
# But for manual debugging:
make clean-docker-cache     # Clear all Docker caches
make prod-build-no-cache    # Force production rebuild
make dev-build-no-cache     # Force development rebuild

# Check if code is actually updated in container:
make [env]-shell            # Enter container shell
ls -la /app/                # Check application files
cat /app/src/app.js         # Verify code content
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
- No authentication required on MongoDB and Redis (simplified configuration)
- HTTPS with strong SSL configuration
- Security headers and CSP enabled
- Rate limiting active
- Production logging only
- **Automatic no-cache builds** via GitHub Actions deployment
- **Fresh code guarantee** - no cached artifacts in production

**Important:** Configure strong AUTH_TOKEN and HEX_ENCRYPTION_KEY in GitHub secrets for application security!

## Build System Details

### Docker Build Process

The Dockerfile implements a multi-stage approach for cache control:

1. **System Dependencies** - Installs required system packages
2. **Package Management** - Explicit cache clearing before npm operations
3. **Dependency Installation** - Fresh npm ci with cache clearing
4. **Source Code Copy** - Clean source code without artifacts
5. **Runtime Setup** - User permissions and health checks

### Makefile Targets

Key Makefile targets for no-cache operations:

- `[env]-build-no-cache`: Rebuilds environment without Docker cache
- `clean-cache`: Clears all Docker build and system caches  
- `clean-docker-cache`: Comprehensive Docker system cleanup
- `[env]-clean`: Removes environment containers and volumes

### Deployment Pipeline

The GitHub Actions deployment pipeline ensures:

1. Fresh code checkout from repository
2. Complete cache clearing (Docker, npm, application)
3. Clean environment setup with secrets
4. Force rebuild with BuildKit and no-cache flags
5. Verification of successful deployment
