#!/bin/bash

# Insurance CRM Deployment Script
set -e

echo "🚀 Starting Insurance CRM Deployment..."

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DB=${2:-true}

echo "📋 Environment: $ENVIRONMENT"
echo "💾 Backup Database: $BACKUP_DB"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_status "All dependencies are installed"
}

# Backup database if requested
backup_database() {
    if [ "$BACKUP_DB" = "true" ]; then
        print_status "Creating database backup..."
        
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        
        if docker-compose exec -T database pg_dump -U postgres insurance_crm > "backups/$BACKUP_FILE" 2>/dev/null; then
            print_status "Database backup created: backups/$BACKUP_FILE"
        else
            print_warning "Database backup failed or no existing database found"
        fi
    fi
}

# Build and deploy
deploy() {
    print_status "Building and deploying application..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down
    
    # Build new images
    print_status "Building new images..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    if docker-compose ps | grep -q "Up (healthy)"; then
        print_status "Services are healthy"
    else
        print_warning "Some services may not be healthy. Check logs with: docker-compose logs"
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    if docker-compose exec backend npm run db:migrate:deploy; then
        print_status "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
}

# Seed database if it's a fresh deployment
seed_database() {
    print_status "Checking if database needs seeding..."
    
    # Check if settings table exists and has data
    if docker-compose exec -T database psql -U postgres -d insurance_crm -c "SELECT COUNT(*) FROM settings;" &> /dev/null; then
        print_status "Database already has data, skipping seed"
    else
        print_status "Seeding database with initial data..."
        docker-compose exec backend npm run db:seed
        print_status "Database seeded successfully"
    fi
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Check backend health
    if curl -f http://localhost:5000/health &> /dev/null; then
        print_status "Backend is healthy"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 &> /dev/null; then
        print_status "Frontend is healthy"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
}

# Cleanup old images
cleanup() {
    print_status "Cleaning up old Docker images..."
    docker image prune -f
    print_status "Cleanup completed"
}

# Main deployment process
main() {
    echo "🏁 Starting deployment process..."
    
    # Create backups directory if it doesn't exist
    mkdir -p backups
    
    check_dependencies
    backup_database
    deploy
    run_migrations
    seed_database
    health_check
    cleanup
    
    print_status "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Application URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo ""
    echo "🔐 Default Login:"
    echo "   Email:    agent@insurancecrm.com"
    echo "   Password: admin123"
    echo ""
    echo "📊 Useful Commands:"
    echo "   View logs:     docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart:       docker-compose restart"
}

# Run main function
main