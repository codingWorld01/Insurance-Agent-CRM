#!/bin/bash

# Insurance CRM Database Backup Script
set -e

echo "💾 Starting Insurance CRM Database Backup..."

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="insurance_crm_backup_$TIMESTAMP.sql"
KEEP_BACKUPS=7  # Number of backups to keep

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

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if Docker is available and database is running
if command -v docker-compose &> /dev/null && docker-compose ps database | grep -q "Up"; then
    print_status "Using Docker database for backup..."
    
    # Create backup using Docker
    if docker-compose exec -T database pg_dump -U postgres insurance_crm > "$BACKUP_DIR/$BACKUP_FILE"; then
        print_status "Database backup created: $BACKUP_DIR/$BACKUP_FILE"
    else
        print_error "Docker database backup failed"
        exit 1
    fi
    
elif command -v pg_dump &> /dev/null; then
    print_status "Using local PostgreSQL for backup..."
    
    # Load environment variables
    if [ -f "backend/.env" ]; then
        export $(grep -v '^#' backend/.env | xargs)
    fi
    
    # Extract database connection details from DATABASE_URL
    if [ -n "$DATABASE_URL" ]; then
        # Parse DATABASE_URL (postgresql://user:pass@host:port/db)
        DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)"
        
        if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
            DB_USER="${BASH_REMATCH[1]}"
            DB_PASS="${BASH_REMATCH[2]}"
            DB_HOST="${BASH_REMATCH[3]}"
            DB_PORT="${BASH_REMATCH[4]}"
            DB_NAME="${BASH_REMATCH[5]}"
            
            # Create backup using local pg_dump
            PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"
            
            if [ $? -eq 0 ]; then
                print_status "Database backup created: $BACKUP_DIR/$BACKUP_FILE"
            else
                print_error "Local database backup failed"
                exit 1
            fi
        else
            print_error "Invalid DATABASE_URL format"
            exit 1
        fi
    else
        print_error "DATABASE_URL not found in backend/.env"
        exit 1
    fi
    
else
    print_error "Neither Docker nor pg_dump is available"
    exit 1
fi

# Compress the backup
if command -v gzip &> /dev/null; then
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gz"
    print_status "Backup compressed: $BACKUP_DIR/$BACKUP_FILE"
fi

# Get backup file size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
print_status "Backup size: $BACKUP_SIZE"

# Clean up old backups
print_status "Cleaning up old backups (keeping last $KEEP_BACKUPS)..."

# Count current backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/insurance_crm_backup_*.sql* 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt "$KEEP_BACKUPS" ]; then
    # Remove oldest backups
    REMOVE_COUNT=$((BACKUP_COUNT - KEEP_BACKUPS))
    ls -1t "$BACKUP_DIR"/insurance_crm_backup_*.sql* | tail -n "$REMOVE_COUNT" | xargs rm -f
    print_status "Removed $REMOVE_COUNT old backup(s)"
else
    print_status "No old backups to remove"
fi

# Display backup information
echo ""
print_status "Backup completed successfully!"
echo "📁 Backup file: $BACKUP_DIR/$BACKUP_FILE"
echo "📊 Backup size: $BACKUP_SIZE"
echo "📅 Timestamp: $TIMESTAMP"
echo ""
echo "🔄 To restore this backup:"
echo "   Docker:  cat $BACKUP_DIR/$BACKUP_FILE | docker-compose exec -T database psql -U postgres -d insurance_crm"
echo "   Local:   psql -h host -U user -d insurance_crm < $BACKUP_DIR/$BACKUP_FILE"
echo ""

# List all available backups
echo "📋 Available backups:"
ls -lah "$BACKUP_DIR"/insurance_crm_backup_*.sql* 2>/dev/null | tail -n "$KEEP_BACKUPS" || echo "No backups found"