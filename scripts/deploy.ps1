# Insurance CRM Deployment Script (PowerShell)
param(
    [string]$Environment = "production",
    [bool]$BackupDB = $true
)

Write-Host "🚀 Starting Insurance CRM Deployment..." -ForegroundColor Green
Write-Host "📋 Environment: $Environment" -ForegroundColor Cyan
Write-Host "💾 Backup Database: $BackupDB" -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if required tools are installed
function Test-Dependencies {
    Write-Status "Checking dependencies..."
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed"
        exit 1
    }
    
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "Docker Compose is not installed"
        exit 1
    }
    
    Write-Status "All dependencies are installed"
}

# Backup database if requested
function Backup-Database {
    if ($BackupDB) {
        Write-Status "Creating database backup..."
        
        $BackupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
        
        try {
            docker-compose exec -T database pg_dump -U postgres insurance_crm > "backups/$BackupFile"
            Write-Status "Database backup created: backups/$BackupFile"
        }
        catch {
            Write-Warning "Database backup failed or no existing database found"
        }
    }
}

# Build and deploy
function Start-Deployment {
    Write-Status "Building and deploying application..."
    
    # Stop existing containers
    Write-Status "Stopping existing containers..."
    docker-compose down
    
    # Build new images
    Write-Status "Building new images..."
    docker-compose build --no-cache
    
    # Start services
    Write-Status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    Write-Status "Waiting for services to be healthy..."
    Start-Sleep -Seconds 30
    
    # Check health
    $services = docker-compose ps
    if ($services -match "Up \(healthy\)") {
        Write-Status "Services are healthy"
    }
    else {
        Write-Warning "Some services may not be healthy. Check logs with: docker-compose logs"
    }
}

# Run database migrations
function Start-Migrations {
    Write-Status "Running database migrations..."
    
    # Wait for database to be ready
    Start-Sleep -Seconds 10
    
    try {
        docker-compose exec backend npm run db:migrate:deploy
        Write-Status "Database migrations completed"
    }
    catch {
        Write-Error "Database migrations failed"
        exit 1
    }
}

# Seed database if it's a fresh deployment
function Initialize-Database {
    Write-Status "Checking if database needs seeding..."
    
    try {
        $result = docker-compose exec -T database psql -U postgres -d insurance_crm -c "SELECT COUNT(*) FROM settings;" 2>$null
        Write-Status "Database already has data, skipping seed"
    }
    catch {
        Write-Status "Seeding database with initial data..."
        docker-compose exec backend npm run db:seed
        Write-Status "Database seeded successfully"
    }
}

# Health check
function Test-Health {
    Write-Status "Performing health checks..."
    
    # Check backend health
    try {
        Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing | Out-Null
        Write-Status "Backend is healthy"
    }
    catch {
        Write-Error "Backend health check failed"
        exit 1
    }
    
    # Check frontend health
    try {
        Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing | Out-Null
        Write-Status "Frontend is healthy"
    }
    catch {
        Write-Error "Frontend health check failed"
        exit 1
    }
}

# Cleanup old images
function Remove-OldImages {
    Write-Status "Cleaning up old Docker images..."
    docker image prune -f
    Write-Status "Cleanup completed"
}

# Main deployment process
function Start-Main {
    Write-Host "🏁 Starting deployment process..." -ForegroundColor Green
    
    # Create backups directory if it doesn't exist
    if (-not (Test-Path "backups")) {
        New-Item -ItemType Directory -Path "backups" | Out-Null
    }
    
    Test-Dependencies
    Backup-Database
    Start-Deployment
    Start-Migrations
    Initialize-Database
    Test-Health
    Remove-OldImages
    
    Write-Status "🎉 Deployment completed successfully!"
    Write-Host ""
    Write-Host "📱 Application URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000"
    Write-Host "   Backend:  http://localhost:5000"
    Write-Host ""
    Write-Host "🔐 Default Login:" -ForegroundColor Cyan
    Write-Host "   Email:    agent@insurancecrm.com"
    Write-Host "   Password: admin123"
    Write-Host ""
    Write-Host "📊 Useful Commands:" -ForegroundColor Cyan
    Write-Host "   View logs:     docker-compose logs -f"
    Write-Host "   Stop services: docker-compose down"
    Write-Host "   Restart:       docker-compose restart"
}

# Run main function
Start-Main