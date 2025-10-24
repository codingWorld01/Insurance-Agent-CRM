# Deployment Guide

This guide covers the deployment process for the Insurance CRM MVP application.

## 🚀 Quick Deployment

### Using Docker (Recommended)

```bash
# Clone and setup
git clone <repository-url>
cd insurance-crm-mvp

# Deploy with Docker
make deploy
# or
docker-compose up --build -d
```

### Manual Deployment

```bash
# Setup development environment
make setup-dev

# Start development servers
make dev
```

## 📋 Pre-Deployment Checklist

### Environment Setup

- [ ] **Node.js 18+** installed
- [ ] **PostgreSQL 12+** installed and running
- [ ] **Docker & Docker Compose** installed (for containerized deployment)
- [ ] **Git** installed

### Configuration Files

- [ ] Copy and configure `backend/.env` from `backend/.env.example`
- [ ] Copy and configure `frontend/.env.local` from `frontend/.env.local.example`
- [ ] Update database connection string in `DATABASE_URL`
- [ ] Set secure `JWT_SECRET` for production
- [ ] Configure `CORS_ORIGIN` for your domain

### Security

- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS in production
- [ ] Review and update rate limiting settings

## 🌍 Environment Configurations

### Development Environment

```bash
# Backend (.env)
DATABASE_URL="postgresql://username:password@localhost:5432/insurance_crm"
JWT_SECRET="development-secret-key"
NODE_ENV=development
PORT=5000
CORS_ORIGIN="http://localhost:3000"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000
NODE_ENV=development
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### Production Environment

```bash
# Backend (.env.production)
DATABASE_URL="postgresql://username:password@production-host:5432/insurance_crm_prod"
JWT_SECRET="your-very-secure-production-jwt-secret"
NODE_ENV=production
PORT=5000
CORS_ORIGIN="https://your-domain.com"

# Frontend (.env.production)
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NODE_ENV=production
NEXT_PUBLIC_ENABLE_DEBUG=false
```

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development with Docker

```bash
# Start only database with Docker
docker-compose -f docker-compose.dev.yml up -d database

# Run backend and frontend locally
cd backend && npm run dev
cd frontend && npm run dev
```

## 🗄️ Database Setup

### Initial Setup

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:deploy

# Seed with sample data
npm run db:seed
```

### Database Migrations

```bash
# Development migrations
npm run db:migrate

# Production migrations
npm run db:migrate:deploy
```

### Database Backup & Restore

```bash
# Create backup
make backup
# or
./scripts/backup.sh

# Restore from backup
psql -h host -U user -d insurance_crm < backups/backup_file.sql
```

## 🔧 Build Process

### Manual Build

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Using Make

```bash
# Build both
make build

# Clean and rebuild
make clean && make build
```

## 🏥 Health Checks

### Application Health

```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend health
curl http://localhost:3000/api/health

# Using make
make health
```

### Expected Health Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0",
  "database": "connected"
}
```

## 🚨 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check PostgreSQL status
systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Test connection
psql -h localhost -U username -d insurance_crm
```

**Port Already in Use**
```bash
# Find process using port
lsof -ti:5000  # Backend port
lsof -ti:3000  # Frontend port

# Kill process
kill -9 $(lsof -ti:5000)
```

**Docker Issues**
```bash
# Check Docker status
docker --version
docker-compose --version

# View container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database

# Restart services
docker-compose restart
```

**Build Errors**
```bash
# Clear caches
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
```

### Log Locations

- **Backend logs**: `logs/backend.log`
- **Frontend logs**: Browser console / Next.js output
- **Database logs**: PostgreSQL logs directory
- **Docker logs**: `docker-compose logs`

## 📊 Monitoring

### Application Metrics

- **Health endpoints**: `/health`, `/ready`
- **Performance**: Response times, memory usage
- **Database**: Connection pool, query performance
- **Errors**: Error rates, exception tracking

### Recommended Monitoring

- **Uptime monitoring**: Ping health endpoints
- **Log aggregation**: Centralized logging
- **Performance monitoring**: APM tools
- **Database monitoring**: Query performance

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Insurance CRM

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd frontend && npm ci
          
      - name: Run tests
        run: |
          cd backend && npm test
          cd frontend && npm test
          
      - name: Build application
        run: |
          cd backend && npm run build
          cd frontend && npm run build
          
      - name: Deploy with Docker
        run: docker-compose up --build -d
```

## 🔐 Security Checklist

### Pre-Production Security

- [ ] Change all default passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Regular dependency updates
- [ ] Database connection encryption
- [ ] Input validation and sanitization
- [ ] Error handling (no sensitive data in errors)

### Production Security

- [ ] Regular security audits
- [ ] Monitor for vulnerabilities
- [ ] Backup encryption
- [ ] Access logging
- [ ] Firewall configuration
- [ ] Regular password rotation
- [ ] Security incident response plan

## 📞 Support

### Getting Help

1. **Check logs** for error messages
2. **Review configuration** files
3. **Test connectivity** to database and services
4. **Check resource usage** (CPU, memory, disk)
5. **Verify environment variables** are set correctly

### Useful Commands

```bash
# Application status
make status

# View logs
make logs

# Restart services
make restart

# Health check
make health

# Create backup
make backup

# Reset database (development only)
make db-reset
```

For additional support, please check the main [README.md](README.md) file or open an issue in the repository.