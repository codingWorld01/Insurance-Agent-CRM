import { PrismaClient } from '@prisma/client';
import {
  validatePolicyData,
  migratePolicies,
  verifyMigrationIntegrity,
  createPolicyBackup
} from '../utils/policyMigration';
import { PolicyCompatibilityService } from '../services/policyCompatibilityService';
import { PolicyDataIntegrityChecker } from '../utils/policyDataIntegrity';

// Mock Prisma Client
jest.mock('@prisma/client');
const mockPrisma = {
  policy: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  policyTemplate: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    groupBy: jest.fn(),
    deleteMany: jest.fn()
  },
  policyInstance: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn()
  },
  client: {
    findMany: jest.fn()
  },
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
  $transaction: jest.fn()
};

// Mock the PrismaClient constructor
(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma as any);

describe('Policy Migration Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePolicyData', () => {
    it('should return valid result when no policies exist', async () => {
      mockPrisma.policy.count.mockResolvedValue(0);

      const result = await validatePolicyData();

      expect(result.isValid).toBe(true);
      expect(result.totalPolicies).toBe(0);
      expect(result.warnings).toContain('No policies found to migrate');
    });

    it('should detect missing required data', async () => {
      mockPrisma.policy.count.mockResolvedValue(5);
      mockPrisma.policy.findMany
        .mockResolvedValueOnce([
          { id: '1', policyNumber: null },
          { id: '2', policyNumber: '' }
        ])
        .mockResolvedValueOnce([]) // duplicates
        .mockResolvedValueOnce([]) // orphaned
        .mockResolvedValueOnce([]) // invalid dates
        .mockResolvedValueOnce([]); // invalid amounts

      mockPrisma.policy.groupBy
        .mockResolvedValueOnce([]) // duplicates
        .mockResolvedValueOnce([]); // unique templates

      const result = await validatePolicyData();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('2 policies have missing required data');
    });

    it('should detect duplicate policy numbers', async () => {
      mockPrisma.policy.count.mockResolvedValue(3);
      mockPrisma.policy.findMany
        .mockResolvedValueOnce([]) // missing data
        .mockResolvedValueOnce([]) // orphaned
        .mockResolvedValueOnce([]) // invalid dates
        .mockResolvedValueOnce([]); // invalid amounts

      mockPrisma.policy.groupBy
        .mockResolvedValueOnce([
          { policyNumber: 'POL-001', _count: { policyNumber: 2 } }
        ]) // duplicates
        .mockResolvedValueOnce([
          { policyNumber: 'POL-001', policyType: 'Life', provider: 'ABC' }
        ]); // unique templates

      const result = await validatePolicyData();

      expect(result.isValid).toBe(true); // Duplicates are warnings, not errors
      expect(result.warnings).toContain('1 duplicate policy numbers found - will create separate templates');
    });
  });

  describe('migratePolicies', () => {
    it('should perform dry run migration', async () => {
      // Mock validation
      mockPrisma.policy.count.mockResolvedValue(2);
      mockPrisma.policy.findMany
        .mockResolvedValueOnce([]) // validation - missing data
        .mockResolvedValueOnce([]) // validation - orphaned
        .mockResolvedValueOnce([]) // validation - invalid dates
        .mockResolvedValueOnce([]) // validation - invalid amounts
        .mockResolvedValueOnce([ // actual migration data
          {
            id: '1',
            policyNumber: 'POL-001',
            policyType: 'Life',
            provider: 'ABC Insurance',
            premiumAmount: 1000,
            commissionAmount: 100,
            status: 'Active',
            startDate: new Date('2024-01-01'),
            expiryDate: new Date('2024-12-31'),
            clientId: 'client-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            client: { id: 'client-1', name: 'John Doe' }
          }
        ]);

      mockPrisma.policy.groupBy
        .mockResolvedValueOnce([]) // validation - duplicates
        .mockResolvedValueOnce([
          { policyNumber: 'POL-001', policyType: 'Life', provider: 'ABC Insurance' }
        ]); // validation - unique templates

      const result = await migratePolicies({ dryRun: true });

      expect(result.success).toBe(true);
      expect(result.templatesCreated).toBe(1);
      expect(result.instancesCreated).toBe(1);
      expect(result.policiesMigrated).toBe(1);
      expect(mockPrisma.policyTemplate.create).not.toHaveBeenCalled();
      expect(mockPrisma.policyInstance.create).not.toHaveBeenCalled();
    });

    it('should handle migration errors gracefully', async () => {
      mockPrisma.policy.count.mockResolvedValue(1);
      mockPrisma.policy.findMany
        .mockResolvedValueOnce([]) // validation calls
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: '1',
            policyNumber: 'POL-001',
            policyType: 'Life',
            provider: 'ABC Insurance',
            premiumAmount: 1000,
            commissionAmount: 100,
            status: 'Active',
            startDate: new Date('2024-01-01'),
            expiryDate: new Date('2024-12-31'),
            clientId: 'client-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            client: null // Missing client
          }
        ]);

      mockPrisma.policy.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await migratePolicies({ dryRun: false, createBackup: false });

      expect(result.success).toBe(false);
      expect(result.skippedPolicies).toBe(1);
      expect(result.errors).toContain('Skipped policy POL-001: Client not found');
    });
  });

  describe('PolicyCompatibilityService', () => {
    it('should get client policies from template system', async () => {
      const service = new PolicyCompatibilityService({
        useTemplateSystem: true,
        allowFallback: false,
        migrateOnRead: false
      });

      mockPrisma.policyInstance.findMany.mockResolvedValue([
        {
          id: 'instance-1',
          premiumAmount: 1000,
          commissionAmount: 100,
          status: 'Active',
          startDate: new Date('2024-01-01'),
          expiryDate: new Date('2024-12-31'),
          clientId: 'client-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          policyTemplate: {
            id: 'template-1',
            policyNumber: 'POL-001',
            policyType: 'Life',
            provider: 'ABC Insurance',
            description: 'Life insurance policy'
          },
          client: {
            id: 'client-1',
            name: 'John Doe',
            email: 'john@example.com'
          }
        }
      ]);

      const policies = await service.getClientPolicies('client-1');

      expect(policies).toHaveLength(1);
      expect(policies[0].isFromTemplate).toBe(true);
      expect(policies[0].policyNumber).toBe('POL-001');
      expect(policies[0].templateId).toBe('template-1');
    });

    it('should fallback to old system when no template data', async () => {
      const service = new PolicyCompatibilityService({
        useTemplateSystem: true,
        allowFallback: true,
        migrateOnRead: false
      });

      mockPrisma.policyInstance.findMany.mockResolvedValue([]);
      mockPrisma.policy.findMany.mockResolvedValue([
        {
          id: 'policy-1',
          policyNumber: 'POL-001',
          policyType: 'Life',
          provider: 'ABC Insurance',
          premiumAmount: 1000,
          commissionAmount: 100,
          status: 'Active',
          startDate: new Date('2024-01-01'),
          expiryDate: new Date('2024-12-31'),
          clientId: 'client-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          client: {
            id: 'client-1',
            name: 'John Doe',
            email: 'john@example.com'
          }
        }
      ]);

      const policies = await service.getClientPolicies('client-1');

      expect(policies).toHaveLength(1);
      expect(policies[0].isFromTemplate).toBe(false);
      expect(policies[0].templateId).toBeUndefined();
    });
  });

  describe('PolicyDataIntegrityChecker', () => {
    it('should run all integrity checks', async () => {
      const checker = new PolicyDataIntegrityChecker();

      // Mock all the database calls for integrity checks
      mockPrisma.policyTemplate.groupBy.mockResolvedValue([]);
      mockPrisma.policyInstance.count
        .mockResolvedValueOnce(0) // orphaned instances
        .mockResolvedValueOnce(0) // invalid amounts
        .mockResolvedValueOnce(0) // invalid status
        .mockResolvedValueOnce(0) // null values
        .mockResolvedValueOnce(0); // expired active

      mockPrisma.policyTemplate.count.mockResolvedValue(0);
      mockPrisma.policy.count
        .mockResolvedValueOnce(0) // orphaned policies
        .mockResolvedValueOnce(0) // invalid amounts
        .mockResolvedValueOnce(0) // invalid status
        .mockResolvedValueOnce(0); // expired active

      mockPrisma.policyInstance.findMany.mockResolvedValue([]);
      mockPrisma.policy.findMany.mockResolvedValue([]);
      mockPrisma.policyInstance.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);

      const report = await checker.runAllChecks();

      expect(report.overallStatus).toBe('passed');
      expect(report.summary.totalChecks).toBeGreaterThan(0);
      expect(report.summary.errors).toBe(0);
    });

    it('should detect integrity issues', async () => {
      const checker = new PolicyDataIntegrityChecker();

      // Mock duplicate policy numbers
      mockPrisma.policyTemplate.groupBy.mockResolvedValue([
        { policyNumber: 'POL-001', _count: { policyNumber: 2 } }
      ]);

      // Mock other checks to pass
      mockPrisma.policyInstance.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      mockPrisma.policyTemplate.count.mockResolvedValue(0);
      mockPrisma.policy.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      mockPrisma.policyInstance.findMany.mockResolvedValue([
        { id: 'template-1' }, { id: 'template-2' }
      ]);
      mockPrisma.policy.findMany.mockResolvedValue([]);
      mockPrisma.policyInstance.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);

      const report = await checker.runAllChecks();

      expect(report.overallStatus).toBe('failed');
      expect(report.summary.errors).toBeGreaterThan(0);
      
      const uniquenessCheck = report.checks.find(c => c.name === 'Policy Number Uniqueness');
      expect(uniquenessCheck?.passed).toBe(false);
    });
  });

  describe('createPolicyBackup', () => {
    it('should create backup successfully', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(undefined);

      const result = await createPolicyBackup();

      expect(result.success).toBe(true);
      expect(result.backupId).toMatch(/^policy_backup_\d+$/);
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });

    it('should handle backup errors', async () => {
      mockPrisma.$executeRaw.mockRejectedValue(new Error('Database error'));

      const result = await createPolicyBackup();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('verifyMigrationIntegrity', () => {
    it('should verify successful migration', async () => {
      mockPrisma.policy.count.mockResolvedValue(5);
      mockPrisma.policyInstance.count
        .mockResolvedValueOnce(5) // total instances
        .mockResolvedValueOnce(0) // orphaned instances
        .mockResolvedValueOnce(0); // invalid instances

      mockPrisma.policyTemplate.groupBy.mockResolvedValue([]);
      mockPrisma.policyInstance.groupBy.mockResolvedValue([]);

      const result = await verifyMigrationIntegrity();

      expect(result.success).toBe(true);
      
      const countCheck = result.checks.find(c => c.name === 'Policy to Instance Count Match');
      expect(countCheck?.passed).toBe(true);
    });
  });
});