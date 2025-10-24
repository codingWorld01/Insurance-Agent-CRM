# Insurance CRM Development Setup Script (PowerShell)

Write-Host "🛠️  Setting up Insurance CRM Development Environment..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
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
    
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    }
    
    $nodeVersion = (node -v).Substring(1).Split('.')[0]
    if ([int]$nodeVersion -lt 18) {
        Write-Error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    }
    
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm is not installed"
        exit 1
    }
    
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-Warning "PostgreSQL client not found. Please install PostgreSQL."
    }
    
    Write-Status "All dependencies are available"
}

# Setup environment files
function Initialize-Environment {
    Write-Status "Setting up environment files..."
    
    # Backend environment
    if (-not (Test-Path "backend/.env")) {
        Copy-Item "backend/.env.example" "backend/.env"
        Write-Status "Created backend/.env from example"
        Write-Warning "Please update backend/.env with your database credentials"
    }
    else {
        Write-Info "backend/.env already exists"
    }
    
    # Frontend environment
    if (-not (Test-Path "frontend/.env.local")) {
        Copy-Item "frontend/.env.local.example" "frontend/.env.local"
        Write-Status "Created frontend/.env.local from example"
    }
    else {
        Write-Info "frontend/.env.local already exists"
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing backend dependencies..."
    Set-Location backend
    npm install
    Set-Location ..
    
    Write-Status "Installing frontend dependencies..."
    Set-Location frontend
    npm install
    Set-Location ..
    
    Write-Status "All dependencies installed"
}

# Setup database
function Initialize-Database {
    Write-Status "Setting up database..."
    
    Set-Location backend
    
    # Generate Prisma client
    Write-Info "Generating Prisma client..."
    npm run db:generate
    
    # Push schema to database
    Write-Info "Pushing database schema..."
    try {
        npm run db:push
        Write-Status "Database schema created"
    }
    catch {
        Write-Error "Failed to create database schema. Please check your database connection."
        Write-Info "Make sure PostgreSQL is running and update DATABASE_URL in backend/.env"
        exit 1
    }
    
    # Seed database
    Write-Info "Seeding database with sample data..."
    try {
        npm run db:seed
        Write-Status "Database seeded successfully"
    }
    catch {
        Write-Warning "Database seeding failed. You can run 'npm run db:seed' later."
    }
    
    Set-Location ..
}

# Setup development database with Docker (optional)
function Initialize-DevDatabase {
    if ((Get-Command docker -ErrorAction SilentlyContinue) -and (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        $useDocker = Read-Host "Docker detected. Would you like to use Docker for the development database? (y/n)"
        
        if ($useDocker -eq "y" -or $useDocker -eq "Y") {
            Write-Status "Starting development database with Docker..."
            docker-compose -f docker-compose.dev.yml up -d database
            
            # Wait for database to be ready
            Write-Info "Waiting for database to be ready..."
            Start-Sleep -Seconds 10
            
            # Update backend .env to use Docker database
            $envContent = Get-Content "backend/.env"
            $envContent = $envContent -replace 'DATABASE_URL=.*', 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/insurance_crm_dev"'
            $envContent | Set-Content "backend/.env"
            Write-Status "Updated backend/.env to use Docker database"
            
            return $true
        }
    }
    
    return $false
}

# Install Playwright browsers for E2E testing
function Initialize-Playwright {
    Write-Status "Setting up Playwright for E2E testing..."
    Set-Location frontend
    npm run test:e2e:install
    Set-Location ..
    Write-Status "Playwright browsers installed"
}

# Create necessary directories
function New-Directories {
    Write-Status "Creating necessary directories..."
    
    @("backups", "logs", "backend/uploads") | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
        }
    }
    
    Write-Status "Directories created"
}

# Display setup completion info
function Show-CompletionInfo {
    Write-Host ""
    Write-Host "🎉 Development environment setup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Update environment variables:"
    Write-Host "   - Edit backend/.env with your database credentials"
    Write-Host "   - Edit frontend/.env.local if needed"
    Write-Host ""
    Write-Host "2. Start the development servers:"
    Write-Host "   Backend:  cd backend && npm run dev"
    Write-Host "   Frontend: cd frontend && npm run dev"
    Write-Host ""
    Write-Host "3. Access the application:"
    Write-Host "   Frontend: http://localhost:3000"
    Write-Host "   Backend:  http://localhost:5000"
    Write-Host ""
    Write-Host "🔐 Default Login Credentials:" -ForegroundColor Cyan
    Write-Host "   Email:    agent@insurancecrm.com"
    Write-Host "   Password: admin123"
    Write-Host ""
    Write-Host "🧪 Testing Commands:" -ForegroundColor Cyan
    Write-Host "   Unit Tests:    cd frontend && npm test"
    Write-Host "   E2E Tests:     cd frontend && npm run test:e2e"
    Write-Host "   Backend Tests: cd backend && npm test"
    Write-Host ""
    Write-Host "🐳 Docker Commands (optional):" -ForegroundColor Cyan
    Write-Host "   Start dev DB:  docker-compose -f docker-compose.dev.yml up -d"
    Write-Host "   Stop dev DB:   docker-compose -f docker-compose.dev.yml down"
    Write-Host ""
    Write-Host "📚 Useful Commands:" -ForegroundColor Cyan
    Write-Host "   Database Studio: cd backend && npm run db:studio"
    Write-Host "   Reset Database:  cd backend && npm run db:reset"
}

# Main setup process
function Start-Main {
    Write-Host "🏁 Starting development environment setup..." -ForegroundColor Green
    
    Test-Dependencies
    New-Directories
    Initialize-Environment
    
    # Try to setup Docker database first, fallback to manual setup
    if (-not (Initialize-DevDatabase)) {
        Write-Info "Using manual database setup"
    }
    
    Install-Dependencies
    Initialize-Database
    Initialize-Playwright
    
    Show-CompletionInfo
}

# Run main function
Start-Main