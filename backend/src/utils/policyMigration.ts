import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export interface MigrationResult {
  success: boolean;
  templatesCreated: number;
  instancesCreated: number;
  policiesMigrated: number;
  errors: string[];
  duplicateTemplates: number;
  skippedPolicies: number;
}

export interface MigrationOptions {
  dryRun?: boolean;
  batchSize?: number;
  skipDuplicates?: boolean;
  createBackup?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalPolicies: number;
  uniqueTemplates: number;
}

/**
 * Validates existing Policy data before migration
 */
export async function validatePolicyData(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    totalPolicies: 0,
    uniqueTemplates: 0
  };

  try {
    // Count total policies
    result.totalPolicies = await prisma.policy.count();
    
    if (result.totalPolicies === 0) {
      result.warnings.push('No policies found to migrate');
      return result;
    }

    // Check for policies with missing required data
    const policiesWithMissingData = await prisma.policy.findMany({
      where: {
        OR: [
          { policyNumber: '' },
          { policyType: '' },
          { provider: '' },
          { clientId: '' }
        ]
      },
      select: { id: true, policyNumber: true }
    });

    if (policiesWithMissingData.length > 0) {
      result.errors.push(`${policiesWithMissingData.length} policies have missing required data`);
      result.isValid = false;
    }

    // Check for duplicate policy numbers
    const duplicatePolicyNumbers = await prisma.policy.groupBy({
      by: ['policyNumber'],
      having: {
        policyNumber: {
          _count: {
            gt: 1
          }
        }
      },
      _count: {
        policyNumber: true
      }
    });

    if (duplicatePolicyNumbers.length > 0) {
      result.warnings.push(`${duplicatePolicyNumbers.length} duplicate policy numbers found - will create separate templates`);
    }

    // Count unique templates that will be created
    const uniqueTemplates = await prisma.policy.groupBy({
      by: ['policyNumber', 'policyType', 'provider'],
      _count: {
        id: true
      }
    });

    result.uniqueTemplates = uniqueTemplates.length;

    // Check for orphaned policies (clients that don't exist)
    // Check for orphaned policies using raw query to avoid type issues
    const orphanedPoliciesCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Policy" p 
      WHERE NOT EXISTS (SELECT 1 FROM "Client" c WHERE c.id = p."clientId")
    `;
    const orphanedPolicies = Number(orphanedPoliciesCount[0].count);

    if (orphanedPolicies > 0) {
      result.errors.push(`${orphanedPolicies} policies reference non-existent clients`);
      result.isValid = false;
    }

    // Check for invalid dates
    const invalidDatePolicies = await prisma.policy.findMany({
      where: {
        startDate: {
          gt: new Date()
        }
      },
      select: { id: true, policyNumber: true, startDate: true }
    });

    if (invalidDatePolicies.length > 0) {
      result.warnings.push(`${invalidDatePolicies.length} policies have future start dates`);
    }

    // Check for negative amounts
    const invalidAmountPolicies = await prisma.policy.findMany({
      where: {
        OR: [
          { premiumAmount: { lt: 0 } },
          { commissionAmount: { lt: 0 } }
        ]
      },
      select: { id: true, policyNumber: true }
    });

    if (invalidAmountPolicies.length > 0) {
      result.warnings.push(`${invalidAmountPolicies.length} policies have negative amounts`);
    }

  } catch (error) {
    result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.isValid = false;
  }

  return result;
}

/**
 * Creates a backup of existing Policy data
 */
export async function createPolicyBackup(): Promise<{ success: boolean; backupId: string; error?: string }> {
  try {
    const backupId = `policy_backup_${Date.now()}`;
    
    // Create backup table
    await prisma.$executeRaw`
      CREATE TABLE ${backupId} AS 
      SELECT * FROM "Policy"
    `;

    logger.info(`Policy backup created with ID: ${backupId}`);
    
    return { success: true, backupId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create policy backup:', errorMessage);
    return { success: false, backupId: '', error: errorMessage };
  }
}

/**
 * Migrates existing Policy records to PolicyTemplate and PolicyInstance system
 */
export async function migratePolicies(options: MigrationOptions = {}): Promise<MigrationResult> {
  const {
    dryRun = false,
    batchSize = 100,
    skipDuplicates = true,
    createBackup = true
  } = options;

  const result: MigrationResult = {
    success: false,
    templatesCreated: 0,
    instancesCreated: 0,
    policiesMigrated: 0,
    errors: [],
    duplicateTemplates: 0,
    skippedPolicies: 0
  };

  try {
    logger.info(`Starting policy migration (dryRun: ${dryRun})`);

    // Validate data first
    const validation = await validatePolicyData();
    if (!validation.isValid) {
      result.errors.push(...validation.errors);
      return result;
    }

    // Create backup if requested and not dry run
    if (createBackup && !dryRun) {
      const backup = await createPolicyBackup();
      if (!backup.success) {
        result.errors.push(`Backup failed: ${backup.error}`);
        return result;
      }
      logger.info(`Backup created: ${backup.backupId}`);
    }

    // Get all policies in batches
    let offset = 0;
    let hasMore = true;
    const templateMap = new Map<string, string>(); // key: policyNumber-policyType-provider, value: templateId

    while (hasMore) {
      const policies = await prisma.policy.findMany({
        skip: offset,
        take: batchSize,
        orderBy: { createdAt: 'asc' },
        include: {
          client: true
        }
      });

      if (policies.length === 0) {
        hasMore = false;
        break;
      }

      for (const policy of policies) {
        try {
          // Skip policies with missing clients
          if (!policy.client) {
            result.skippedPolicies++;
            result.errors.push(`Skipped policy ${policy.policyNumber}: Client not found`);
            continue;
          }

          // Create template key
          const templateKey = `${policy.policyNumber}-${policy.policyType}-${policy.provider}`;
          let templateId = templateMap.get(templateKey);

          // Create or find policy template
          if (!templateId) {
            if (!dryRun) {
              // Check if template already exists
              const existingTemplate = await prisma.policyTemplate.findFirst({
                where: {
                  policyNumber: policy.policyNumber,
                  policyType: policy.policyType,
                  provider: policy.provider
                }
              });

              if (existingTemplate) {
                if (skipDuplicates) {
                  templateId = existingTemplate.id;
                  templateMap.set(templateKey, templateId);
                  result.duplicateTemplates++;
                } else {
                  result.skippedPolicies++;
                  result.errors.push(`Template already exists for policy ${policy.policyNumber}`);
                  continue;
                }
              } else {
                // Create new template
                const newTemplate = await prisma.policyTemplate.create({
                  data: {
                    policyNumber: policy.policyNumber,
                    policyType: policy.policyType,
                    provider: policy.provider,
                    description: `Migrated from policy ${policy.policyNumber}`,
                    createdAt: policy.createdAt,
                    updatedAt: policy.updatedAt
                  }
                });
                templateId = newTemplate.id;
                templateMap.set(templateKey, templateId);
                result.templatesCreated++;
              }
            } else {
              // Dry run - simulate template creation
              templateId = `template-${templateKey}`;
              templateMap.set(templateKey, templateId);
              result.templatesCreated++;
            }
          }

          // Create policy instance
          if (!dryRun && templateId) {
            // Check if instance already exists
            const existingInstance = await prisma.policyInstance.findFirst({
              where: {
                policyTemplateId: templateId,
                clientId: policy.clientId
              }
            });

            if (existingInstance) {
              if (skipDuplicates) {
                result.duplicateTemplates++;
              } else {
                result.skippedPolicies++;
                result.errors.push(`Instance already exists for client ${policy.client.name} and policy ${policy.policyNumber}`);
                continue;
              }
            } else {
              await prisma.policyInstance.create({
                data: {
                  policyTemplateId: templateId,
                  clientId: policy.clientId,
                  premiumAmount: policy.premiumAmount,
                  status: policy.status,
                  startDate: policy.startDate,
                  expiryDate: policy.expiryDate,
                  commissionAmount: policy.commissionAmount,
                  createdAt: policy.createdAt,
                  updatedAt: policy.updatedAt
                }
              });
              result.instancesCreated++;
            }
          } else if (dryRun) {
            result.instancesCreated++;
          }

          result.policiesMigrated++;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to migrate policy ${policy.policyNumber}: ${errorMessage}`);
          logger.error(`Migration error for policy ${policy.policyNumber}:`, errorMessage);
        }
      }

      offset += batchSize;
      logger.info(`Processed ${offset} policies...`);
    }

    result.success = result.errors.length === 0 || result.policiesMigrated > 0;
    
    logger.info(`Migration completed. Templates: ${result.templatesCreated}, Instances: ${result.instancesCreated}, Errors: ${result.errors.length}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Migration failed: ${errorMessage}`);
    logger.error('Policy migration failed:', errorMessage);
  }

  return result;
}

