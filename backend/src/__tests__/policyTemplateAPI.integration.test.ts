import request from 'supertest';
import '../types/jest';
import { testPrisma, getAuthToken, createTestClient } from './setup';
import { PolicyTemplateService } from '../services/policyTemplateService';
import { PolicyInstanceService } from '../services/policyInstanceService';
import express from 'express';
import policyTemplatesRouter from '../routes/policyTemplates';
import policyInstancesRouter from '../routes/policyInstances';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/policy-templates', policyTemplatesRouter);
app.use('/api/policy-instances', policyInstancesRouter);

describe('Policy Template API Integration Tests', () => {
  let authToken: string;
  let testClient: any;

  beforeAll(async () => {
    authToken = await getAuthToken();
  });

  beforeEach(async () => {
    // Clean up
    await testPrisma.policyInstance.deleteMany();
    await testPrisma.policyTemplate.deleteMany();

    // Create test client
    testClient = await createTestClient();
  });

  describe('GET /api/policy-templates', () => {
    beforeEach(async () => {
      // Create test templates
      await PolicyTemplateService.createTemplate({
        policyNumber: 'API-001',
        policyType: 'Life',
        provider: 'API Provider A',
        description: 'API test template 1'
      });
      await PolicyTemplateService.createTemplate({
        policyNumber: 'API-002',
        policyType: 'Health',
        provider: 'API Provider B'
      });
    });

    it('should return policy templates with pagination', async () => {
      const response = await request(app)
        .get('/api/policy-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      });
    });

    it('should filter templates by search query', async () => {
      const response = await request(app)
        .get('/api/policy-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'API-001' })
        .expect(200);

      expect(response.body.data.templates).toHaveLength(1);
      expect(response.body.data.templates[0].policyNumber).toBe('API-001');
    });

    it('should filter templates by policy type', async () => {
      const response = await request(app)
        .get('/api/policy-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ policyTypes: ['Life'] })
        .expect(200);

      expect(response.body.data.templates).toHaveLength(1);
      expect(response.body.data.templates[0].policyType).toBe('Life');
    });

    it('should return statistics with templates', async () => {
      const response = await request(app)
        .get('/api/policy-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalTemplates).toBe(2);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/policy-templates')
        .expect(401);
    });
  });

  describe('POST /api/policy-templates', () => {
    it('should create policy template with valid data', async () => {
      const templateData = {
        policyNumber: 'CREATE-001',
        policyType: 'Auto',
        provider: 'Create Provider',
        description: 'Created via API'
      };

      const response = await request(app)
        .post('/api/policy-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(templateData);
      expect(response.body.data.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        policyType: 'Life',
        provider: 'Test Provider'
        // Missing policyNumber
      };

      const response = await request(app)
        .post('/api/policy-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Policy number is required');
    });

    it('should prevent duplicate policy numbers', async () => {
      const templateData = {
        policyNumber: 'DUPLICATE-001',
        policyType: 'Life',
        provider: 'Test Provider'
      };

      // Create first template
      await request(app)
        .post('/api/policy-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/policy-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate policy type', async () => {
      const invalidData = {
        policyNumber: 'INVALID-001',
        policyType: 'InvalidType',
        provider: 'Test Provider'
      };

      const response = await request(app)
        .post('/api/policy-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid policy type');
    });
  });

  describe('GET /api/policy-templates/:id', () => {
    let testTemplate: any;

    beforeEach(async () => {
      testTemplate = await PolicyTemplateService.createTemplate({
        policyNumber: 'DETAIL-001',
        policyType: 'Life',
        provider: 'Detail Provider'
      });
    });

    it('should return template with instances and stats', async () => {
      // Add instance to template
      await PolicyInstanceService.createInstance(testClient.id, {
        policyTemplateId: testTemplate.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      const response = await request(app)
        .get(`/api/policy-templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toMatchObject({
        id: testTemplate.id,
        policyNumber: 'DETAIL-001'
      });
      expect(response.body.data.instances).toHaveLength(1);
      expect(response.body.data.stats).toBeDefined();
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .get('/api/policy-templates/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/policy-templates/:id', () => {
    let testTemplate: any;

    beforeEach(async () => {
      testTemplate = await PolicyTemplateService.createTemplate({
        policyNumber: 'UPDATE-001',
        policyType: 'Life',
        provider: 'Update Provider'
      });
    });

    it('should update template with valid data', async () => {
      const updateData = {
        provider: 'Updated Provider',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/policy-templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.provider).toBe('Updated Provider');
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should validate policy type on update', async () => {
      const invalidUpdate = {
        policyType: 'InvalidType'
      };

      const response = await request(app)
        .put(`/api/policy-templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid policy type');
    });

    it('should prevent duplicate policy numbers on update', async () => {
      // Create another template
      await PolicyTemplateService.createTemplate({
        policyNumber: 'EXISTING-001',
        policyType: 'Health',
        provider: 'Existing Provider'
      });

      const duplicateUpdate = {
        policyNumber: 'EXISTING-001'
      };

      const response = await request(app)
        .put(`/api/policy-templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateUpdate)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('DELETE /api/policy-templates/:id', () => {
    let testTemplate: any;

    beforeEach(async () => {
      testTemplate = await PolicyTemplateService.createTemplate({
        policyNumber: 'DELETE-001',
        policyType: 'Life',
        provider: 'Delete Provider'
      });
    });

    it('should delete template without instances', async () => {
      const response = await request(app)
        .delete(`/api/policy-templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.affectedClients).toBe(0);
    });

    it('should delete template with instances', async () => {
      // Add instance to template
      await PolicyInstanceService.createInstance(testClient.id, {
        policyTemplateId: testTemplate.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      const response = await request(app)
        .delete(`/api/policy-templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.affectedClients).toBe(1);

      // Verify instances are deleted
      const instances = await testPrisma.policyInstance.findMany({
        where: { policyTemplateId: testTemplate.id }
      });
      expect(instances).toHaveLength(0);
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .delete('/api/policy-templates/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/policy-templates/search', () => {
    beforeEach(async () => {
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
    });

    it('should search templates by query', async () => {
      const response = await request(app)
        .get('/api/policy-templates/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'SEARCH-001' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].policyNumber).toBe('SEARCH-001');
    });

    it('should exclude templates for specific client', async () => {
      const template = await testPrisma.policyTemplate.findFirst({
        where: { policyNumber: 'SEARCH-001' }
      });

      // Create instance for client
      await PolicyInstanceService.createInstance(testClient.id, {
        policyTemplateId: template!.id,
        premiumAmount: 1000,
        startDate: '2024-01-01',
        durationMonths: 12,
        commissionAmount: 100
      });

      const response = await request(app)
        .get('/api/policy-templates/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          query: 'SEARCH',
          excludeClientId: testClient.id
        })
        .expect(200);

      expect(response.body.data.map((t: any) => t.policyNumber)).not.toContain('SEARCH-001');
      expect(response.body.data.map((t: any) => t.policyNumber)).toContain('SEARCH-002');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/policy-templates/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          query: 'SEARCH',
          limit: 1
        })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('Policy Instance API Endpoints', () => {
    let testTemplate: any;

    beforeEach(async () => {
      testTemplate = await PolicyTemplateService.createTemplate({
        policyNumber: 'INSTANCE-001',
        policyType: 'Life',
        provider: 'Instance Provider'
      });
    });

    describe('POST /api/policy-instances', () => {
      it('should create policy instance with valid data', async () => {
        const instanceData = {
          policyTemplateId: testTemplate.id,
          clientId: testClient.id,
          premiumAmount: 1000,
          startDate: '2024-01-01',
          durationMonths: 12,
          commissionAmount: 100
        };

        const response = await request(app)
          .post('/api/policy-instances')
          .set('Authorization', `Bearer ${authToken}`)
          .send(instanceData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.premiumAmount).toBe(1000);
        expect(response.body.data.policyTemplate).toBeDefined();
      });

      it('should validate instance data', async () => {
        const invalidData = {
          policyTemplateId: testTemplate.id,
          clientId: testClient.id,
          premiumAmount: -100, // Invalid negative amount
          startDate: '2024-01-01',
          durationMonths: 12,
          commissionAmount: 100
        };

        const response = await request(app)
          .post('/api/policy-instances')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Premium amount must be greater than 0');
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
        await request(app)
          .post('/api/policy-instances')
          .set('Authorization', `Bearer ${authToken}`)
          .send(instanceData)
          .expect(201);

        // Try to create duplicate
        const response = await request(app)
          .post('/api/policy-instances')
          .set('Authorization', `Bearer ${authToken}`)
          .send(instanceData)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already has this policy template');
      });
    });

    describe('PUT /api/policy-instances/:id', () => {
      let testInstance: any;

      beforeEach(async () => {
        testInstance = await PolicyInstanceService.createInstance(testClient.id, {
          policyTemplateId: testTemplate.id,
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

        const response = await request(app)
          .put(`/api/policy-instances/${testInstance.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.premiumAmount).toBe(1200);
        expect(response.body.data.commissionAmount).toBe(120);
      });

      it('should recalculate expiry date when duration changes', async () => {
        const updateData = {
          durationMonths: 24
        };

        const response = await request(app)
          .put(`/api/policy-instances/${testInstance.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        const expectedExpiry = new Date('2024-01-01');
        expectedExpiry.setMonth(expectedExpiry.getMonth() + 24);
        
        expect(new Date(response.body.data.expiryDate)).toEqual(expectedExpiry);
      });
    });

    describe('DELETE /api/policy-instances/:id', () => {
      let testInstance: any;

      beforeEach(async () => {
        testInstance = await PolicyInstanceService.createInstance(testClient.id, {
          policyTemplateId: testTemplate.id,
          premiumAmount: 1000,
          startDate: '2024-01-01',
          durationMonths: 12,
          commissionAmount: 100
        });
      });

      it('should delete instance successfully', async () => {
        const response = await request(app)
          .delete(`/api/policy-instances/${testInstance.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify instance is deleted
        const instances = await testPrisma.policyInstance.findMany({
          where: { id: testInstance.id }
        });
        expect(instances).toHaveLength(0);
      });

      it('should return 404 for non-existent instance', async () => {
        const response = await request(app)
          .delete('/api/policy-instances/non-existent-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/policy-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle database connection errors', async () => {
      // This would require mocking the database connection
      // Implementation depends on your error handling strategy
    });

    it('should validate UUID format for IDs', async () => {
      const response = await request(app)
        .get('/api/policy-templates/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid ID format');
    });

    it('should handle concurrent modifications gracefully', async () => {
      const template = await PolicyTemplateService.createTemplate({
        policyNumber: 'CONCURRENT-001',
        policyType: 'Life',
        provider: 'Concurrent Provider'
      });

      // Simulate concurrent updates
      const update1Promise = request(app)
        .put(`/api/policy-templates/${template.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'Provider 1' });

      const update2Promise = request(app)
        .put(`/api/policy-templates/${template.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'Provider 2' });

      const [response1, response2] = await Promise.all([update1Promise, update2Promise]);

      // At least one should succeed
      expect(response1.status === 200 || response2.status === 200).toBe(true);
    });
  });
});