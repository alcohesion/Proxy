# Main Makefile for Docker environments
# Manages both development and production environments

# Environment variables
ENV ?= dev
ifeq ($(filter --prod,$(MAKECMDGOALS)),--prod)
	ENV = prod
endif
ifeq ($(filter --dev,$(MAKECMDGOALS)),--dev)
	ENV = dev
endif

# Remove flags from goals
REAL_GOALS := $(filter-out --prod --dev,$(MAKECMDGOALS))

.PHONY: help start stop restart logs status rebuild clean shell ssl-setup ssl-renew
.PHONY: check-env setup-env status-all clean-all --prod --dev

# Dummy targets for flags
--prod:
	@:
--dev:
	@:

# Default target
help:
	@echo "Docker Environment Manager"
	@echo ""
	@echo "Usage: make [COMMAND] [--dev|--prod]"
	@echo ""
	@echo "Commands:"
	@echo "  make start [--dev|--prod]    - Start environment (default: dev)"
	@echo "  make stop [--dev|--prod]     - Stop environment"
	@echo "  make restart [--dev|--prod]  - Restart environment"
	@echo "  make logs [--dev|--prod]     - View logs"
	@echo "  make status [--dev|--prod]   - Check status"
	@echo "  make rebuild [--dev|--prod]  - Rebuild services"
	@echo "  make clean [--dev|--prod]    - Clean environment"
	@echo "  make shell [--dev|--prod]    - Open shell in app container"
	@echo ""
	@echo "SSL Management (production only):"
	@echo "  make ssl-setup               - Setup SSL certificates"
	@echo "  make ssl-renew               - Renew SSL certificates"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make check-env               - Check environment file status"
	@echo "  make setup-env               - Create environment files from templates"
	@echo "  make status-all              - Show status of both environments"
	@echo "  make clean-all               - Clean both environments (dangerous!)"
	@echo ""
	@echo "Examples:"
	@echo "  make start                   - Start development environment"
	@echo "  make start --prod            - Start production environment"
	@echo "  make logs --dev              - View development logs"
	@echo "  make restart --prod          - Restart production environment"

# Environment commands
start:
	@echo "Starting $(ENV) environment..."
	@cd $(ENV) && $(MAKE) start

stop:
	@echo "Stopping $(ENV) environment..."
	@cd $(ENV) && $(MAKE) stop

restart:
	@echo "Restarting $(ENV) environment..."
	@cd $(ENV) && $(MAKE) restart

logs:
	@echo "Showing $(ENV) logs..."
	@cd $(ENV) && $(MAKE) logs

status:
	@echo "Checking $(ENV) status..."
	@cd $(ENV) && $(MAKE) status

rebuild:
	@echo "Rebuilding $(ENV) environment..."
	@cd $(ENV) && $(MAKE) rebuild

clean:
	@echo "Cleaning $(ENV) environment..."
	@cd $(ENV) && $(MAKE) clean

shell:
	@echo "Opening $(ENV) shell..."
	@cd $(ENV) && $(MAKE) shell

# SSL management (production only)
ssl-setup:
	@if [ "$(ENV)" != "prod" ]; then \
		echo "SSL setup is only available for production environment"; \
		echo "Use: make ssl-setup --prod"; \
		exit 1; \
	fi
	@echo "Setting up SSL certificates for production..."
	@cd prod && $(MAKE) ssl-setup

ssl-renew:
	@if [ "$(ENV)" != "prod" ]; then \
		echo "SSL renewal is only available for production environment"; \
		echo "Use: make ssl-renew --prod"; \
		exit 1; \
	fi
	@echo "Renewing SSL certificates for production..."
	@cd prod && $(MAKE) ssl-renew

# Quick commands (default to development for convenience)
start: dev-start

stop: dev-stop

restart: dev-restart

logs: dev-logs

status: dev-status

clean: dev-clean

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
		echo "⚠️  IMPORTANT: Edit prod/.env with your domain and strong passwords!"; \
	else \
		echo "✓ prod/.env already exists"; \
	fi

# Clean everything (both environments)
clean-all:
	@echo "Cleaning all environments..."
	@echo "⚠️  This will remove all containers, volumes, and data from both environments!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo ""; \
		echo "Cleaning development environment..."; \
		cd dev && $(MAKE) clean; \
		echo "Cleaning production environment..."; \
		cd prod && $(MAKE) clean; \
		echo "✓ All environments cleaned"; \
	else \
		echo ""; \
		echo "Operation cancelled"; \
	fi

# Status of both environments
status-all:
	@echo "=== Development Environment Status ==="
	@cd dev && $(MAKE) status || echo "Development environment not running"
	@echo ""
	@echo "=== Production Environment Status ==="
	@cd prod && $(MAKE) status || echo "Production environment not running"