/**
 * Rolls back migration by restoring from backup
 */
export async function rollbackMigration(backupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info(`Starting rollback from backup: ${backupId}`);

    // Check if backup exists
    const backupExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = ${backupId}
      )
    `;

    if (!backupExists) {
      return { success: false, error: `Backup table ${backupId} not found` };
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Delete all policy instances
      await tx.policyInstance.deleteMany({});
      
      // Delete all policy templates
      await tx.policyTemplate.deleteMany({});
      
      // Restore policies from backup
      await tx.$executeRaw`
        INSERT INTO "Policy" 
        SELECT * FROM ${backupId}
      `;
    });

    logger.info(`Rollback completed successfully`);
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Rollback failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Verifies data integrity after migration
 */
export async function verifyMigrationIntegrity(): Promise<{
  success: boolean;
  checks: Array<{ name: string; passed: boolean; details: string }>;
}> {
  const checks: Array<{ name: string; passed: boolean; details: string }> = [];

  try {
    // Check 1: All policies have corresponding instances
    const policyCount = await prisma.policy.count();
    const instanceCount = await prisma.policyInstance.count();
    
    checks.push({
      name: 'Policy to Instance Count Match',
      passed: policyCount === instanceCount,
      details: `Policies: ${policyCount}, Instances: ${instanceCount}`
    });

    // Check 2: No orphaned instances using raw query
    const orphanedInstancesResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "PolicyInstance" pi 
      WHERE NOT EXISTS (SELECT 1 FROM "PolicyTemplate" pt WHERE pt.id = pi."policyTemplateId")
         OR NOT EXISTS (SELECT 1 FROM "Client" c WHERE c.id = pi."clientId")
    `;
    const orphanedInstances = Number(orphanedInstancesResult[0].count);

    checks.push({
      name: 'No Orphaned Instances',
      passed: orphanedInstances === 0,
      details: `Orphaned instances: ${orphanedInstances}`
    });

    // Check 3: Template uniqueness
    const duplicateTemplates = await prisma.policyTemplate.groupBy({
      by: ['policyNumber', 'policyType', 'provider'],
      having: {
        policyNumber: {
          _count: {
            gt: 1
          }
        }
      }
    });

    checks.push({
      name: 'Template Uniqueness',
      passed: duplicateTemplates.length === 0,
      details: `Duplicate templates: ${duplicateTemplates.length}`
    });

    // Check 4: Instance uniqueness per client-template
    const duplicateInstances = await prisma.policyInstance.groupBy({
      by: ['policyTemplateId', 'clientId'],
      having: {
        policyTemplateId: {
          _count: {
            gt: 1
          }
        }
      }
    });

    checks.push({
      name: 'Instance Uniqueness',
      passed: duplicateInstances.length === 0,
      details: `Duplicate instances: ${duplicateInstances.length}`
    });

    // Check 5: Data consistency (amounts, dates)
    const invalidInstances = await prisma.policyInstance.count({
      where: {
        OR: [
          { premiumAmount: { lt: 0 } },
          { commissionAmount: { lt: 0 } },
          { startDate: { gt: new Date() } }
        ]
      }
    });

    checks.push({
      name: 'Data Consistency',
      passed: invalidInstances === 0,
      details: `Invalid instances: ${invalidInstances}`
    });

    const allPassed = checks.every(check => check.passed);

    return {
      success: allPassed,
      checks
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    checks.push({
      name: 'Verification Process',
      passed: false,
      details: `Verification failed: ${errorMessage}`
    });

    return {
      success: false,
      checks
    };
  }
}

/**
 * Cleans up old Policy records after successful migration
 */
export async function cleanupOldPolicies(options: { createFinalBackup?: boolean } = {}): Promise<{
  success: boolean;
  deletedCount: number;
  backupId?: string;
  error?: string;
}> {
  const { createFinalBackup = true } = options;

  try {
    let backupId: string | undefined;

    // Create final backup before cleanup
    if (createFinalBackup) {
      const backup = await createPolicyBackup();
      if (!backup.success) {
        return { success: false, deletedCount: 0, error: `Backup failed: ${backup.error}` };
      }
      backupId = backup.backupId;
    }

    // Count policies before deletion
    const policyCount = await prisma.policy.count();

    // Delete all old policies
    await prisma.policy.deleteMany({});

    logger.info(`Cleaned up ${policyCount} old policy records`);

    return {
      success: true,
      deletedCount: policyCount,
      backupId
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Cleanup failed:', errorMessage);
    return { success: false, deletedCount: 0, error: errorMessage };
  }
}