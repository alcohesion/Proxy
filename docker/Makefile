# Main Makefile for Docker environments
# Manages both development and production environments

# Environment variables
ENV ?= dev

.PHONY: help start stop restart logs status rebuild clean shell
.PHONY: check-env setup-env status-all clean-all
.PHONY: dev-start dev-stop dev-restart dev-logs dev-status dev-rebuild dev-clean dev-shell
.PHONY: prod-start prod-stop prod-restart prod-logs prod-logs-nginx prod-test-nginx prod-verify-ssl prod-status prod-rebuild prod-clean prod-shell
.PHONY: dev-build-no-cache prod-build-no-cache clean-cache clean-docker-cache clean-app-only

# Default target
help:
	@echo "Docker Environment Manager"
	@echo ""
	@echo "Usage: make [COMMAND] or make [ENV]-[COMMAND]"
	@echo ""
	@echo "Direct Commands (default: dev):"
	@echo "  make start                   - Start development environment"
	@echo "  make stop                    - Stop development environment" 
	@echo "  make restart                 - Restart development environment"
	@echo "  make logs                    - View development logs"
	@echo "  make status                  - Check development status"
	@echo "  make rebuild                 - Rebuild development services"
	@echo "  make clean                   - Clean development environment"
	@echo "  make shell                   - Open shell in development app container"
	@echo ""
	@echo "Environment-Specific Commands:"
	@echo "  make dev-start               - Start development environment"
	@echo "  make dev-stop                - Stop development environment"
	@echo "  make dev-status              - Check development status"
	@echo "  make dev-logs                - View development logs"
	@echo "  make prod-start              - Start production environment"
	@echo "  make prod-stop               - Stop production environment"
	@echo "  make prod-status             - Check production status"
	@echo "  make prod-logs               - View production logs"
	@echo "  make prod-logs-nginx         - View nginx logs (production)"
	@echo "  make prod-test-nginx         - Test nginx config (production)"
	@echo "  make prod-verify-ssl         - Verify SSL certificate chain (production)"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make check-env               - Check environment file status"
	@echo "  make setup-env               - Create environment files from templates"
	@echo "  make status-all              - Show status of both environments"
	@echo "  make clean-all               - Clean both environments (dangerous!)"
	@echo ""
	@echo "Build Commands:"
	@echo "  make dev-build-no-cache      - Rebuild development without cache"
	@echo "  make prod-build-no-cache     - Rebuild production without cache"
	@echo "  make clean-cache             - Clean all Docker caches"
	@echo "  make clean-docker-cache      - Clean Docker system cache"
	@echo "  make clean-app-only          - Clean only application images/containers (safest)"
	@echo ""
	@echo "Examples:"
	@echo "  make start                   - Start development environment"
	@echo "  make prod-start              - Start production environment"
	@echo "  make dev-logs                - View development logs"
	@echo "  make prod-restart            - Restart production environment"
	@echo "  ENV=prod make status         - Alternative syntax for production"

# Environment commands
start:
	@echo "Starting $(ENV) environment..."
	@cd $(ENV) && docker compose up -d

stop:
	@echo "Stopping $(ENV) environment..."
	@cd $(ENV) && docker compose down

restart:
	@echo "Restarting $(ENV) environment..."
	@cd $(ENV) && docker compose restart

logs:
	@echo "Showing $(ENV) logs..."
	@cd $(ENV) && docker compose logs -f

status:
	@echo "Checking $(ENV) status..."
	@cd $(ENV) && docker compose ps

rebuild:
	@echo "Rebuilding $(ENV) environment..."
	@cd $(ENV) && docker compose down && docker compose build --no-cache && docker compose up -d

clean:
	@echo "Cleaning $(ENV) environment..."
	@cd $(ENV) && docker compose down -v --remove-orphans

shell:
	@echo "Opening $(ENV) shell..."
	@cd $(ENV) && docker compose exec app /bin/sh

# Development environment specific commands
dev-start:
	@$(MAKE) ENV=dev start

dev-stop:
	@$(MAKE) ENV=dev stop

dev-restart:
	@$(MAKE) ENV=dev restart

dev-logs:
	@$(MAKE) ENV=dev logs

dev-status:
	@$(MAKE) ENV=dev status

dev-rebuild:
	@$(MAKE) ENV=dev rebuild

dev-clean:
	@$(MAKE) ENV=dev clean

dev-shell:
	@$(MAKE) ENV=dev shell

# Production environment specific commands
prod-start:
	@$(MAKE) ENV=prod start

prod-stop:
	@$(MAKE) ENV=prod stop

prod-restart:
	@$(MAKE) ENV=prod restart

prod-logs:
	@$(MAKE) ENV=prod logs

prod-logs-nginx:
	@echo "Viewing nginx logs for production environment..."
	@cd prod && docker compose logs nginx

prod-test-nginx:
	@echo "Testing nginx configuration for production environment..."
	@cd prod && docker compose run --rm --entrypoint "nginx -t" nginx || \
		echo "Error: nginx config test failed. Check the configuration files."

prod-status:
	@$(MAKE) ENV=prod status

prod-rebuild:
	@$(MAKE) ENV=prod rebuild

prod-clean:
	@$(MAKE) ENV=prod clean

prod-shell:
	@$(MAKE) ENV=prod shell

