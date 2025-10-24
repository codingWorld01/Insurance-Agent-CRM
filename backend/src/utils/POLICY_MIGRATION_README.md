# Policy Migration Utilities

This document describes the utilities and processes for migrating from the old Policy system to the new PolicyTemplate/PolicyInstance system.

## Overview

The migration transforms the existing single-table Policy model into a two-table system:
- **PolicyTemplate**: Master policy information (policy number, type, provider, description)
- **PolicyInstance**: Client-specific policy details (premium, commission, dates, status)

This separation allows multiple clients to share the same policy template while maintaining individual policy details.

## Migration Components

### 1. Core Migration Utilities (`policyMigration.ts`)

#### Functions:
- `validatePolicyData()`: Validates existing data before migration
- `migratePolicies()`: Performs the actual migration
- `rollbackMigration()`: Rolls back using backup data
- `verifyMigrationIntegrity()`: Verifies data integrity after migration
- `cleanupOldPolicies()`: Removes old Policy records after successful migration
- `createPolicyBackup()`: Creates backup tables

#### Usage:
```typescript
import { migratePolicies, validatePolicyData } from './utils/policyMigration';

// Validate before migration
const validation = await validatePolicyData();
if (!validation.isValid) {
  console.error('Data validation failed:', validation.errors);
  return;
}

// Run migration
const result = await migratePolicies({
  dryRun: false,
  batchSize: 100,
  skipDuplicates: true,
  createBackup: true
});
```

### 2. CLI Migration Tool (`scripts/migratePolicies.ts`)

A comprehensive command-line tool for managing the migration process.

#### Commands:

##### Validation
```bash
npm run migrate:policies:validate
```
Validates existing policy data and reports any issues that need to be fixed before migration.

##### Backup
```bash
npm run migrate:policies:backup
```
Creates a backup of existing policy data. Returns a backup ID for potential rollback.

##### Dry Run
```bash
npm run migrate:policies:dry-run
```
Simulates the migration without making any changes. Shows what would be migrated.

##### Migration
```bash
npm run migrate:policies:run
```
Performs the actual migration. Creates backup automatically unless `--no-backup` is specified.

Options:
- `--dry-run`: Simulate without changes
- `--batch-size <size>`: Number of policies per batch (default: 100)
- `--skip-duplicates`: Skip duplicate templates/instances (default: true)
- `--no-backup`: Skip backup creation

##### Verification
```bash
npm run migrate:policies:verify
```
Runs integrity checks after migration to ensure data consistency.

##### Status Check
```bash
npm run migrate:policies:status
```
Shows current migration status and record counts.

##### Rollback
```bash
npm run migrate:policies rollback <backup-id>
```
Rolls back migration using the specified backup ID.

##### Cleanup
```bash
npm run migrate:policies:cleanup
```
Removes old Policy records after successful migration and verification.

### 3. Backward Compatibility Service (`policyCompatibilityService.ts`)

Provides a unified interface that works with both old and new policy systems during transition.

#### Features:
- **Unified API**: Single interface for both systems
- **Automatic Fallback**: Falls back to old system if new system has no data
- **Migration on Read**: Optionally migrates data when accessed
- **Flexible Configuration**: Different modes for different migration phases

#### Usage:
```typescript
import { PolicyCompatibilityService } from './services/policyCompatibilityService';

const service = new PolicyCompatibilityService({
  useTemplateSystem: true,
  allowFallback: true,
  migrateOnRead: false
});

// Get policies for a client (works with both systems)
const policies = await service.getClientPolicies(clientId);

// Create new policy (uses appropriate system)
const newPolicy = await service.createPolicy({
  policyNumber: 'POL-001',
  policyType: 'Life',
  provider: 'ABC Insurance',
  // ... other fields
});
```

### 4. Configuration Management (`config/policyMigrationConfig.ts`)

Manages different configuration phases for the migration process.

#### Migration Phases:

1. **Preparation**: Old system only, validation enabled
2. **Migration**: Hybrid mode with fallback
3. **Transition**: Template system with auto-migration
4. **Complete**: Template system only

#### Environment Variables:
- `POLICY_MIGRATION_PHASE`: Sets the migration phase
- `USE_TEMPLATE_SYSTEM`: Enable/disable template system
- `ALLOW_FALLBACK`: Enable/disable fallback to old system
- `MIGRATE_ON_READ`: Enable/disable automatic migration on read

### 5. Data Integrity Checker (`policyDataIntegrity.ts`)

Comprehensive data integrity validation for both systems.

#### Checks Performed:
- Policy number uniqueness
- Template-instance consistency
- Client reference validity
- Date consistency (start < expiry)
- Amount validation (non-negative)
- Status consistency
- Duplicate instance detection
- Orphaned record detection
- Data type consistency
- Business rule compliance

