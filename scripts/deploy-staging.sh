#!/bin/bash

# =====================================================
# STAGING ENVIRONMENT DEPLOYMENT SCRIPT
# =====================================================
# This script helps you deploy the staging environment
# with Jitsi integration on your current VPS
#
# Usage: ./scripts/deploy-staging.sh [command]
# Commands:
#   setup    - Initial setup (first time only)
#   start    - Start staging environment
#   stop     - Stop staging environment
#   restart  - Restart staging environment
#   logs     - View logs
#   status   - Check status of all containers
#   clean    - Remove staging environment (WARNING: deletes data!)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]] && ! groups | grep -q docker; then
        error "This script requires root privileges or docker group membership"
        echo "Run with: sudo ./scripts/deploy-staging.sh or add your user to docker group"
        exit 1
    fi
}

# Check if .env.staging exists
check_env_file() {
    if [ ! -f ".env.staging" ]; then
        error ".env.staging file not found!"
        echo ""
        echo "Please create .env.staging from .env.staging.example:"
        echo "  cp .env.staging.example .env.staging"
        echo "  nano .env.staging  # Edit and fill in all values"
        echo ""
        exit 1
    fi
}

# Generate secrets helper
generate_secrets() {
    info "Generating secrets for .env.staging..."
    echo ""
    echo "# Database Password (save this)"
    echo "POSTGRES_PASSWORD_STAGING=$(openssl rand -hex 16)"
    echo ""
    echo "# JWT Secrets (save these)"
    echo "JWT_SECRET=$(openssl rand -hex 32)"
    echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
    echo ""
    echo "# Encryption Key (MUST be exactly 32 characters)"
    echo "ENCRYPTION_KEY=$(openssl rand -hex 16)"
    echo ""
    echo "# Jitsi Secrets (save these)"
    echo "JITSI_APP_SECRET_STAGING=$(openssl rand -hex 32)"
    echo "JICOFO_COMPONENT_SECRET_STAGING=$(openssl rand -hex 16)"
    echo "JICOFO_AUTH_PASSWORD_STAGING=$(openssl rand -hex 16)"
    echo "JVB_AUTH_PASSWORD_STAGING=$(openssl rand -hex 16)"
    echo ""
    success "Copy these values to your .env.staging file"
}

# Setup DNS helper
check_dns() {
    info "Checking DNS configuration..."

    local domains=("staging.sidra.sd" "api-staging.sidra.sd" "meet-staging.sidra.sd")
    local all_ok=true

    for domain in "${domains[@]}"; do
        if host "$domain" &> /dev/null; then
            success "$domain DNS configured ✓"
        else
            error "$domain DNS NOT configured ✗"
            all_ok=false
        fi
    done

    if [ "$all_ok" = false ]; then
        warning "Please configure DNS records before continuing"
        echo ""
        echo "Add these A records to your DNS:"
        echo "  staging.sidra.sd      → <your-server-ip>"
        echo "  api-staging.sidra.sd  → <your-server-ip>"
        echo "  meet-staging.sidra.sd → <your-server-ip>"
        echo ""
        read -p "Press Enter when DNS is configured..."
    fi
}

# Setup SSL certificates
setup_ssl() {
    info "Setting up SSL certificates for staging..."

    # First, start nginx to handle ACME challenges
    docker-compose -f docker-compose.production.yml restart nginx
    sleep 5

    # Obtain certificates
    docker-compose -f docker-compose.production.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email admin@sidra.sd \
        --agree-tos \
        --no-eff-email \
        -d staging.sidra.sd \
        -d api-staging.sidra.sd \
        -d meet-staging.sidra.sd

    # Reload nginx
    docker-compose -f docker-compose.production.yml exec nginx nginx -s reload

    success "SSL certificates obtained"
}

