import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export interface IntegrityCheck {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  passed: boolean;
  details: string;
  affectedRecords?: number;
  sampleIds?: string[];
}

export interface IntegrityReport {
  timestamp: Date;
  overallStatus: 'passed' | 'warnings' | 'failed';
  checks: IntegrityCheck[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    errors: number;
  };
}

/**
 * Comprehensive data integrity checker for policy system
 */
export class PolicyDataIntegrityChecker {
  
  /**
   * Run all integrity checks
   */
  async runAllChecks(): Promise<IntegrityReport> {
    const checks: IntegrityCheck[] = [];
    
    logger.info('Starting comprehensive policy data integrity check');
    
    // Run all individual checks
    checks.push(await this.checkPolicyNumberUniqueness());
    checks.push(await this.checkTemplateInstanceConsistency());
    checks.push(await this.checkClientReferences());
    checks.push(await this.checkDateConsistency());
    checks.push(await this.checkAmountValidation());
    checks.push(await this.checkStatusConsistency());
    checks.push(await this.checkDuplicateInstances());
    checks.push(await this.checkOrphanedRecords());
    checks.push(await this.checkDataTypeConsistency());
    checks.push(await this.checkBusinessRuleCompliance());
    
    // Calculate summary
    const summary = {
      totalChecks: checks.length,
      passed: checks.filter(c => c.passed && c.severity !== 'warning').length,
      warnings: checks.filter(c => c.severity === 'warning').length,
      errors: checks.filter(c => !c.passed && c.severity === 'error').length
    };
    
    // Determine overall status
    let overallStatus: 'passed' | 'warnings' | 'failed' = 'passed';
    if (summary.errors > 0) {
      overallStatus = 'failed';
    } else if (summary.warnings > 0) {
      overallStatus = 'warnings';
    }
    
    const report: IntegrityReport = {
      timestamp: new Date(),
      overallStatus,
      checks,
      summary
    };
    
    logger.info(`Integrity check completed: ${overallStatus} (${summary.errors} errors, ${summary.warnings} warnings)`);
    
    return report;
  }
  
