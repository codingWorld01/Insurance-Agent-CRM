import request from 'supertest';
import { testPrisma, getAuthToken, createTestClient } from './setup';
import { PolicyTemplateService } from '../services/policyTemplateService';
import { PolicyInstanceService } from '../services/policyInstanceService';

// Mock the app for testing
const mockApp = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  use: jest.fn(),
  listen: jest.fn(),
};
describe('Policy Templates Integration Tests', () => {
  let authToken: string;
  let testClient: any;
  let testTemplate: any;

  beforeAll(async () => {
    authToken = await getAuthToken();
  });

  beforeEach(async () => {
    // Clean up
    await testPrisma.policyInstance.deleteMany();
    await testPrisma.policyTemplate.deleteMany();

    // Create test data
    testClient = await createTestClient();
    testTemplate = await PolicyTemplateService.createTemplate({
      policyNumber: 'INT-001',
      policyType: 'Life',
      provider: 'Integration Provider',
      description: 'Integration test template'
    });
  });

  describe('Policy Template CRUD Operations', () => {
    it('should create policy template successfully', async () => {
      const templateData = {
        policyNumber: 'CREATE-001',
        policyType: 'Health',
        provider: 'Create Provider',
        description: 'Create test description'
      };

      const template = await PolicyTemplateService.createTemplate(templateData);

      expect(template).toMatchObject(templateData);
      expect(template.id).toBeDefined();
      expect(template.createdAt).toBeDefined();
    });

    it('should retrieve policy template with computed fields', async () => {
      // Add instance to template
      await PolicyInstanceService.createInstance(testClient.id, {
        policyTemplateId: testTemplate.id,
        clientId: testClient.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      const template = await PolicyTemplateService.getTemplateById(testTemplate.id);

      expect(template.instanceCount).toBe(1);
      expect(template.activeInstanceCount).toBe(1);
    });

    it('should update policy template successfully', async () => {
      const updateData = {
        provider: 'Updated Provider',
        description: 'Updated description'
      };

      const updated = await PolicyTemplateService.updateTemplate(
        testTemplate.id,
        updateData
      );

      expect(updated.provider).toBe('Updated Provider');
      expect(updated.description).toBe('Updated description');
      expect(updated.policyNumber).toBe(testTemplate.policyNumber);
    });

    it('should delete policy template and cascade instances', async () => {
      // Add instance to template
      await PolicyInstanceService.createInstance(testClient.id, {
        policyTemplateId: testTemplate.id,
        clientId: testClient.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      const result = await PolicyTemplateService.deleteTemplate(testTemplate.id);

      expect(result.success).toBe(true);
      expect(result.affectedClients).toBe(1);

      // Verify instances are deleted
      const instances = await testPrisma.policyInstance.findMany({
        where: { policyTemplateId: testTemplate.id }
      });
      expect(instances).toHaveLength(0);
    });
  });

  describe('Policy Instance CRUD Operations', () => {
    it('should create policy instance with expiry calculation', async () => {
      const instanceData = {
        policyTemplateId: testTemplate.id,
        clientId: testClient.id,
        premiumAmount: 1500,
        startDate: '2024-06-01',
        durationMonths: 24,
        commissionAmount: 150
      };

      const instance = await PolicyInstanceService.createInstance(
        testClient.id,
        instanceData
      );

      expect(instance.premiumAmount).toBe(1500);
      expect(instance.commissionAmount).toBe(150);
      expect(instance.status).toBe('Active');

      // Check expiry date calculation
      const expectedExpiry = new Date('2024-06-01');
      expectedExpiry.setMonth(expectedExpiry.getMonth() + 24);
      expect(new Date(instance.expiryDate)).toEqual(expectedExpiry);
    });

    it('should prevent duplicate client-template associations', async () => {
      const instanceData = {
        policyTemplateId: testTemplate.id,
        clientId: testClient.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      };

      // Create first instance
      await PolicyInstanceService.createInstance(testClient.id, instanceData);

      // Try to create duplicate
      await expect(
        PolicyInstanceService.createInstance(testClient.id, instanceData)
      ).rejects.toThrow('already has this policy template');
    });

    it('should update policy instance with validation', async () => {
      const instance = await PolicyInstanceService.createInstance(testClient.id, {
        policyTemplateId: testTemplate.id,
        clientId: testClient.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      const updateData = {
        premiumAmount: 1200,
        commissionAmount: 120,
        durationMonths: 18
      };

      const updated = await PolicyInstanceService.updateInstance(
        instance.id,
        updateData
      );

      expect(updated.premiumAmount).toBe(1200);
      expect(updated.commissionAmount).toBe(120);

      // Check expiry date recalculation
      const expectedExpiry = new Date('2024-01-01');
      expectedExpiry.setMonth(expectedExpiry.getMonth() + 18);
      expect(new Date(updated.expiryDate)).toEqual(expectedExpiry);
    });

    it('should delete policy instance successfully', async () => {
      const instance = await PolicyInstanceService.createInstance(testClient.id, {
        policyTemplateId: testTemplate.id,
        clientId: testClient.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      await PolicyInstanceService.deleteInstance(instance.id);

      // Verify instance is deleted
      const instances = await testPrisma.policyInstance.findMany({
        where: { id: instance.id }
      });
      expect(instances).toHaveLength(0);
    });
  });

  describe('Search and Filter Operations', () => {
    beforeEach(async () => {
      // Create multiple templates for testing
      await PolicyTemplateService.createTemplate({
        policyNumber: 'SEARCH-001',
        policyType: 'Life',
        provider: 'Search Provider A'
      });
      await PolicyTemplateService.createTemplate({
        policyNumber: 'SEARCH-002',
        policyType: 'Health',
        provider: 'Search Provider B'
      });
      await PolicyTemplateService.createTemplate({
        policyNumber: 'FILTER-001',
        policyType: 'Auto',
        provider: 'Filter Provider'
      });
    });

    it('should search templates by policy number', async () => {
      const results = await PolicyTemplateService.searchTemplates('SEARCH-001');

      expect(results).toHaveLength(1);
      expect(results[0].policyNumber).toBe('SEARCH-001');
    });

    it('should search templates by provider', async () => {
      const results = await PolicyTemplateService.searchTemplates('Search Provider');

      expect(results).toHaveLength(2);
      expect(results.map(r => r.provider)).toContain('Search Provider A');
      expect(results.map(r => r.provider)).toContain('Search Provider B');
    });

    it('should filter templates with pagination', async () => {
      const result = await PolicyTemplateService.getTemplatesWithFilters(
        { policyTypes: ['Life', 'Health'] },
        { page: 1, limit: 1 }
      );

      expect(result.templates).toHaveLength(1);
      expect(result.pagination.total).toBeGreaterThanOrEqual(2);
      expect(result.pagination.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('should exclude templates for specific client', async () => {
      const template = await testPrisma.policyTemplate.findFirst({
        where: { policyNumber: 'SEARCH-001' }
      });

      // Create instance for client
      await PolicyInstanceService.createInstance(testClient.id, {
        policyTemplateId: template!.id,
        clientId: testClient.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      const results = await PolicyTemplateService.searchTemplates(
        'SEARCH',
        testClient.id
      );

      expect(results.map(r => r.policyNumber)).not.toContain('SEARCH-001');
      expect(results.map(r => r.policyNumber)).toContain('SEARCH-002');
    });
  });

  describe('Statistics and Aggregation', () => {
    beforeEach(async () => {
      // Create templates with instances for statistics testing
      const template1 = await PolicyTemplateService.createTemplate({
        policyNumber: 'STATS-001',
        policyType: 'Life',
        provider: 'Stats Provider A'
      });
      const template2 = await PolicyTemplateService.createTemplate({
        policyNumber: 'STATS-002',
        policyType: 'Health',
        provider: 'Stats Provider B'
      });

      const client2 = await createTestClient({ email: 'client2@test.com' });

      // Add instances
      await PolicyInstanceService.createInstance(testClient.id, {
        policyTemplateId: template1.id,
        clientId: testClient.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });
      await PolicyInstanceService.createInstance(client2.id, {
        policyTemplateId: template2.id,
        clientId: client2.id,
        premiumAmount: 1500,
        startDate: '2024-02-01',
        durationMonths: 24,
        commissionAmount: 150
      });
    });

    it('should calculate template statistics correctly', async () => {
      const result = await PolicyTemplateService.getTemplatesWithFilters(
        {},
        { page: 1, limit: 10 }
      );

      expect(result.stats.totalTemplates).toBeGreaterThanOrEqual(2);
      expect(result.stats.totalInstances).toBeGreaterThanOrEqual(2);
      expect(result.stats.activeInstances).toBeGreaterThanOrEqual(2);
      expect(result.stats.totalClients).toBeGreaterThanOrEqual(2);
    });

    it('should provide provider distribution', async () => {
      const result = await PolicyTemplateService.getTemplatesWithFilters(
        {},
        { page: 1, limit: 10 }
      );

      expect(result.stats.topProviders).toBeDefined();
      expect(result.stats.topProviders.length).toBeGreaterThan(0);
      
      const providerNames = result.stats.topProviders.map((p: any) => p.provider);
      expect(providerNames).toContain('Stats Provider A');
    });

    it('should provide policy type distribution', async () => {
      const result = await PolicyTemplateService.getTemplatesWithFilters(
        {},
        { page: 1, limit: 10 }
      );

      expect(result.stats.policyTypeDistribution).toBeDefined();
      expect(result.stats.policyTypeDistribution.length).toBeGreaterThan(0);
      
      const policyTypes = result.stats.policyTypeDistribution.map((p: any) => p.type);
      expect(policyTypes).toContain('Life');
    });
  });

  describe('Data Validation and Error Handling', () => {
    it('should validate policy template creation data', async () => {
      await expect(
        PolicyTemplateService.createTemplate({
          policyNumber: '',
          policyType: 'Life',
          provider: 'Test Provider'
        })
      ).rejects.toThrow('Policy number is required');

      await expect(
        PolicyTemplateService.createTemplate({
          policyNumber: 'TEST-001',
          policyType: 'InvalidType' as any,
          provider: 'Test Provider'
        })
      ).rejects.toThrow('Invalid policy type');
    });

    it('should validate policy instance creation data', async () => {
      await expect(
        PolicyInstanceService.createInstance(testClient.id, {
          policyTemplateId: testTemplate.id,
          clientId: testClient.id,
          premiumAmount: -100,
          startDate: '2024-01-01',
          durationMonths: 12,
          commissionAmount: 100
        })
      ).rejects.toThrow('Premium amount must be greater than 0');

      await expect(
        PolicyInstanceService.createInstance(testClient.id, {
          policyTemplateId: testTemplate.id,
          clientId: testClient.id,
          premiumAmount: 1000,
          startDate: 'invalid-date',
          durationMonths: 12,
          commissionAmount: 100
        })
      ).rejects.toThrow('Invalid start date');
    });

    it('should handle non-existent resources gracefully', async () => {
      await expect(
        PolicyTemplateService.getTemplateById('non-existent-id')
      ).rejects.toThrow('Policy template not found');

      await expect(
        PolicyInstanceService.getInstanceById('non-existent-id')
      ).rejects.toThrow('Policy instance not found');
    });
  });

  describe('Business Logic Integration', () => {
    it('should maintain referential integrity on template deletion', async () => {
      // Create instance
      const instance = await PolicyInstanceService.createInstance(testClient.id, {
        policyTemplateId: testTemplate.id,
        clientId: testClient.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      // Delete template
      await PolicyTemplateService.deleteTemplate(testTemplate.id);

      // Verify instance is also deleted (cascade)
      await expect(
        PolicyInstanceService.getInstanceById(instance.id)
      ).rejects.toThrow('Policy instance not found');
    });

    it('should calculate expiry dates correctly across different scenarios', async () => {
      const testCases = [
        { startDate: '2024-01-31', months: 1, expectedMonth: 1 }, // Jan 31 + 1 month = Feb 29 (leap year)
        { startDate: '2024-02-29', months: 12, expectedMonth: 1 }, // Feb 29 + 12 months = Feb 28 (next year)
        { startDate: '2024-03-31', months: 1, expectedMonth: 3 }, // Mar 31 + 1 month = Apr 30
      ];

      for (const testCase of testCases) {
        const instance = await PolicyInstanceService.createInstance(testClient.id, {
          policyTemplateId: testTemplate.id,
          clientId: testClient.id,
          premiumAmount: 1000,
          startDate: testCase.startDate,
          durationMonths: testCase.months,
          commissionAmount: 100
        });

        const expiryDate = new Date(instance.expiryDate);
        expect(expiryDate.getMonth()).toBe(testCase.expectedMonth);

        // Clean up for next iteration
        await PolicyInstanceService.deleteInstance(instance.id);
      }
    });

    it('should update statistics when instances are modified', async () => {
      // Get initial stats
      const initialStats = await PolicyTemplateService.getTemplatesWithFilters(
        {},
        { page: 1, limit: 10 }
      );

      // Add instance
      const instance = await PolicyInstanceService.createInstance(testClient.id, {
        policyTemplateId: testTemplate.id,
        clientId: testClient.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      // Get updated stats
      const updatedStats = await PolicyTemplateService.getTemplatesWithFilters(
        {},
        { page: 1, limit: 10 }
      );

      expect(updatedStats.stats.totalInstances).toBe(
        initialStats.stats.totalInstances + 1
      );

      // Delete instance
      await PolicyInstanceService.deleteInstance(instance.id);

      // Get final stats
      const finalStats = await PolicyTemplateService.getTemplatesWithFilters(
        {},
        { page: 1, limit: 10 }
      );

      expect(finalStats.stats.totalInstances).toBe(
        initialStats.stats.totalInstances
      );
    });
  });
});