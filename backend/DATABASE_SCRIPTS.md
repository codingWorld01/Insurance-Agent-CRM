# Database Management Scripts

This document describes the available scripts for managing the database and dummy data.

## Available Scripts

### Database Reset and Seeding

#### Full Reset with Comprehensive Dummy Data
```bash
npm run db:reset-and-seed
```
- Clears all existing data (except settings)
- Creates comprehensive dummy data including:
  - 25 leads with various statuses and priorities
  - 50 clients with realistic information
  - 65 policy templates across different types and providers
  - 125 policy instances (client-specific policies)
  - 15 old format policies (for migration testing)
  - 100 activity records

#### Quick Seed (Minimal Data)
```bash
npm run db:quick-seed
```
- Adds minimal sample data without clearing existing data
- Creates essential data for testing:
  - 3 sample clients
  - 3 policy templates
  - 2 sample leads
  - Basic activity records

### Policy Migration Scripts

#### Migration Status and Validation
```bash
npm run migrate:policies:status      # Check current migration status
npm run migrate:policies:validate    # Validate data before migration
```

#### Migration Process
```bash
npm run migrate:policies:backup      # Create backup before migration
npm run migrate:policies:dry-run     # Test migration without changes
npm run migrate:policies:run         # Run actual migration
npm run migrate:policies:verify      # Verify migration integrity
npm run migrate:policies:cleanup     # Remove old policies after migration
```

#### Migration Rollback
```bash
npm run migrate:policies rollback <backup-id>
```

### Standard Prisma Scripts

```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes to database
npm run db:migrate       # Create and run migrations
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (Prisma default)
```

## Login Credentials

After running any seeding script, you can log in with:
- **Email**: demo@insurance.com
- **Password**: Amit@123

## Data Structure

### Generated Dummy Data Includes:

#### Leads (25 records)
- Realistic names and contact information
- Various insurance interests (Auto, Home, Life, etc.)
- Different statuses: New, Contacted, Qualified, Converted, Lost
- Priorities: Hot, Warm, Cold
- Random creation dates throughout 2024

#### Clients (50 records)
- Full contact information including addresses
- Ages ranging from 24-74 years
- Realistic email addresses and phone numbers
- Creation dates spread across 2024

#### Policy Templates (65 records)
- 8 different policy types (Auto, Home, Life, Health, etc.)
- 12 different insurance providers
- Unique policy numbers (POL-0001, POL-0002, etc.)
- Descriptive information for each template

#### Policy Instances (125 records)
- Each client has 1-4 policy instances
- Premium amounts ranging from $500-$5,000
- Commission amounts (5-15% of premium)
- Various statuses: Active, Expired, Cancelled
- 1-year policy terms with realistic start/end dates

#### Old Format Policies (15 records)
- Legacy policy format for migration testing
- Policy numbers: OLD-0001, OLD-0002, etc.
- Mixed statuses and realistic amounts
- Linked to existing clients

#### Activities (100 records)
- Various action types (Lead Created, Policy Updated, etc.)
- Spread across the past year
- Realistic descriptions for each activity

## Migration Testing

The dummy data includes both new format (PolicyTemplate/PolicyInstance) and old format (Policy) records, making it perfect for testing the migration utilities:

1. **Test Migration**: Use the old format policies to test migration to the new system
2. **Test Compatibility**: The compatibility service can handle both formats
3. **Test Rollback**: Backup and rollback functionality can be tested safely

## Customization

To modify the dummy data:

1. Edit `backend/src/scripts/resetAndSeedDatabase.ts` for comprehensive data
2. Edit `backend/src/scripts/quickSeed.ts` for minimal sample data
3. Adjust the data arrays (names, providers, etc.) to match your needs
4. Modify the quantity of records generated in each category

## Troubleshooting

### Database Connection Issues
- Ensure your `DATABASE_URL` is correctly set in `.env`
- Verify PostgreSQL is running
- Check database credentials and permissions

### Script Execution Issues
- Run `npm install` to ensure all dependencies are installed
- Verify TypeScript compilation with `npm run build`
- Check for any schema changes that need migration

### Data Conflicts
- Use `npm run db:reset-and-seed` to completely reset and repopulate
- Check for unique constraint violations in existing data
- Ensure email addresses and policy numbers are unique

## Best Practices

1. **Always backup** before running migration scripts in production
2. **Test migrations** using the dry-run option first
3. **Verify data integrity** after any major database operations
4. **Use appropriate scripts** for your environment (full reset vs. quick seed)
5. **Monitor logs** during script execution for any errors or warnings