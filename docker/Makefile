# Makefile for Docker deployment
# Simple commands for managing the proxy server

.PHONY: help start stop restart logs status rebuild clean shell

help:
	@echo "Docker Proxy Server Commands:"
	@echo "  make start    - Start all services"
	@echo "  make stop     - Stop all services"
	@echo "  make restart  - Restart all services"
	@echo "  make logs     - View and follow logs"
	@echo "  make status   - Show service status"
	@echo "  make rebuild  - Rebuild and restart services"
	@echo "  make clean    - Clean up containers and volumes"
	@echo "  make shell    - Open shell in app container"
	@echo ""
	@echo "Direct Docker Compose commands:"
	@echo "  docker compose up -d"
	@echo "  docker compose down"
	@echo "  docker compose logs -f"

start:
	@echo "Starting proxy server services..."
	docker compose up -d

stop:
	@echo "Stopping proxy server services..."
	docker compose down

restart:
	@echo "Restarting proxy server services..."
	docker compose restart

logs:
	@echo "Showing logs (use Ctrl+C to exit)..."
	docker compose logs -f

status:
	@echo "Service status:"
	docker compose ps

rebuild:
	@echo "Rebuilding and restarting services..."
	docker compose down
	docker compose build --no-cache
	docker compose up -d

clean:
	@echo "Cleaning up containers, networks, and volumes..."
	docker compose down -v --remove-orphans
	docker system prune -f

shell:
	@echo "Opening shell in app container..."
	docker compose exec app /bin/sh
