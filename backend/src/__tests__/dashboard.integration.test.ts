import request from 'supertest';
import '../types/jest';
import app from '../app';
import { testPrisma, getAuthToken, createTestLead, createTestClient, createTestPolicy } from './setup';

describe('Dashboard Integration Tests', () => {
  let authToken: string;

  beforeEach(async () => {
    authToken = await getAuthToken();
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard statistics with zero values when no data exists', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        totalLeads: 0,
        totalClients: 0,
        activePolices: 0,
        commissionThisMonth: 0,
        leadsChange: 0,
        clientsChange: 0,
        policiesChange: 0,
        commissionChange: 0,
      });
    });

    it('should return correct statistics with sample data', async () => {
      // Create test data
      await createTestLead({ status: 'New' });
      await createTestLead({ status: 'Contacted' });
      
      const client = await createTestClient();
      await createTestPolicy(client.id, { 
        commissionAmount: 500,
        startDate: new Date(), // This month
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalLeads).toBe(2);
      expect(response.body.data.totalClients).toBe(1);
      expect(response.body.data.activePolices).toBe(1);
      expect(response.body.data.commissionThisMonth).toBe(500);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should handle database errors gracefully', async () => {
      // Disconnect Prisma to simulate database error
      await testPrisma.$disconnect();

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/dashboard/chart-data', () => {
    it('should return empty chart data when no leads exist', async () => {
      const response = await request(app)
        .get('/api/dashboard/chart-data')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return leads grouped by status', async () => {
      // Create leads with different statuses
      await createTestLead({ status: 'New' });
      await createTestLead({ status: 'New' });
      await createTestLead({ status: 'Contacted' });
      await createTestLead({ status: 'Qualified' });

      const response = await request(app)
        .get('/api/dashboard/chart-data')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          { status: 'New', count: 2 },
          { status: 'Contacted', count: 1 },
          { status: 'Qualified', count: 1 },
        ])
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/chart-data');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });
  });

  describe('GET /api/dashboard/activities', () => {
    it('should return empty activities when none exist', async () => {
      const response = await request(app)
        .get('/api/dashboard/activities')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return recent activities in descending order', async () => {
      // Create test activities
      await testPrisma.activity.create({
        data: {
          action: 'lead_created',
          description: 'Created new lead: Test Lead 1',
        },
      });

      await testPrisma.activity.create({
        data: {
          action: 'client_created',
          description: 'Added new client: Test Client 1',
        },
      });

      const response = await request(app)
        .get('/api/dashboard/activities')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].description).toBe('Added new client: Test Client 1');
      expect(response.body.data[1].description).toBe('Created new lead: Test Lead 1');
    });

    it('should limit activities to 5 most recent', async () => {
      // Create 7 activities
      for (let i = 1; i <= 7; i++) {
        await testPrisma.activity.create({
          data: {
            action: 'test_action',
            description: `Test activity ${i}`,
          },
        });
      }

      const response = await request(app)
        .get('/api/dashboard/activities')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/activities');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });
  });
});