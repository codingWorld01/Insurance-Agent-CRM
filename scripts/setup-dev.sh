#!/bin/bash

# Insurance CRM Development Setup Script
set -e

echo "🛠️  Setting up Insurance CRM Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
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
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client not found. Please install PostgreSQL."
    fi
    
    print_status "All dependencies are available"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_status "Created backend/.env from example"
        print_warning "Please update backend/.env with your database credentials"
    else
        print_info "backend/.env already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env.local" ]; then
        cp frontend/.env.local.example frontend/.env.local
        print_status "Created frontend/.env.local from example"
    else
        print_info "frontend/.env.local already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    print_status "All dependencies installed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    cd backend
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    npm run db:generate
    
    # Push schema to database
    print_info "Pushing database schema..."
    if npm run db:push; then
        print_status "Database schema created"
    else
        print_error "Failed to create database schema. Please check your database connection."
        print_info "Make sure PostgreSQL is running and update DATABASE_URL in backend/.env"
        exit 1
    fi
    
    # Seed database
    print_info "Seeding database with sample data..."
    if npm run db:seed; then
        print_status "Database seeded successfully"
    else
        print_warning "Database seeding failed. You can run 'npm run db:seed' later."
    fi
    
    cd ..
}

# Setup development database with Docker (optional)
setup_dev_database() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_info "Docker detected. Would you like to use Docker for the development database? (y/n)"
        read -r use_docker
        
        if [ "$use_docker" = "y" ] || [ "$use_docker" = "Y" ]; then
            print_status "Starting development database with Docker..."
            docker-compose -f docker-compose.dev.yml up -d database
            
            # Wait for database to be ready
            print_info "Waiting for database to be ready..."
            sleep 10
            
            # Update backend .env to use Docker database
            sed -i.bak 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/insurance_crm_dev"|' backend/.env
            print_status "Updated backend/.env to use Docker database"
            
            return 0
        fi
    fi
    
    return 1
}

# Install Playwright browsers for E2E testing
setup_playwright() {
    print_status "Setting up Playwright for E2E testing..."
    cd frontend
    npm run test:e2e:install
    cd ..
    print_status "Playwright browsers installed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p backups
    mkdir -p logs
    mkdir -p backend/uploads
    
    print_status "Directories created"
}

# Display setup completion info
display_completion_info() {
    echo ""
    echo "🎉 Development environment setup completed!"
    echo ""
    echo "📋 Next Steps:"
    echo ""
    echo "1. Update environment variables:"
    echo "   - Edit backend/.env with your database credentials"
    echo "   - Edit frontend/.env.local if needed"
    echo ""
    echo "2. Start the development servers:"
    echo "   Backend:  cd backend && npm run dev"
    echo "   Frontend: cd frontend && npm run dev"
    echo ""
    echo "3. Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo ""
    echo "🔐 Default Login Credentials:"
    echo "   Email:    agent@insurancecrm.com"
    echo "   Password: admin123"
    echo ""
    echo "🧪 Testing Commands:"
    echo "   Unit Tests:    cd frontend && npm test"
    echo "   E2E Tests:     cd frontend && npm run test:e2e"
    echo "   Backend Tests: cd backend && npm test"
    echo ""
    echo "🐳 Docker Commands (optional):"
    echo "   Start dev DB:  docker-compose -f docker-compose.dev.yml up -d"
    echo "   Stop dev DB:   docker-compose -f docker-compose.dev.yml down"
    echo ""
    echo "📚 Useful Commands:"
    echo "   Database Studio: cd backend && npm run db:studio"
    echo "   Reset Database:  cd backend && npm run db:reset"
    echo "   View Logs:       tail -f logs/*.log"
}

# Main setup process
main() {
    echo "🏁 Starting development environment setup..."
    
    check_dependencies
    create_directories
    setup_environment
    
    # Try to setup Docker database first, fallback to manual setup
    if ! setup_dev_database; then
        print_info "Using manual database setup"
    fi
    
    install_dependencies
    setup_database
    setup_playwright
    
    display_completion_info
}

# Run main function
main