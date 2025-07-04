# Main Makefile for Docker environments
# Manages both development and production environments

# Environment variables
ENV ?= dev

.PHONY: help start stop restart logs status rebuild clean shell ssl-setup ssl-renew
.PHONY: check-env setup-env status-all clean-all
.PHONY: dev-start dev-stop dev-restart dev-logs dev-status dev-rebuild dev-clean dev-shell
.PHONY: prod-start prod-stop prod-restart prod-logs prod-status prod-rebuild prod-clean prod-shell

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
	@echo ""
	@echo "SSL Management (production only):"
	@echo "  make ssl-setup               - Setup SSL certificates (production)"
	@echo "  make ssl-renew               - Renew SSL certificates (production)"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make check-env               - Check environment file status"
	@echo "  make setup-env               - Create environment files from templates"
	@echo "  make status-all              - Show status of both environments"
	@echo "  make clean-all               - Clean both environments (dangerous!)"
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

prod-status:
	@$(MAKE) ENV=prod status

prod-rebuild:
	@$(MAKE) ENV=prod rebuild

prod-clean:
	@$(MAKE) ENV=prod clean

prod-shell:
	@$(MAKE) ENV=prod shell

# SSL management (production only)
ssl-setup:
	@if [ "$(ENV)" != "prod" ]; then \
		echo "SSL setup is only available for production environment"; \
		echo "Use: make prod-start && ENV=prod make ssl-setup"; \
		exit 1; \
	fi
	@echo "Setting up SSL certificates for production..."
	@cd prod && docker compose run --rm certbot

ssl-renew:
	@if [ "$(ENV)" != "prod" ]; then \
		echo "SSL renewal is only available for production environment"; \
		echo "Use: ENV=prod make ssl-renew"; \
		exit 1; \
	fi
	@echo "Renewing SSL certificates for production..."
	@cd prod && docker compose run --rm certbot renew && docker compose exec nginx nginx -s reload

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
