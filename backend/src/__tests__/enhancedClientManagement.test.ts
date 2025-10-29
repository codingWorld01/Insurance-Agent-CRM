import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import { prisma } from '../services/database';

describe('Enhanced Client Management API', () => {
  let authToken: string;
  let testClientId: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    if (testClientId) {
      await prisma.client.delete({
        where: { id: testClientId }
      }).catch(() => {
        // Ignore if already deleted
      });
    }
  });

  describe('POST /api/enhanced-clients', () => {
    it('should create a personal client', async () => {
      const personalClientData = {
        clientType: 'PERSONAL',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '9876543210',
        personalDetails: {
          mobileNumber: '9876543210',
          birthDate: '1990-01-01',
          age: 34,
          state: 'Maharashtra',
          city: 'Mumbai',
          address: '123 Test Street',
          gender: 'MALE',
          maritalStatus: 'SINGLE',
          panNumber: 'ABCDE1234F'
        }
      };

      const response = await request(app)
        .post('/api/enhanced-clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(personalClientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clientType).toBe('PERSONAL');
      expect(response.body.data.firstName).toBe('John');
      expect(response.body.data.lastName).toBe('Doe');
      expect(response.body.data.personalDetails).toBeDefined();
      expect(response.body.data.personalDetails.mobileNumber).toBe('9876543210');

      testClientId = response.body.data.id;
    });

    it('should create a family/employee client', async () => {
      const familyClientData = {
        clientType: 'FAMILY_EMPLOYEE',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '9876543211',
        familyDetails: {
          phoneNumber: '9876543211',
          whatsappNumber: '9876543211',
          dateOfBirth: '1985-05-15',
          age: 39,
          gender: 'FEMALE',
          relationship: 'SPOUSE'
        }
      };

      const response = await request(app)
        .post('/api/enhanced-clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(familyClientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clientType).toBe('FAMILY_EMPLOYEE');
      expect(response.body.data.familyDetails).toBeDefined();
      expect(response.body.data.familyDetails.relationship).toBe('SPOUSE');

      // Clean up
      await prisma.client.delete({
        where: { id: response.body.data.id }
      });
    });

    it('should create a corporate client', async () => {
      const corporateClientData = {
        clientType: 'CORPORATE',
        firstName: 'Acme Corp',
        email: 'contact@acme.com',
        phone: '9876543212',
        corporateDetails: {
          companyName: 'Acme Corporation',
          mobile: '9876543212',
          email: 'contact@acme.com',
          state: 'Karnataka',
          city: 'Bangalore',
          gstNumber: '29ABCDE1234F1Z5'
        }
      };

      const response = await request(app)
        .post('/api/enhanced-clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(corporateClientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clientType).toBe('CORPORATE');
      expect(response.body.data.corporateDetails).toBeDefined();
      expect(response.body.data.corporateDetails.gstNumber).toBe('29ABCDE1234F1Z5');

      // Clean up
      await prisma.client.delete({
        where: { id: response.body.data.id }
      });
    });
  });

  describe('GET /api/enhanced-clients', () => {
    it('should get all enhanced clients with filtering', async () => {
      const response = await request(app)
        .get('/api/enhanced-clients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 10,
          clientType: 'PERSONAL'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clients).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/enhanced-clients/:id', () => {
    it('should get a specific enhanced client', async () => {
      if (!testClientId) {
        return; // Skip if no test client created
      }

      const response = await request(app)
        .get(`/api/enhanced-clients/${testClientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testClientId);
      expect(response.body.data.personalDetails).toBeDefined();
    });
  });

  describe('PUT /api/enhanced-clients/:id', () => {
    it('should update an enhanced client', async () => {
      if (!testClientId) {
        return; // Skip if no test client created
      }

      const updateData = {
        firstName: 'John Updated',
        personalDetails: {
          city: 'Delhi'
        }
      };

      const response = await request(app)
        .put(`/api/enhanced-clients/${testClientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('John Updated');
    });
  });

  describe('Validation', () => {
    it('should validate PAN number format', async () => {
      const invalidPanData = {
        clientType: 'PERSONAL',
        firstName: 'Test',
        lastName: 'User',
        personalDetails: {
          mobileNumber: '9876543210',
          birthDate: '1990-01-01',
          panNumber: 'INVALID_PAN'
        }
      };

      const response = await request(app)
        .post('/api/enhanced-clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPanData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should validate GST number format', async () => {
      const invalidGstData = {
        clientType: 'CORPORATE',
        firstName: 'Test Corp',
        corporateDetails: {
          companyName: 'Test Corporation',
          gstNumber: 'INVALID_GST'
        }
      };

      const response = await request(app)
        .post('/api/enhanced-clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidGstData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should validate phone number format', async () => {
      const invalidPhoneData = {
        clientType: 'PERSONAL',
        firstName: 'Test',
        lastName: 'User',
        personalDetails: {
          mobileNumber: '123', // Invalid phone number
          birthDate: '1990-01-01'
        }
      };

      const response = await request(app)
        .post('/api/enhanced-clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPhoneData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });
});