#!/bin/bash
# Environment switcher script for Docker deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_help() {
    cat << EOF
Docker Environment Manager

Usage: $0 [COMMAND] [ENVIRONMENT]

Commands:
    start [dev|prod]     - Start the specified environment
    stop [dev|prod]      - Stop the specified environment  
    restart [dev|prod]   - Restart the specified environment
    logs [dev|prod]      - Show logs for the specified environment
    status [dev|prod]    - Show status for the specified environment
    ssl-setup            - Setup SSL certificates (production only)
    ssl-renew            - Renew SSL certificates (production only)
    clean [dev|prod]     - Clean up environment (removes volumes)
    shell [dev|prod]     - Open shell in app container

Environments:
    dev     - Development environment (HTTP only)
    prod    - Production environment (HTTPS with SSL)

Examples:
    $0 start dev         - Start development environment
    $0 start prod        - Start production environment
    $0 ssl-setup         - Setup SSL for production
    $0 logs dev          - View development logs
    $0 clean prod        - Clean production environment

Note: For production, make sure to update domain and passwords in prod/.env
EOF
}

check_environment() {
    local env=$1
    if [[ "$env" != "dev" && "$env" != "prod" ]]; then
        echo "Error: Environment must be 'dev' or 'prod'"
        echo "Use '$0 help' for usage information"
        exit 1
    fi
    
    if [[ ! -d "$SCRIPT_DIR/$env" ]]; then
        echo "Error: Environment directory '$env' not found"
        exit 1
    fi
}

run_command() {
    local cmd=$1
    local env=$2
    
    case $cmd in
        start)
            check_environment "$env"
            echo "Starting $env environment..."
            cd "$SCRIPT_DIR/$env"
            make start
            ;;
        stop)
            check_environment "$env"
            echo "Stopping $env environment..."
            cd "$SCRIPT_DIR/$env"
            make stop
            ;;
        restart)
            check_environment "$env"
            echo "Restarting $env environment..."
            cd "$SCRIPT_DIR/$env"
            make restart
            ;;
        logs)
            check_environment "$env"
            echo "Showing $env logs..."
            cd "$SCRIPT_DIR/$env"
            make logs
            ;;
        status)
            check_environment "$env"
            echo "Checking $env status..."
            cd "$SCRIPT_DIR/$env"
            make status
            ;;
        shell)
            check_environment "$env"
            echo "Opening shell in $env app container..."
            cd "$SCRIPT_DIR/$env"
            make shell
            ;;
        clean)
            check_environment "$env"
            echo "Cleaning $env environment..."
            echo "WARNING: This will remove all volumes and data!"
            read -p "Are you sure? [y/N] " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cd "$SCRIPT_DIR/$env"
                make clean
            fi
            ;;
        ssl-setup)
            echo "Setting up SSL certificates for production..."
            cd "$SCRIPT_DIR/prod"
            make ssl-setup
            ;;
        ssl-renew)
            echo "Renewing SSL certificates for production..."
            cd "$SCRIPT_DIR/prod"
            make ssl-renew
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Main execution
if [[ $# -eq 0 ]]; then
    show_help
    exit 0
fi

cmd=$1
env=$2

# Handle SSL commands that don't need environment
if [[ "$cmd" == "ssl-setup" || "$cmd" == "ssl-renew" ]]; then
    run_command "$cmd"
    exit 0
fi

# Handle help
if [[ "$cmd" == "help" || "$cmd" == "--help" || "$cmd" == "-h" ]]; then
    show_help
    exit 0
fi

# All other commands require environment
if [[ -z "$env" ]]; then
    echo "Error: Environment required for command '$cmd'"
    echo "Use '$0 help' for usage information"
    exit 1
fi

run_command "$cmd" "$env"
