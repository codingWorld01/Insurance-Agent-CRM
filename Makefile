# Insurance CRM Makefile

.PHONY: help install dev build test clean deploy docker-build docker-run setup-dev backup

# Default target
help:
	@echo "Insurance CRM - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make install     - Install all dependencies"
	@echo "  make dev         - Start development servers"
	@echo "  make setup-dev   - Complete development environment setup"
	@echo ""
	@echo "Building:"
	@echo "  make build       - Build both frontend and backend"
	@echo "  make clean       - Clean build artifacts"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run all tests"
	@echo "  make test-unit   - Run unit tests only"
	@echo "  make test-e2e    - Run end-to-end tests"
	@echo ""
	@echo "Database:"
	@echo "  make db-setup    - Setup database with migrations and seed"
	@echo "  make db-reset    - Reset database (WARNING: Deletes all data)"
	@echo "  make db-seed     - Seed database with sample data"
	@echo "  make backup      - Create database backup"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker images"
	@echo "  make docker-run   - Run with Docker Compose"
	@echo "  make docker-dev   - Start development database with Docker"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy      - Deploy to production"
	@echo "  make health      - Check application health"

# Installation
install:
	@echo "📦 Installing dependencies..."
	cd backend && npm install
	cd frontend && npm install
	@echo "✅ Dependencies installed"

# Development
dev:
	@echo "🚀 Starting development servers..."
	@echo "Backend will run on http://localhost:5000"
	@echo "Frontend will run on http://localhost:3000"
	@echo ""
	@echo "Press Ctrl+C to stop both servers"
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

setup-dev:
	@echo "🛠️  Setting up development environment..."
ifeq ($(OS),Windows_NT)
	powershell -ExecutionPolicy Bypass -File scripts/setup-dev.ps1
else
	./scripts/setup-dev.sh
endif

# Building
build:
	@echo "🔨 Building application..."
	cd backend && npm run build
	cd frontend && npm run build
	@echo "✅ Build completed"

clean:
	@echo "🧹 Cleaning build artifacts..."
	cd backend && npm run clean 2>/dev/null || rm -rf dist
	cd frontend && npm run clean 2>/dev/null || rm -rf .next out
	@echo "✅ Clean completed"

# Testing
test:
	@echo "🧪 Running all tests..."
	cd backend && npm test
	cd frontend && npm test
	@echo "✅ All tests completed"

test-unit:
	@echo "🧪 Running unit tests..."
	cd backend && npm test
	cd frontend && npm test
	@echo "✅ Unit tests completed"

test-e2e:
	@echo "🧪 Running end-to-end tests..."
	cd frontend && npm run test:e2e
	@echo "✅ E2E tests completed"

# Database
db-setup:
	@echo "🗄️  Setting up database..."
	cd backend && npm run db:setup
	@echo "✅ Database setup completed"

db-reset:
	@echo "⚠️  Resetting database (this will delete all data)..."
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	cd backend && npm run db:reset
	@echo "✅ Database reset completed"

db-seed:
	@echo "🌱 Seeding database..."
	cd backend && npm run db:seed
	@echo "✅ Database seeded"

backup:
	@echo "💾 Creating database backup..."
ifeq ($(OS),Windows_NT)
	powershell -ExecutionPolicy Bypass -File scripts/backup.ps1
else
	./scripts/backup.sh
endif

# Docker
docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build
	@echo "✅ Docker images built"

docker-run:
	@echo "🐳 Starting application with Docker..."
	docker-compose up -d
	@echo "✅ Application started with Docker"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:5000"

docker-dev:
	@echo "🐳 Starting development database with Docker..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Development database started"

docker-stop:
	@echo "🐳 Stopping Docker containers..."
	docker-compose down
	@echo "✅ Docker containers stopped"

# Deployment
deploy:
	@echo "🚀 Deploying to production..."
ifeq ($(OS),Windows_NT)
	powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1
else
	./scripts/deploy.sh
endif

health:
	@echo "🏥 Checking application health..."
	@curl -f http://localhost:5000/health || echo "❌ Backend health check failed"
	@curl -f http://localhost:3000/api/health || echo "❌ Frontend health check failed"
	@echo "✅ Health check completed"

# Utility targets
logs:
	docker-compose logs -f

restart:
	docker-compose restart

status:
	docker-compose ps