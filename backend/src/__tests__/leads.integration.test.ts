import request from 'supertest';
import app from '../app';
import { testPrisma, getAuthToken, createTestLead, createTestClient } from './setup';

describe('Leads Integration Tests', () => {
  let authToken: string;

  beforeEach(async () => {
    authToken = await getAuthToken();
  });

  describe('GET /api/leads', () => {
    it('should return empty array when no leads exist', async () => {
      const response = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return all leads with pagination', async () => {
      await createTestLead({ name: 'Lead 1' });
      await createTestLead({ name: 'Lead 2' });

      const response = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter leads by search term', async () => {
      await createTestLead({ name: 'John Doe' });
      await createTestLead({ name: 'Jane Smith' });

      const response = await request(app)
        .get('/api/leads?search=John')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('John Doe');
    });

    it('should filter leads by status', async () => {
      await createTestLead({ status: 'New' });
      await createTestLead({ status: 'Contacted' });

      const response = await request(app)
        .get('/api/leads?status=New')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('New');
    });

    it('should handle pagination correctly', async () => {
      // Create 3 leads
      for (let i = 1; i <= 3; i++) {
        await createTestLead({ name: `Lead ${i}` });
      }

      const response = await request(app)
        .get('/api/leads?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/leads');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/leads', () => {
    const validLeadData = {
      name: 'New Lead',
      email: 'newlead@test.com',
      phone: '1234567890',
      insuranceInterest: 'Life',
      status: 'New',
      priority: 'Warm',
      notes: 'Test notes',
    };

    it('should create a new lead successfully', async () => {
      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validLeadData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validLeadData.name);
      expect(response.body.data.email).toBe(validLeadData.email);

      // Verify lead was created in database
      const lead = await testPrisma.lead.findUnique({
        where: { id: response.body.data.id },
      });
      expect(lead).toBeTruthy();
    });

    it('should create activity log when lead is created', async () => {
      await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validLeadData);

      const activities = await testPrisma.activity.findMany();
      expect(activities).toHaveLength(1);
      expect(activities[0].description).toContain('Created new lead: New Lead');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validLeadData, email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail with invalid phone format', async () => {
      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validLeadData, phone: '123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/leads')
        .send(validLeadData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/leads/:id', () => {
    it('should return lead by ID', async () => {
      const lead = await createTestLead();

      const response = await request(app)
        .get(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(lead.id);
      expect(response.body.data.name).toBe(lead.name);
    });

    it('should return 404 for non-existent lead', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/leads/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Lead not found');
    });

    it('should fail with invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/leads/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should require authentication', async () => {
      const lead = await createTestLead();

      const response = await request(app)
        .get(`/api/leads/${lead.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/leads/:id', () => {
    it('should update lead successfully', async () => {
      const lead = await createTestLead();
      const updateData = { name: 'Updated Lead Name', status: 'Contacted' };

      const response = await request(app)
        .put(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.status).toBe(updateData.status);

      // Verify update in database
      const updatedLead = await testPrisma.lead.findUnique({
        where: { id: lead.id },
      });
      expect(updatedLead?.name).toBe(updateData.name);
    });

    it('should create activity log when lead status is updated', async () => {
      const lead = await createTestLead();

      await request(app)
        .put(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'Contacted' });

      const activities = await testPrisma.activity.findMany();
      expect(activities).toHaveLength(1);
      expect(activities[0].description).toContain('Updated lead status: Test Lead');
    });

    it('should return 404 for non-existent lead', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .put(`/api/leads/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Lead not found');
    });

    it('should fail with invalid data', async () => {
      const lead = await createTestLead();

      const response = await request(app)
        .put(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should require authentication', async () => {
      const lead = await createTestLead();

      const response = await request(app)
        .put(`/api/leads/${lead.id}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/leads/:id', () => {
    it('should delete lead successfully', async () => {
      const lead = await createTestLead();

      const response = await request(app)
        .delete(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Lead deleted successfully');

      // Verify deletion in database
      const deletedLead = await testPrisma.lead.findUnique({
        where: { id: lead.id },
      });
      expect(deletedLead).toBeNull();
    });

    it('should create activity log when lead is deleted', async () => {
      const lead = await createTestLead();

      await request(app)
        .delete(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const activities = await testPrisma.activity.findMany();
      expect(activities).toHaveLength(1);
      expect(activities[0].description).toContain('Deleted lead: Test Lead');
    });

    it('should return 404 for non-existent lead', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .delete(`/api/leads/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Lead not found');
    });

    it('should require authentication', async () => {
      const lead = await createTestLead();

      const response = await request(app)
        .delete(`/api/leads/${lead.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/leads/:id/convert', () => {
    it('should convert lead to client successfully', async () => {
      const lead = await createTestLead({
        name: 'Lead to Convert',
        email: 'convert@test.com',
        phone: '9876543210',
      });

      const response = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dateOfBirth: '1990-01-01',
          address: '123 Convert St',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.client.name).toBe('Lead to Convert');
      expect(response.body.data.client.email).toBe('convert@test.com');

      // Verify lead status updated to Won
      const updatedLead = await testPrisma.lead.findUnique({
        where: { id: lead.id },
      });
      expect(updatedLead?.status).toBe('Won');

      // Verify client was created
      const client = await testPrisma.client.findUnique({
        where: { email: 'convert@test.com' },
      });
      expect(client).toBeTruthy();
    });

    it('should create activity log when lead is converted', async () => {
      const lead = await createTestLead();

      await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dateOfBirth: '1990-01-01',
        });

      const activities = await testPrisma.activity.findMany();
      expect(activities).toHaveLength(1);
      expect(activities[0].description).toContain('Converted lead to client: Test Lead');
    });

    it('should fail if client with same email already exists', async () => {
      const lead = await createTestLead({ email: 'existing@test.com' });
      await createTestClient({ email: 'existing@test.com' });

      const response = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dateOfBirth: '1990-01-01',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('A record with this information already exists');
    });

    it('should return 404 for non-existent lead', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .post(`/api/leads/${fakeId}/convert`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dateOfBirth: '1990-01-01',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Lead not found');
    });

    it('should require authentication', async () => {
      const lead = await createTestLead();

      const response = await request(app)
        .post(`/api/leads/${lead.id}/convert`)
        .send({
          dateOfBirth: '1990-01-01',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});