#### Usage:
```typescript
import { PolicyDataIntegrityChecker } from './utils/policyDataIntegrity';

const checker = new PolicyDataIntegrityChecker();
const report = await checker.runAllChecks();

console.log(`Overall Status: ${report.overallStatus}`);
console.log(`Errors: ${report.summary.errors}`);
console.log(`Warnings: ${report.summary.warnings}`);
```

## Migration Process

### Step-by-Step Migration Guide

#### 1. Pre-Migration
```bash
# Check current status
npm run migrate:policies:status

# Validate existing data
npm run migrate:policies:validate

# Fix any validation errors before proceeding
```

#### 2. Backup and Dry Run
```bash
# Create backup
npm run migrate:policies:backup

# Test migration with dry run
npm run migrate:policies:dry-run
```

#### 3. Migration
```bash
# Run actual migration
npm run migrate:policies:run

# Verify integrity
npm run migrate:policies:verify
```

#### 4. Testing Phase
- Test application with hybrid mode
- Verify all functionality works
- Monitor for any issues

#### 5. Cleanup (Optional)
```bash
# Remove old Policy records after successful testing
npm run migrate:policies:cleanup
```

### Rollback Process

If issues are discovered after migration:

```bash
# Rollback using backup ID from migration
npm run migrate:policies rollback policy_backup_1234567890

# Verify rollback
npm run migrate:policies:status
```

## Configuration Examples

### Development Environment
```env
POLICY_MIGRATION_PHASE=migration
USE_TEMPLATE_SYSTEM=true
ALLOW_FALLBACK=true
MIGRATE_ON_READ=false
```

### Production Migration
```env
POLICY_MIGRATION_PHASE=transition
USE_TEMPLATE_SYSTEM=true
ALLOW_FALLBACK=true
MIGRATE_ON_READ=true
MIGRATION_BATCH_SIZE=50
```

### Post-Migration
```env
POLICY_MIGRATION_PHASE=complete
USE_TEMPLATE_SYSTEM=true
ALLOW_FALLBACK=false
MIGRATE_ON_READ=false
```

## Error Handling

### Common Issues and Solutions

#### 1. Duplicate Policy Numbers
**Issue**: Multiple policies with the same policy number
**Solution**: Review and consolidate or create separate templates

#### 2. Missing Client References
**Issue**: Policies reference non-existent clients
**Solution**: Clean up orphaned policies or restore missing clients

#### 3. Invalid Date Ranges
**Issue**: Start date after expiry date
**Solution**: Correct the dates before migration

#### 4. Negative Amounts
**Issue**: Negative premium or commission amounts
**Solution**: Review and correct the amounts

### Recovery Procedures

#### If Migration Fails Mid-Process
1. Check the error logs for specific issues
2. Fix the underlying data problems
3. Use rollback if necessary: `npm run migrate:policies rollback <backup-id>`
4. Re-run validation and migration

#### If Data Integrity Issues Found
1. Run detailed integrity check: `npm run migrate:policies:verify`
2. Review specific issues in the report
3. Fix issues manually or rollback and fix source data
4. Re-run migration if needed

## Monitoring and Logging

### Log Locations
- Migration logs: Console output with timestamps
- Error details: Included in migration results
- Backup information: Returned with backup IDs

### Key Metrics to Monitor
- Number of templates created
- Number of instances created
- Number of policies migrated
- Error count and types
- Processing time per batch

## Best Practices

### Before Migration
1. Always run validation first
2. Create backups before any changes
3. Test with dry run
4. Plan for rollback if needed
5. Communicate with users about potential downtime

### During Migration
1. Monitor progress and logs
2. Be prepared to stop and rollback if issues arise
3. Keep backup IDs safe for potential rollback

### After Migration
1. Run integrity verification
2. Test all application functionality
3. Monitor system performance
4. Keep backups until confident in migration success
5. Plan cleanup of old data

### Production Considerations
1. Schedule migration during low-usage periods
2. Use smaller batch sizes for large datasets
3. Consider gradual migration with compatibility mode
4. Have rollback plan ready
5. Test thoroughly in staging environment first

## Troubleshooting

### Common CLI Issues

#### Permission Errors
```bash
# Ensure proper database permissions
# Check DATABASE_URL environment variable
```

#### Memory Issues with Large Datasets
```bash
# Reduce batch size
npm run migrate:policies:run --batch-size 50
```

#### Timeout Issues
```bash
# Increase database connection timeout
# Process in smaller batches
```

### Data Issues

#### Template Creation Failures
- Check for unique constraint violations
- Verify policy number format
- Ensure required fields are present

#### Instance Creation Failures
- Verify client references exist
- Check for duplicate client-template combinations
- Validate date ranges and amounts

## Support

For issues with the migration utilities:

1. Check this documentation
2. Review error logs and messages
3. Run integrity checks for detailed diagnostics
4. Use dry run mode to test changes safely
5. Keep backup IDs for rollback capability

Remember: Always test in a non-production environment first!