#!/usr/bin/env ts-node

import { Command } from 'commander';
import {
  validatePolicyData,
  migratePolicies,
  rollbackMigration,
  verifyMigrationIntegrity,
  cleanupOldPolicies,
  createPolicyBackup,
  MigrationOptions
} from '../utils/policyMigration';
import { logger } from '../utils/logger';

const program = new Command();

program
  .name('migrate-policies')
  .description('Migrate existing Policy records to PolicyTemplate and PolicyInstance system')
  .version('1.0.0');

program
  .command('validate')
  .description('Validate existing policy data before migration')
  .action(async () => {
    try {
      console.log('🔍 Validating policy data...\n');
      
      const result = await validatePolicyData();
      
      console.log(`📊 Validation Results:`);
      console.log(`   Total Policies: ${result.totalPolicies}`);
      console.log(`   Unique Templates: ${result.uniqueTemplates}`);
      console.log(`   Valid: ${result.isValid ? '✅' : '❌'}\n`);
      
      if (result.errors.length > 0) {
        console.log('❌ Errors:');
        result.errors.forEach(error => console.log(`   - ${error}`));
        console.log();
      }
      
      if (result.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
        console.log();
      }
      
      if (result.isValid) {
        console.log('✅ Data is ready for migration!');
      } else {
        console.log('❌ Please fix the errors before proceeding with migration.');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

program
  .command('backup')
  .description('Create a backup of existing policy data')
  .action(async () => {
    try {
      console.log('💾 Creating policy backup...\n');
      
      const result = await createPolicyBackup();
      
      if (result.success) {
        console.log(`✅ Backup created successfully!`);
        console.log(`   Backup ID: ${result.backupId}`);
        console.log(`   Save this ID for potential rollback operations.`);
      } else {
        console.log(`❌ Backup failed: ${result.error}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      process.exit(1);
    }
  });

program
  .command('migrate')
  .description('Migrate policies to template system')
  .option('--dry-run', 'Perform a dry run without making changes', false)
  .option('--batch-size <size>', 'Number of policies to process in each batch', '100')
  .option('--skip-duplicates', 'Skip duplicate templates/instances', true)
  .option('--no-backup', 'Skip creating backup before migration', false)
  .action(async (options) => {
    try {
      const migrationOptions: MigrationOptions = {
        dryRun: options.dryRun,
        batchSize: parseInt(options.batchSize),
        skipDuplicates: options.skipDuplicates,
        createBackup: !options.noBackup
      };
      
      console.log('🚀 Starting policy migration...\n');
      console.log(`   Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
      console.log(`   Batch Size: ${migrationOptions.batchSize}`);
      console.log(`   Skip Duplicates: ${migrationOptions.skipDuplicates}`);
      console.log(`   Create Backup: ${migrationOptions.createBackup}\n`);
      
      if (!options.dryRun) {
        console.log('⚠️  This will modify your database. Make sure you have a backup!');
        console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      const result = await migratePolicies(migrationOptions);
      
      console.log(`📊 Migration Results:`);
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   Templates Created: ${result.templatesCreated}`);
      console.log(`   Instances Created: ${result.instancesCreated}`);
      console.log(`   Policies Migrated: ${result.policiesMigrated}`);
      console.log(`   Duplicate Templates: ${result.duplicateTemplates}`);
      console.log(`   Skipped Policies: ${result.skippedPolicies}`);
      console.log(`   Errors: ${result.errors.length}\n`);
      
      if (result.errors.length > 0) {
        console.log('❌ Errors encountered:');
        result.errors.forEach(error => console.log(`   - ${error}`));
        console.log();
      }
      
      if (result.success) {
        console.log('✅ Migration completed successfully!');
        if (!options.dryRun) {
          console.log('   Run "verify" command to check data integrity.');
        }
      } else {
        console.log('❌ Migration failed. Check errors above.');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify data integrity after migration')
  .action(async () => {
    try {
      console.log('🔍 Verifying migration integrity...\n');
      
      const result = await verifyMigrationIntegrity();
      
      console.log(`📊 Integrity Check Results:`);
      console.log(`   Overall: ${result.success ? '✅ PASSED' : '❌ FAILED'}\n`);
      
      result.checks.forEach(check => {
        const status = check.passed ? '✅' : '❌';
        console.log(`   ${status} ${check.name}: ${check.details}`);
      });
      
      console.log();
      
      if (result.success) {
        console.log('✅ All integrity checks passed!');
      } else {
        console.log('❌ Some integrity checks failed. Review the results above.');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    }
  });

program
  .command('rollback <backup-id>')
  .description('Rollback migration using backup')
  .action(async (backupId: string) => {
    try {
      console.log(`🔄 Rolling back migration from backup: ${backupId}...\n`);
      
      console.log('⚠️  This will delete all PolicyTemplate and PolicyInstance records!');
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const result = await rollbackMigration(backupId);
      
      if (result.success) {
        console.log('✅ Rollback completed successfully!');
        console.log('   Original Policy records have been restored.');
      } else {
        console.log(`❌ Rollback failed: ${result.error}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      process.exit(1);
    }
  });

program
  .command('cleanup')
  .description('Clean up old Policy records after successful migration')
  .option('--no-backup', 'Skip creating final backup before cleanup', false)
  .action(async (options) => {
    try {
      console.log('🧹 Cleaning up old policy records...\n');
      
      console.log('⚠️  This will permanently delete all old Policy records!');
      console.log('   Make sure migration was successful and verified.');
      console.log('   Press Ctrl+C to cancel, or wait 10 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const result = await cleanupOldPolicies({
        createFinalBackup: !options.noBackup
      });
      
      if (result.success) {
        console.log('✅ Cleanup completed successfully!');
        console.log(`   Deleted ${result.deletedCount} old policy records.`);
        if (result.backupId) {
          console.log(`   Final backup created: ${result.backupId}`);
        }
      } else {
        console.log(`❌ Cleanup failed: ${result.error}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show current migration status')
  .action(async () => {
    try {
      console.log('📊 Migration Status:\n');
      
      const { prisma } = await import('../utils/db');
      const [policyCount, templateCount, instanceCount] = await Promise.all([
        prisma.policy.count(),
        prisma.policyTemplate.count(),
        prisma.policyInstance.count()
      ]);
      
      console.log(`   Old Policy Records: ${policyCount}`);
      console.log(`   Policy Templates: ${templateCount}`);
      console.log(`   Policy Instances: ${instanceCount}\n`);
      
      if (policyCount > 0 && templateCount === 0 && instanceCount === 0) {
        console.log('📋 Status: Ready for migration');
        console.log('   Run "validate" command to check data quality.');
      } else if (policyCount > 0 && (templateCount > 0 || instanceCount > 0)) {
        console.log('⚠️  Status: Partial migration detected');
        console.log('   Both old and new records exist. Consider cleanup or rollback.');
      } else if (policyCount === 0 && templateCount > 0 && instanceCount > 0) {
        console.log('✅ Status: Migration completed');
        console.log('   Old records cleaned up, new system active.');
      } else if (templateCount > 0 && instanceCount > 0) {
        console.log('✅ Status: Migration completed (old records still present)');
        console.log('   Run "cleanup" command to remove old records.');
      } else {
        console.log('❓ Status: Unknown state');
        console.log('   No policy data found in either system.');
      }
      
    } catch (error) {
      console.error('❌ Status check failed:', error);
      process.exit(1);
    }
  });

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

program.parse(process.argv);