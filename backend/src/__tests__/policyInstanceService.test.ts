import { PolicyInstanceService } from '../services/policyInstanceService';
import { PolicyTemplateService } from '../services/policyTemplateService';
import { testPrisma, createTestClient } from './setup';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errorHandler';

describe('PolicyInstanceService', () => {
  let client: any;
  let template: any;

  beforeEach(async () => {
    // Clean up
    await testPrisma.policyInstance.deleteMany();
    await testPrisma.policyTemplate.deleteMany();

    // Create test client and template
    client = await createTestClient();
    template = await PolicyTemplateService.createTemplate({
      policyNumber: 'INST-001',
      policyType: 'Life',
      provider: 'Instance Provider'
    });
  });

  describe('createInstance', () => {
    it('should create policy instance with valid data', async () => {
      const instanceData = {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      };

      const instance = await PolicyInstanceService.createInstance(
        client.id,
        instanceData
      );

      expect(instance).toMatchObject({
        premiumAmount: 1000,
        commissionAmount: 100,
        status: 'Active'
      });
      expect(instance.policyTemplate.policyNumber).toBe('INST-001');
      expect(new Date(instance.startDate)).toEqual(new Date('2024-01-01'));
      
      // Check expiry date calculation
      const expectedExpiry = new Date('2024-01-01');
      expectedExpiry.setMonth(expectedExpiry.getMonth() + 12);
      expect(new Date(instance.expiryDate)).toEqual(expectedExpiry);
    });

    it('should throw NotFoundError for non-existent client', async () => {
      const instanceData = {
        policyTemplateId: template.id,
        clientId: 'non-existent-client',
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      };

      await expect(PolicyInstanceService.createInstance('non-existent-client', instanceData))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent template', async () => {
      const instanceData = {
        policyTemplateId: 'non-existent-template',
        clientId: client.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      };

      await expect(PolicyInstanceService.createInstance(client.id, instanceData))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError for duplicate client-template association', async () => {
      const instanceData = {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      };

      // Create first instance
      await PolicyInstanceService.createInstance(client.id, instanceData);

      // Try to create duplicate
      await expect(PolicyInstanceService.createInstance(client.id, instanceData))
        .rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError for invalid premium amount', async () => {
      const instanceData = {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: -100,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      };

      await expect(PolicyInstanceService.createInstance(client.id, instanceData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for negative commission', async () => {
      const instanceData = {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: -50
      };

      await expect(PolicyInstanceService.createInstance(client.id, instanceData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid duration', async () => {
      const instanceData = {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 150, // Too long
        commissionAmount: 100
      };

      await expect(PolicyInstanceService.createInstance(client.id, instanceData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid start date', async () => {
      const instanceData = {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: 1000,
        startDate: 'invalid-date',
        durationMonths: 12,
        commissionAmount: 100
      };

      await expect(PolicyInstanceService.createInstance(client.id, instanceData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updateInstance', () => {
    let instance: any;

    beforeEach(async () => {
      instance = await PolicyInstanceService.createInstance(client.id, {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });
    });

    it('should update instance with valid data', async () => {
      const updateData = {
        premiumAmount: 1200,
        commissionAmount: 120
      };

      const updated = await PolicyInstanceService.updateInstance(
        instance.id,
        updateData
      );

      expect(updated.premiumAmount).toBe(1200);
      expect(updated.commissionAmount).toBe(120);
    });

    it('should recalculate expiry date when duration changes', async () => {
      const updateData = {
        durationMonths: 24
      };

      const updated = await PolicyInstanceService.updateInstance(
        instance.id,
        updateData
      );

      const expectedExpiry = new Date('2024-01-01');
      expectedExpiry.setMonth(expectedExpiry.getMonth() + 24);
      expect(new Date(updated.expiryDate)).toEqual(expectedExpiry);
    });

    it('should update expiry date directly', async () => {
      const updateData = {
        expiryDate: '2025-06-01'
      };

      const updated = await PolicyInstanceService.updateInstance(
        instance.id,
        updateData
      );

      expect(new Date(updated.expiryDate)).toEqual(new Date('2025-06-01'));
    });

    it('should throw NotFoundError for non-existent instance', async () => {
      await expect(PolicyInstanceService.updateInstance('non-existent-id', {}))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid premium amount', async () => {
      await expect(PolicyInstanceService.updateInstance(
        instance.id,
        { premiumAmount: -100 }
      )).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid date range', async () => {
      await expect(PolicyInstanceService.updateInstance(
        instance.id,
        { 
          startDate: '2024-06-01',
          expiryDate: '2024-01-01' // Before start date
        }
      )).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid status', async () => {
      await expect(PolicyInstanceService.updateInstance(
        instance.id,
        { status: 'InvalidStatus' as any }
      )).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteInstance', () => {
    let instance: any;

    beforeEach(async () => {
      instance = await PolicyInstanceService.createInstance(client.id, {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });
    });

    it('should delete instance successfully', async () => {
      await PolicyInstanceService.deleteInstance(instance.id);

      // Verify instance is deleted
      await expect(PolicyInstanceService.getInstanceById(instance.id))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent instance', async () => {
      await expect(PolicyInstanceService.deleteInstance('non-existent-id'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getInstancesByTemplate', () => {
    beforeEach(async () => {
      // Create multiple instances for the template
      const client2 = await createTestClient({ email: 'client2@test.com' });
      
      await PolicyInstanceService.createInstance(client.id, {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      await PolicyInstanceService.createInstance(client2.id, {
        policyTemplateId: template.id,
        clientId: client2.id,
        premiumAmount: 1500,
        startDate: '2024-02-01',
        durationMonths: 24,
        commissionAmount: 150
      });
    });

    it('should return all instances for template', async () => {
      const instances = await PolicyInstanceService.getInstancesByTemplate(template.id);

      expect(instances).toHaveLength(2);
      expect(instances[0].client).toBeDefined();
      expect(instances[1].client).toBeDefined();
    });

    it('should return empty array for template with no instances', async () => {
      const emptyTemplate = await PolicyTemplateService.createTemplate({
        policyNumber: 'EMPTY-001',
        policyType: 'Health',
        provider: 'Empty Provider'
      });

      const instances = await PolicyInstanceService.getInstancesByTemplate(emptyTemplate.id);

      expect(instances).toHaveLength(0);
    });
  });

  describe('getInstancesByClient', () => {
    beforeEach(async () => {
      // Create multiple templates and instances for the client
      const template2 = await PolicyTemplateService.createTemplate({
        policyNumber: 'INST-002',
        policyType: 'Health',
        provider: 'Health Provider'
      });

      await PolicyInstanceService.createInstance(client.id, {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      await PolicyInstanceService.createInstance(client.id, {
        policyTemplateId: template2.id,
        clientId: client.id,
        premiumAmount: 800,
        startDate: '2024-03-01',
        durationMonths: 6,
        commissionAmount: 80
      });
    });

    it('should return all instances for client', async () => {
      const instances = await PolicyInstanceService.getInstancesByClient(client.id);

      expect(instances).toHaveLength(2);
      expect(instances[0].policyTemplate).toBeDefined();
      expect(instances[1].policyTemplate).toBeDefined();
    });

    it('should return empty array for client with no instances', async () => {
      const emptyClient = await createTestClient({ email: 'empty@test.com' });
      const instances = await PolicyInstanceService.getInstancesByClient(emptyClient.id);

      expect(instances).toHaveLength(0);
    });
  });

  describe('updateInstanceStatus', () => {
    let instance: any;

    beforeEach(async () => {
      instance = await PolicyInstanceService.createInstance(client.id, {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });
    });

    it('should update instance status', async () => {
      await PolicyInstanceService.updateInstanceStatus(instance.id, 'Expired');

      const updated = await PolicyInstanceService.getInstanceById(instance.id);
      expect(updated.status).toBe('Expired');
    });

    it('should throw NotFoundError for non-existent instance', async () => {
      await expect(PolicyInstanceService.updateInstanceStatus('non-existent-id', 'Expired'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('calculateExpiryDate', () => {
    it('should calculate expiry date correctly', () => {
      const startDate = new Date('2024-01-01');
      const durationMonths = 12;

      const expiryDate = PolicyInstanceService.calculateExpiryDate(startDate, durationMonths);

      expect(expiryDate).toEqual(new Date('2025-01-01'));
    });

    it('should handle month overflow correctly', () => {
      const startDate = new Date('2024-01-31');
      const durationMonths = 1;

      const expiryDate = PolicyInstanceService.calculateExpiryDate(startDate, durationMonths);

      // Should be end of February (leap year)
      expect(expiryDate.getMonth()).toBe(1); // February (0-indexed)
      expect(expiryDate.getFullYear()).toBe(2024);
    });
  });

  describe('validateUniqueAssociation', () => {
    let instance: any;

    beforeEach(async () => {
      instance = await PolicyInstanceService.createInstance(client.id, {
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });
    });

    it('should return false for existing association', async () => {
      const isUnique = await PolicyInstanceService.validateUniqueAssociation(
        client.id,
        template.id
      );

      expect(isUnique).toBe(false);
    });

    it('should return true for non-existing association', async () => {
      const newClient = await createTestClient({ email: 'new@test.com' });
      
      const isUnique = await PolicyInstanceService.validateUniqueAssociation(
        newClient.id,
        template.id
      );

      expect(isUnique).toBe(true);
    });

    it('should exclude specific instance when checking', async () => {
      const isUnique = await PolicyInstanceService.validateUniqueAssociation(
        client.id,
        template.id,
        instance.id
      );

      expect(isUnique).toBe(true);
    });
  });
});