# Copy production database to staging
copy_database() {
    info "Copying production database to staging..."

    warning "This will overwrite the staging database if it exists!"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Skipping database copy"
        return
    fi

    # Create backup directory
    mkdir -p ./backups

    # Dump production database
    info "Dumping production database..."
    docker exec sidra_postgres pg_dump -U sidra_user sidra_db > ./backups/prod_for_staging_$(date +%Y%m%d_%H%M%S).sql

    # Wait for staging postgres to be ready
    info "Waiting for staging database to be ready..."
    sleep 10

    # Restore to staging
    info "Restoring to staging database..."
    docker exec -i sidra_postgres_staging psql -U sidra_staging sidra_staging < ./backups/prod_for_staging_*.sql

    # Sanitize sensitive data
    info "Sanitizing sensitive data in staging..."
    docker exec -i sidra_postgres_staging psql -U sidra_staging sidra_staging << EOF
-- Anonymize emails (append +staging)
UPDATE users SET email = CONCAT(SPLIT_PART(email, '@', 1), '+staging@', SPLIT_PART(email, '@', 2));

-- Clear payment tokens
UPDATE users SET stripe_customer_id = NULL WHERE stripe_customer_id IS NOT NULL;

-- Clear sensitive teacher data
UPDATE teacher_profiles SET encrypted_meeting_link = NULL WHERE encrypted_meeting_link IS NOT NULL;

-- Mark all as test data
UPDATE users SET email_verified = false;
EOF

    success "Database copied and sanitized"
}

# Initial setup
setup() {
    info "Starting staging environment setup..."

    check_permissions

    # Generate secrets if needed
    if [ ! -f ".env.staging" ]; then
        generate_secrets
        echo ""
        read -p "Press Enter after you've created .env.staging..."
    fi

    check_env_file
    check_dns

    # Load nginx staging config
    info "Enabling staging nginx configuration..."
    if [ ! -L "./nginx/conf.d/staging.conf" ]; then
        ln -s ./nginx/conf.d/staging/default.conf ./nginx/conf.d/staging.conf
    fi
    docker-compose -f docker-compose.production.yml restart nginx

    setup_ssl

    # Build and start staging environment
    info "Building staging environment..."
    docker-compose -f docker-compose.staging.yml build --no-cache

    info "Starting staging environment..."
    docker-compose -f docker-compose.staging.yml up -d

    # Wait for services to be healthy
    info "Waiting for services to be healthy..."
    sleep 30

    # Check status
    docker-compose -f docker-compose.staging.yml ps

    success "Staging environment setup complete!"
    echo ""
    echo "Staging URLs:"
    echo "  Web:   https://staging.sidra.sd"
    echo "  API:   https://api-staging.sidra.sd"
    echo "  Jitsi: https://meet-staging.sidra.sd"
    echo ""
    info "Next steps:"
    echo "  1. Copy production database: ./scripts/deploy-staging.sh copy-db"
    echo "  2. Test the environment"
    echo "  3. Start integrating Jitsi"
}

# Start staging environment
start() {
    info "Starting staging environment..."
    check_env_file
    docker-compose -f docker-compose.staging.yml up -d
    success "Staging environment started"
    docker-compose -f docker-compose.staging.yml ps
}

# Stop staging environment
stop() {
    info "Stopping staging environment..."
    docker-compose -f docker-compose.staging.yml down
    success "Staging environment stopped"
}

# Restart staging environment
restart() {
    info "Restarting staging environment..."
    docker-compose -f docker-compose.staging.yml restart
    success "Staging environment restarted"
}

# View logs
logs() {
    docker-compose -f docker-compose.staging.yml logs -f --tail=100
}

# Check status
status() {
    info "Staging environment status:"
    docker-compose -f docker-compose.staging.yml ps
    echo ""
    info "Resource usage:"
    docker stats --no-stream $(docker-compose -f docker-compose.staging.yml ps -q)
}

# Clean up staging environment
clean() {
    error "WARNING: This will DELETE all staging data!"
    read -p "Are you sure? Type 'yes' to confirm: " confirm
    if [ "$confirm" != "yes" ]; then
        info "Cancelled"
        exit 0
    fi

    info "Stopping and removing staging environment..."
    docker-compose -f docker-compose.staging.yml down -v

    info "Removing staging nginx config..."
    rm -f ./nginx/conf.d/staging.conf

    success "Staging environment cleaned"
}

# Main command handler
case "${1:-}" in
    setup)
        setup
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    copy-db)
        copy_database
        ;;
    clean)
        clean
        ;;
    generate-secrets)
        generate_secrets
        ;;
    *)
        echo "Staging Environment Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup            - Initial setup (first time only)"
        echo "  start            - Start staging environment"
        echo "  stop             - Stop staging environment"
        echo "  restart          - Restart staging environment"
        echo "  logs             - View logs"
        echo "  status           - Check status of all containers"
        echo "  copy-db          - Copy production database to staging"
        echo "  generate-secrets - Generate secrets for .env.staging"
        echo "  clean            - Remove staging environment (deletes data)"
        echo ""
        exit 1
        ;;
esac