prod-verify-ssl:
	@echo "Verifying SSL certificate chain for production environment..."
	@cd prod && docker compose run --rm --entrypoint "sh" nginx -c " \
		echo 'Checking SSL certificate details:'; \
		openssl x509 -in /etc/nginx/ssl/fullchain.pem -text -noout | head -20; \
		echo ''; \
		echo 'Verifying certificate chain:'; \
		openssl crl2pkcs7 -nocrl -certfile /etc/nginx/ssl/fullchain.pem | openssl pkcs7 -print_certs -text -noout | grep 'Subject:'; \
		echo ''; \
		echo 'Checking certificate and key match:'; \
		CERT_MD5=\$$(openssl x509 -noout -modulus -in /etc/nginx/ssl/fullchain.pem | openssl md5); \
		KEY_MD5=\$$(openssl rsa -noout -modulus -in /etc/nginx/ssl/key.pem | openssl md5); \
		echo \"Certificate modulus: \$$CERT_MD5\"; \
		echo \"Private key modulus: \$$KEY_MD5\"; \
		if [ \"\$$CERT_MD5\" = \"\$$KEY_MD5\" ]; then \
			echo '✓ Certificate and private key match'; \
		else \
			echo '✗ Certificate and private key do NOT match'; \
		fi \
	" || echo "Error: Could not verify SSL certificates. Make sure nginx container is available."

# Advanced commands
check-env:
	@echo "Checking environment configurations..."
	@echo ""
	@echo "Development environment:"
	@if [ -f "dev/.env" ]; then \
		echo "  ✓ dev/.env exists"; \
	else \
		echo "  ✗ dev/.env missing (copy from dev/.env.example)"; \
	fi
	@echo ""
	@echo "Production environment:"
	@if [ -f "prod/.env" ]; then \
		echo "  ✓ prod/.env exists"; \
	else \
		echo "  ✗ prod/.env missing (copy from prod/.env.example)"; \
	fi
	@echo ""
	@echo "Use 'make setup-env' to create missing environment files"

setup-env:
	@echo "Setting up environment files..."
	@if [ ! -f "dev/.env" ]; then \
		echo "Creating dev/.env from template..."; \
		cp dev/.env.example dev/.env; \
		echo "✓ Created dev/.env"; \
	else \
		echo "✓ dev/.env already exists"; \
	fi
	@if [ ! -f "prod/.env" ]; then \
		echo "Creating prod/.env from template..."; \
		cp prod/.env.example prod/.env; \
		echo "✓ Created prod/.env"; \
		echo "IMPORTANT: Edit prod/.env with your domain and strong passwords!"; \
	else \
		echo "✓ prod/.env already exists"; \
	fi

# Clean everything (both environments)
clean-all:
	@echo "Cleaning all environments..."
	@echo "This will remove all containers, volumes, and data from both environments!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo ""; \
		echo "Cleaning development environment..."; \
		cd dev && docker compose down -v --remove-orphans; \
		echo "Cleaning production environment..."; \
		cd prod && docker compose down -v --remove-orphans; \
		echo "✓ All environments cleaned"; \
	else \
		echo ""; \
		echo "Operation cancelled"; \
	fi

# Status of both environments
status-all:
	@echo "=== Development Environment Status ==="
	@cd dev && docker compose ps || echo "Development environment not running"
	@echo ""
	@echo "=== Production Environment Status ==="
	@cd prod && docker compose ps || echo "Production environment not running"

# No-cache build commands
dev-build-no-cache:
	@echo "Rebuilding development app with no cache..."
	@cd dev && docker compose build --no-cache app && docker compose up -d

prod-build-no-cache:
	@echo "Rebuilding production app with no cache..."
	@cd prod && docker compose build --no-cache app && docker compose up -d

# Cache cleaning commands
clean-cache:
	@echo "Cleaning application Docker caches only..."
	@echo "Removing stopped containers..."
	@docker container prune -f || true
	@echo "Removing application images (preserving base images)..."
	@docker images --filter "reference=*tunnel*" --filter "reference=*app*" --filter "reference=*dev*" --filter "reference=*prod*" -q | xargs -r docker rmi -f || true
	@echo "Cleaning build cache..."
	@docker builder prune -f || true
	@echo "Removing unused networks..."
	@docker network prune -f || true
	@echo "✓ Application Docker caches cleaned (MongoDB, Redis, Nginx images preserved)"

clean-docker-cache:
	@echo "Cleaning Docker system cache (application-specific only)..."
	@echo "Removing stopped containers..."
	@docker container prune -f || true
	@echo "Removing application images (preserving base images)..."
	@docker images --filter "reference=*tunnel*" --filter "reference=*app*" --filter "reference=*dev*" --filter "reference=*prod*" -q | xargs -r docker rmi -f || true
	@echo "Cleaning build cache..."
	@docker builder prune -f || true
	@echo "Removing unused networks..."
	@docker network prune -f || true
	@echo "Removing application volumes only..."
	@docker volume ls --filter "name=*tunnel*" --filter "name=*app*" --filter "name=*dev*" --filter "name=*prod*" -q | xargs -r docker volume rm || true
	@echo "✓ Application Docker caches cleaned (MongoDB, Redis, Nginx images and data preserved)"

# Ultra-safe application-only cleaning for CI/CD
clean-app-only:
	@echo "Cleaning only application containers and images (ultra-safe)..."
	@echo "Stopping application containers..."
	@docker ps -a --filter "name=*app*" --filter "name=*tunnel*" -q | xargs -r docker stop || true
	@echo "Removing application containers..."
	@docker ps -a --filter "name=*app*" --filter "name=*tunnel*" -q | xargs -r docker rm -f || true
	@echo "Removing application images (preserving ALL base images)..."
	@docker images --filter "reference=*tunnel*" --filter "reference=*app*" --filter "reference=*dev*" --filter "reference=*prod*" --format "table {{.Repository}}:{{.Tag}}\t{{.ID}}" | grep -v "REPOSITORY" | grep -E "(tunnel|app|dev|prod)" | awk '{print $$2}' | xargs -r docker rmi -f || true
	@echo "✓ Application cleaned (MongoDB, Redis, Nginx completely untouched)"
