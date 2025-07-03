#!/bin/bash
# Docker management script for the proxy server

set -e

# Use docker compose or docker-compose based on availability
COMPOSE_CMD="docker compose"
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo "Error: Neither 'docker compose' nor 'docker-compose' is available."
        exit 1
    fi
fi

# Navigate to docker directory
cd "$(dirname "$0")"

case "$1" in
    start)
        echo "Starting proxy server services..."
        $COMPOSE_CMD up -d
        ;;
    stop)
        echo "Stopping proxy server services..."
        $COMPOSE_CMD down
        ;;
    restart)
        echo "Restarting proxy server services..."
        $COMPOSE_CMD restart
        ;;
    logs)
        echo "Showing logs (use Ctrl+C to exit)..."
        $COMPOSE_CMD logs -f
        ;;
    status)
        echo "Service status:"
        $COMPOSE_CMD ps
        ;;
    rebuild)
        echo "Rebuilding and restarting services..."
        $COMPOSE_CMD down
        $COMPOSE_CMD build --no-cache
        $COMPOSE_CMD up -d
        ;;
    clean)
        echo "Cleaning up containers, networks, and volumes..."
        $COMPOSE_CMD down -v --remove-orphans
        docker system prune -f
        ;;
    shell)
        if [ -n "$2" ]; then
            echo "Opening shell in $2 container..."
            $COMPOSE_CMD exec "$2" /bin/sh
        else
            echo "Opening shell in app container..."
            $COMPOSE_CMD exec app /bin/sh
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|rebuild|clean|shell [container]}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - View and follow logs"
        echo "  status   - Show service status"
        echo "  rebuild  - Rebuild and restart services"
        echo "  clean    - Clean up containers and volumes"
        echo "  shell    - Open shell in container (default: app)"
        echo ""
        echo "Available containers: app, mongo, redis, nginx"
        exit 1
        ;;
esac
