import { PolicyTemplateService } from '../services/policyTemplateService';
import '../types/jest';
import { testPrisma, createTestClient } from './setup';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errorHandler';

describe('PolicyTemplateService', () => {
  beforeEach(async () => {
    // Clean up policy templates and instances
    await testPrisma.policyInstance.deleteMany();
    await testPrisma.policyTemplate.deleteMany();
  });

  describe('createTemplate', () => {
    it('should create a policy template with valid data', async () => {
      const templateData = {
        policyNumber: 'POL-001',
        policyType: 'Life',
        provider: 'Test Insurance Co',
        description: 'Test life insurance policy'
      };

      const template = await PolicyTemplateService.createTemplate(templateData);

      expect(template).toMatchObject({
        policyNumber: 'POL-001',
        policyType: 'Life',
        provider: 'Test Insurance Co',
        description: 'Test life insurance policy'
      });
      expect(template.id).toBeDefined();
      expect(template.createdAt).toBeDefined();
    });

    it('should create template without description', async () => {
      const templateData = {
        policyNumber: 'POL-002',
        policyType: 'Health',
        provider: 'Health Corp'
      };

      const template = await PolicyTemplateService.createTemplate(templateData);

      expect(template.description).toBeNull();
      expect(template.policyNumber).toBe('POL-002');
    });

    it('should throw ValidationError for invalid policy type', async () => {
      const templateData = {
        policyNumber: 'POL-003',
        policyType: 'InvalidType',
        provider: 'Test Provider'
      };

      await expect(PolicyTemplateService.createTemplate(templateData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError for duplicate policy number', async () => {
      const templateData = {
        policyNumber: 'POL-004',
        policyType: 'Auto',
        provider: 'Auto Insurance Co'
      };

      // Create first template
      await PolicyTemplateService.createTemplate(templateData);

      // Try to create duplicate
      await expect(PolicyTemplateService.createTemplate(templateData))
        .rejects.toThrow(ConflictError);
    });

    it('should trim whitespace from input fields', async () => {
      const templateData = {
        policyNumber: '  POL-005  ',
        policyType: 'Home',
        provider: '  Home Insurance Co  ',
        description: '  Test description  '
      };

      const template = await PolicyTemplateService.createTemplate(templateData);

      expect(template.policyNumber).toBe('POL-005');
      expect(template.provider).toBe('Home Insurance Co');
      expect(template.description).toBe('Test description');
    });
  });

  describe('updateTemplate', () => {
    let existingTemplate: any;

    beforeEach(async () => {
      existingTemplate = await PolicyTemplateService.createTemplate({
        policyNumber: 'POL-UPDATE',
        policyType: 'Life',
        provider: 'Original Provider'
      });
    });

    it('should update template with valid data', async () => {
      const updateData = {
        provider: 'Updated Provider',
        description: 'Updated description'
      };

      const updated = await PolicyTemplateService.updateTemplate(
        existingTemplate.id,
        updateData
      );

      expect(updated.provider).toBe('Updated Provider');
      expect(updated.description).toBe('Updated description');
      expect(updated.policyNumber).toBe('POL-UPDATE'); // Unchanged
    });

    it('should throw NotFoundError for non-existent template', async () => {
      await expect(PolicyTemplateService.updateTemplate('non-existent-id', {}))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid policy type', async () => {
      await expect(PolicyTemplateService.updateTemplate(
        existingTemplate.id,
        { policyType: 'InvalidType' }
      )).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError when updating to duplicate policy number', async () => {
      // Create another template
      await PolicyTemplateService.createTemplate({
        policyNumber: 'POL-EXISTING',
        policyType: 'Health',
        provider: 'Another Provider'
      });

      // Try to update to existing policy number
      await expect(PolicyTemplateService.updateTemplate(
        existingTemplate.id,
        { policyNumber: 'POL-EXISTING' }
      )).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteTemplate', () => {
    let template: any;

    beforeEach(async () => {
      template = await PolicyTemplateService.createTemplate({
        policyNumber: 'POL-DELETE',
        policyType: 'Business',
        provider: 'Business Insurance Co'
      });
    });

    it('should delete template without instances', async () => {
      const result = await PolicyTemplateService.deleteTemplate(template.id);

      expect(result.success).toBe(true);
      expect(result.affectedClients).toBe(0);

      // Verify template is deleted
      await expect(PolicyTemplateService.getTemplateById(template.id))
        .rejects.toThrow(NotFoundError);
    });

    it('should delete template with instances', async () => {
      // Create client and instance
      const client = await createTestClient();
      await testPrisma.policyInstance.create({
        data: {
          policyTemplateId: template.id,
          clientId: client.id,
          premiumAmount: 1000,
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          commissionAmount: 100,
          status: 'Active'
        }
      });

      const result = await PolicyTemplateService.deleteTemplate(template.id);

      expect(result.success).toBe(true);
      expect(result.affectedClients).toBe(1);

      // Verify instances are cascade deleted
      const instances = await testPrisma.policyInstance.findMany({
        where: { policyTemplateId: template.id }
      });
      expect(instances).toHaveLength(0);
    });

    it('should throw NotFoundError for non-existent template', async () => {
      await expect(PolicyTemplateService.deleteTemplate('non-existent-id'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('searchTemplates', () => {
    beforeEach(async () => {
      // Create test templates
      await PolicyTemplateService.createTemplate({
        policyNumber: 'LIFE-001',
        policyType: 'Life',
        provider: 'Life Insurance Co'
      });
      await PolicyTemplateService.createTemplate({
        policyNumber: 'AUTO-001',
        policyType: 'Auto',
        provider: 'Auto Insurance Co'
      });
      await PolicyTemplateService.createTemplate({
        policyNumber: 'HEALTH-001',
        policyType: 'Health',
        provider: 'Life Insurance Co'
      });
    });

    it('should search by policy number', async () => {
      const results = await PolicyTemplateService.searchTemplates('LIFE-001');

      expect(results).toHaveLength(1);
      expect(results[0].policyNumber).toBe('LIFE-001');
    });

    it('should search by provider', async () => {
      const results = await PolicyTemplateService.searchTemplates('Life Insurance');

      expect(results).toHaveLength(2);
      expect(results.map(r => r.policyNumber)).toContain('LIFE-001');
      expect(results.map(r => r.policyNumber)).toContain('HEALTH-001');
    });

    it('should search by policy type', async () => {
      const results = await PolicyTemplateService.searchTemplates('Auto');

      expect(results).toHaveLength(1);
      expect(results[0].policyType).toBe('Auto');
    });

    it('should be case insensitive', async () => {
      const results = await PolicyTemplateService.searchTemplates('life');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should exclude templates for specific client', async () => {
      const client = await createTestClient();
      const template = await testPrisma.policyTemplate.findFirst({
        where: { policyNumber: 'LIFE-001' }
      });

      // Create instance for client
      await testPrisma.policyInstance.create({
        data: {
          policyTemplateId: template!.id,
          clientId: client.id,
          premiumAmount: 1000,
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          commissionAmount: 100,
          status: 'Active'
        }
      });

      const results = await PolicyTemplateService.searchTemplates('LIFE', client.id);

      expect(results.map(r => r.policyNumber)).not.toContain('LIFE-001');
    });

    it('should respect limit parameter', async () => {
      const results = await PolicyTemplateService.searchTemplates('Insurance', undefined, 1);

      expect(results).toHaveLength(1);
    });
  });

  describe('getTemplatesWithFilters', () => {
    beforeEach(async () => {
      // Create test templates with instances
      const template1 = await PolicyTemplateService.createTemplate({
        policyNumber: 'FILTER-001',
        policyType: 'Life',
        provider: 'Provider A'
      });
      const template2 = await PolicyTemplateService.createTemplate({
        policyNumber: 'FILTER-002',
        policyType: 'Health',
        provider: 'Provider B'
      });

      const client = await createTestClient();
      
      // Add instance to first template
      await testPrisma.policyInstance.create({
        data: {
          policyTemplateId: template1.id,
          clientId: client.id,
          premiumAmount: 1000,
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          commissionAmount: 100,
          status: 'Active'
        }
      });
    });

    it('should filter by search term', async () => {
      const result = await PolicyTemplateService.getTemplatesWithFilters(
        { search: 'FILTER-001' },
        { page: 1, limit: 10 }
      );

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].policyNumber).toBe('FILTER-001');
    });

    it('should filter by policy types', async () => {
      const result = await PolicyTemplateService.getTemplatesWithFilters(
        { policyTypes: ['Life'] },
        { page: 1, limit: 10 }
      );

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].policyType).toBe('Life');
    });

    it('should filter by providers', async () => {
      const result = await PolicyTemplateService.getTemplatesWithFilters(
        { providers: ['Provider A'] },
        { page: 1, limit: 10 }
      );

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].provider).toBe('Provider A');
    });

    it('should filter by hasInstances', async () => {
      const result = await PolicyTemplateService.getTemplatesWithFilters(
        { hasInstances: true },
        { page: 1, limit: 10 }
      );

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].instanceCount).toBeGreaterThan(0);
    });

    it('should handle pagination', async () => {
      const result = await PolicyTemplateService.getTemplatesWithFilters(
        {},
        { page: 1, limit: 1 }
      );

      expect(result.templates).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('should include statistics', async () => {
      const result = await PolicyTemplateService.getTemplatesWithFilters(
        {},
        { page: 1, limit: 10 }
      );

      expect(result.stats).toBeDefined();
      expect(result.stats.totalTemplates).toBe(2);
      expect(result.stats.totalInstances).toBe(1);
    });
  });

  describe('getTemplateById', () => {
    let template: any;

    beforeEach(async () => {
      template = await PolicyTemplateService.createTemplate({
        policyNumber: 'GET-001',
        policyType: 'Life',
        provider: 'Get Provider'
      });
    });

    it('should return template with computed fields', async () => {
      const result = await PolicyTemplateService.getTemplateById(template.id);

      expect(result).toMatchObject({
        id: template.id,
        policyNumber: 'GET-001',
        policyType: 'Life',
        provider: 'Get Provider',
        instanceCount: 0,
        activeInstanceCount: 0
      });
    });

    it('should throw NotFoundError for non-existent template', async () => {
      await expect(PolicyTemplateService.getTemplateById('non-existent-id'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getAvailableFilters', () => {
    beforeEach(async () => {
      await PolicyTemplateService.createTemplate({
        policyNumber: 'AVAIL-001',
        policyType: 'Life',
        provider: 'Provider X'
      });
      await PolicyTemplateService.createTemplate({
        policyNumber: 'AVAIL-002',
        policyType: 'Health',
        provider: 'Provider Y'
      });
    });

    it('should return available providers and policy types', async () => {
      const filters = await PolicyTemplateService.getAvailableFilters();

      expect(filters.availableProviders).toContain('Provider X');
      expect(filters.availableProviders).toContain('Provider Y');
      expect(filters.availablePolicyTypes).toContain('Life');
      expect(filters.availablePolicyTypes).toContain('Health');
    });
  });
});