  /**
   * Check policy number uniqueness across templates
   */
  private async checkPolicyNumberUniqueness(): Promise<IntegrityCheck> {
    try {
      const duplicates = await prisma.policyTemplate.groupBy({
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
      
      const sampleIds = duplicates.length > 0 ? 
        (await prisma.policyTemplate.findMany({
          where: { policyNumber: duplicates[0]?.policyNumber },
          select: { id: true },
          take: 5
        })).map(t => t.id) : [];
      
      return {
        name: 'Policy Number Uniqueness',
        description: 'Check that policy numbers are unique across templates',
        severity: 'error',
        passed: duplicates.length === 0,
        details: duplicates.length === 0 ? 
          'All policy numbers are unique' : 
          `${duplicates.length} duplicate policy numbers found`,
        affectedRecords: duplicates.reduce((sum, d) => sum + d._count.policyNumber, 0),
        sampleIds
      };
    } catch (error) {
      return {
        name: 'Policy Number Uniqueness',
        description: 'Check that policy numbers are unique across templates',
        severity: 'error',
        passed: false,
        details: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Check template-instance consistency
   */
  private async checkTemplateInstanceConsistency(): Promise<IntegrityCheck> {
    try {
      // Check for instances without templates using raw query
      const orphanedInstancesResult = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "PolicyInstance" pi 
        WHERE NOT EXISTS (SELECT 1 FROM "PolicyTemplate" pt WHERE pt.id = pi."policyTemplateId")
      `;
      const orphanedInstances = Number(orphanedInstancesResult[0].count);
      
      // Check for templates without instances (this is OK, just informational)
      const templatesWithoutInstances = await prisma.policyTemplate.count({
        where: {
          instances: {
            none: {}
          }
        }
      });
      
      const sampleIds: string[] = [];
      
      return {
        name: 'Template-Instance Consistency',
        description: 'Check that all instances have valid template references',
        severity: orphanedInstances > 0 ? 'error' : 'info',
        passed: orphanedInstances === 0,
        details: orphanedInstances === 0 ? 
          `All instances have valid templates. ${templatesWithoutInstances} templates have no instances (OK)` :
          `${orphanedInstances} instances have invalid template references`,
        affectedRecords: orphanedInstances,
        sampleIds
      };
    } catch (error) {
      return {
        name: 'Template-Instance Consistency',
        description: 'Check that all instances have valid template references',
        severity: 'error',
        passed: false,
        details: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Check client references
   */
  private async checkClientReferences(): Promise<IntegrityCheck> {
    try {
      // Check for instances with invalid client references using raw queries
      const orphanedInstancesResult = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "PolicyInstance" pi 
        WHERE NOT EXISTS (SELECT 1 FROM "Client" c WHERE c.id = pi."clientId")
      `;
      const orphanedInstances = Number(orphanedInstancesResult[0].count);
      
      // Check for old policies with invalid client references
      const orphanedPoliciesResult = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "Policy" p 
        WHERE NOT EXISTS (SELECT 1 FROM "Client" c WHERE c.id = p."clientId")
      `;
      const orphanedPolicies = Number(orphanedPoliciesResult[0].count);
      
      const totalOrphaned = orphanedInstances + orphanedPolicies;
      
      const sampleIds: string[] = [];
      
      return {
        name: 'Client References',
        description: 'Check that all policies/instances have valid client references',
        severity: 'error',
        passed: totalOrphaned === 0,
        details: totalOrphaned === 0 ? 
          'All policies have valid client references' :
          `${orphanedInstances} instances and ${orphanedPolicies} old policies have invalid client references`,
        affectedRecords: totalOrphaned,
        sampleIds
      };
    } catch (error) {
      return {
        name: 'Client References',
        description: 'Check that all policies/instances have valid client references',
        severity: 'error',
        passed: false,
        details: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Check date consistency
   */
  private async checkDateConsistency(): Promise<IntegrityCheck> {
    try {
      // Check instances with invalid date ranges
      const invalidDateInstances = await prisma.policyInstance.findMany({
        where: {
          startDate: {
            gte: prisma.policyInstance.fields.expiryDate
          }
        },
        select: { id: true, startDate: true, expiryDate: true },
        take: 5
      });
      
      // Check old policies with invalid date ranges
      const invalidDatePolicies = await prisma.policy.findMany({
        where: {
          startDate: {
            gte: prisma.policy.fields.expiryDate
          }
        },
        select: { id: true, startDate: true, expiryDate: true },
        take: 5
      });
      
      const totalInvalid = invalidDateInstances.length + invalidDatePolicies.length;
      const sampleIds = [
        ...invalidDateInstances.map(i => i.id),
        ...invalidDatePolicies.map(p => p.id)
      ];
      
      return {
        name: 'Date Consistency',
        description: 'Check that start dates are before expiry dates',
        severity: 'error',
        passed: totalInvalid === 0,
        details: totalInvalid === 0 ? 
          'All date ranges are valid' :
          `${invalidDateInstances.length} instances and ${invalidDatePolicies.length} old policies have invalid date ranges`,
        affectedRecords: totalInvalid,
        sampleIds
      };
    } catch (error) {
      return {
        name: 'Date Consistency',
        description: 'Check that start dates are before expiry dates',
        severity: 'error',
        passed: false,
        details: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Check amount validation
   */
  private async checkAmountValidation(): Promise<IntegrityCheck> {
    try {
      // Check instances with invalid amounts
      const invalidAmountInstances = await prisma.policyInstance.count({
        where: {
          OR: [
            { premiumAmount: { lt: 0 } },
            { commissionAmount: { lt: 0 } }
          ]
        }
      });
      
      // Check old policies with invalid amounts
      const invalidAmountPolicies = await prisma.policy.count({
        where: {
          OR: [
            { premiumAmount: { lt: 0 } },
            { commissionAmount: { lt: 0 } }
          ]
        }
      });
      
      const totalInvalid = invalidAmountInstances + invalidAmountPolicies;
      
      const sampleIds: string[] = [];
      if (invalidAmountInstances > 0) {
        const instances = await prisma.policyInstance.findMany({
          where: {
            OR: [
              { premiumAmount: { lt: 0 } },
              { commissionAmount: { lt: 0 } }
            ]
          },
          select: { id: true },
          take: 3
        });
        sampleIds.push(...instances.map(i => i.id));
      }
      
      return {
        name: 'Amount Validation',
        description: 'Check that premium and commission amounts are non-negative',
        severity: 'warning',
        passed: totalInvalid === 0,
        details: totalInvalid === 0 ? 
          'All amounts are valid' :
          `${invalidAmountInstances} instances and ${invalidAmountPolicies} old policies have negative amounts`,
        affectedRecords: totalInvalid,
        sampleIds
      };
    } catch (error) {
      return {
        name: 'Amount Validation',
        description: 'Check that premium and commission amounts are non-negative',
        severity: 'error',
        passed: false,
        details: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Check status consistency
   */
  private async checkStatusConsistency(): Promise<IntegrityCheck> {
    try {
      const validStatuses = ['Active', 'Expired', 'Cancelled'];
      
      // Check instances with invalid status
      const invalidStatusInstances = await prisma.policyInstance.count({
        where: {
          status: {
            notIn: validStatuses
          }
        }
      });
      
      // Check old policies with invalid status
      const invalidStatusPolicies = await prisma.policy.count({
        where: {
          status: {
            notIn: validStatuses
          }
        }
      });
      
      const totalInvalid = invalidStatusInstances + invalidStatusPolicies;
      
      return {
        name: 'Status Consistency',
        description: 'Check that all policies have valid status values',
        severity: 'warning',
        passed: totalInvalid === 0,
        details: totalInvalid === 0 ? 
          'All status values are valid' :
          `${invalidStatusInstances} instances and ${invalidStatusPolicies} old policies have invalid status values`,
        affectedRecords: totalInvalid
      };
    } catch (error) {
      return {
        name: 'Status Consistency',
        description: 'Check that all policies have valid status values',
        severity: 'error',
        passed: false,
        details: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Check for duplicate instances
   */
  private async checkDuplicateInstances(): Promise<IntegrityCheck> {
    try {
      const duplicates = await prisma.policyInstance.groupBy({
        by: ['policyTemplateId', 'clientId'],
        having: {
          policyTemplateId: {
            _count: {
              gt: 1
            }
          }
        },
        _count: {
          policyTemplateId: true
        }
      });
      
      const totalDuplicates = duplicates.reduce((sum, d) => sum + d._count.policyTemplateId, 0);
      
      return {
        name: 'Duplicate Instances',
        description: 'Check for duplicate policy instances per client-template combination',
        severity: 'error',
        passed: duplicates.length === 0,
        details: duplicates.length === 0 ? 
          'No duplicate instances found' :
          `${duplicates.length} client-template combinations have ${totalDuplicates} duplicate instances`,
        affectedRecords: totalDuplicates
      };
    } catch (error) {
      return {
        name: 'Duplicate Instances',
        description: 'Check for duplicate policy instances per client-template combination',
        severity: 'error',
        passed: false,
        details: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Check for orphaned records
   */
  private async checkOrphanedRecords(): Promise<IntegrityCheck> {
    try {
      // This is covered by other checks, but we'll do a comprehensive check here
      const orphanedCount = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM (
          SELECT id FROM "PolicyInstance" pi 
          WHERE NOT EXISTS (SELECT 1 FROM "PolicyTemplate" pt WHERE pt.id = pi."policyTemplateId")
          OR NOT EXISTS (SELECT 1 FROM "Client" c WHERE c.id = pi."clientId")
          UNION ALL
          SELECT id FROM "Policy" p 
          WHERE NOT EXISTS (SELECT 1 FROM "Client" c WHERE c.id = p."clientId")
        ) orphaned
      `;
      
      const count = Number(orphanedCount[0].count);
      
      return {
        name: 'Orphaned Records',
        description: 'Check for records with broken foreign key relationships',
        severity: 'error',
        passed: count === 0,
        details: count === 0 ? 
          'No orphaned records found' :
          `${count} orphaned records found`,
        affectedRecords: count
      };
    } catch (error) {
      return {
        name: 'Orphaned Records',
        description: 'Check for records with broken foreign key relationships',
        severity: 'error',
        passed: false,
        details: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Check data type consistency
   */
  private async checkDataTypeConsistency(): Promise<IntegrityCheck> {
    try {
      // Check for null values in required fields using raw queries
      const templateNullsResult = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "PolicyTemplate" 
        WHERE "policyNumber" IS NULL OR "policyType" IS NULL OR "provider" IS NULL
      `;
      const instanceNullsResult = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "PolicyInstance" 
        WHERE "policyTemplateId" IS NULL OR "clientId" IS NULL 
           OR "premiumAmount" IS NULL OR "commissionAmount" IS NULL 
           OR "startDate" IS NULL OR "expiryDate" IS NULL
      `;
      
      const nullChecks = [
        Number(templateNullsResult[0].count),
        Number(instanceNullsResult[0].count)
      ];
      
      const totalNulls = nullChecks.reduce((sum, count) => sum + count, 0);
      
      return {
        name: 'Data Type Consistency',
        description: 'Check for null values in required fields',
        severity: 'error',
        passed: totalNulls === 0,
        details: totalNulls === 0 ? 
          'All required fields have values' :
          `${totalNulls} records have null values in required fields`,
        affectedRecords: totalNulls
      };
    } catch (error) {
      return {
        name: 'Data Type Consistency',
        description: 'Check for null values in required fields',
        severity: 'error',
        passed: false,
        details: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Check business rule compliance
   */
  private async checkBusinessRuleCompliance(): Promise<IntegrityCheck> {
    try {
      // Check for policies with expiry dates in the past but still marked as Active
      const expiredActiveInstances = await prisma.policyInstance.count({
        where: {
          status: 'Active',
          expiryDate: {
            lt: new Date()
          }
        }
      });
      
      const expiredActivePolicies = await prisma.policy.count({
        where: {
          status: 'Active',
          expiryDate: {
            lt: new Date()
          }
        }
      });
      
      const totalExpiredActive = expiredActiveInstances + expiredActivePolicies;
      
      return {
        name: 'Business Rule Compliance',
        description: 'Check for expired policies still marked as Active',
        severity: 'warning',
        passed: totalExpiredActive === 0,
        details: totalExpiredActive === 0 ? 
          'All business rules are compliant' :
          `${expiredActiveInstances} instances and ${expiredActivePolicies} old policies are expired but still marked as Active`,
        affectedRecords: totalExpiredActive
      };
    } catch (error) {
      return {
        name: 'Business Rule Compliance',
        description: 'Check for expired policies still marked as Active',
        severity: 'error',
        passed: false,
        details: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Generate a detailed report
   */
  async generateDetailedReport(): Promise<string> {
    const report = await this.runAllChecks();
    
    let output = `# Policy Data Integrity Report\n\n`;
    output += `**Generated:** ${report.timestamp.toISOString()}\n`;
    output += `**Overall Status:** ${report.overallStatus.toUpperCase()}\n\n`;
    
    output += `## Summary\n\n`;
    output += `- Total Checks: ${report.summary.totalChecks}\n`;
    output += `- Passed: ${report.summary.passed}\n`;
    output += `- Warnings: ${report.summary.warnings}\n`;
    output += `- Errors: ${report.summary.errors}\n\n`;
    
    output += `## Detailed Results\n\n`;
    
    for (const check of report.checks) {
      const status = check.passed ? '✅ PASS' : (check.severity === 'warning' ? '⚠️ WARN' : '❌ FAIL');
      output += `### ${check.name} - ${status}\n\n`;
      output += `**Description:** ${check.description}\n\n`;
      output += `**Details:** ${check.details}\n\n`;
      
      if (check.affectedRecords !== undefined) {
        output += `**Affected Records:** ${check.affectedRecords}\n\n`;
      }
      
      if (check.sampleIds && check.sampleIds.length > 0) {
        output += `**Sample IDs:** ${check.sampleIds.join(', ')}\n\n`;
      }
      
      output += `---\n\n`;
    }
    
    return output;
  }
}