import request from 'supertest';
import '../types/jest';
import app from '../app';
import { PrismaClient, Gender, MaritalStatus } from '@prisma/client';

const prisma = new PrismaClient();

describe('Client Management API', () => {
  beforeAll(async () => {
    // Clean up database before tests
    await prisma.auditLog.deleteMany();
    await prisma.document.deleteMany();
    await prisma.policyInstance.deleteMany();
    await prisma.policy.deleteMany();
    await prisma.client.deleteMany();
    await prisma.policyTemplate.deleteMany();
  });

  afterAll(async () => {
    // Close the Prisma client connection
    await prisma.$disconnect();
  });

  describe('POST /api/clients', () => {
    it('should create a new client with valid data', async () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01T00:00:00.000Z',
        phoneNumber: '9876543210',
        whatsappNumber: '9876543210',
        email: 'john.doe@example.com',
        state: 'California',
        city: 'San Francisco',
        address: '123 Main St',
        gender: 'MALE' as Gender,
        maritalStatus: 'SINGLE' as MaritalStatus,
        panNumber: 'ABCDE1234F',
        gstNumber: '22ABCDE1234F1Z5',
        additionalInfo: 'Test client'
      };

      const response = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201);

      // Verify response
      expect(response.body).toHaveProperty('id');
      expect(response.body).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '9876543210',
        panNumber: 'ABCDE1234F',
        gender: 'MALE',
        maritalStatus: 'SINGLE'
      });

      // Verify data in database
      const dbClient = await prisma.client.findUnique({
        where: { id: response.body.id }
      });

      expect(dbClient).toBeDefined();
      expect(dbClient).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '9876543210',
        panNumber: 'ABCDE1234F',
        gender: 'MALE',
        maritalStatus: 'SINGLE'
      });
    });

    it('should return 400 for invalid client data', async () => {
      const invalidClientData = {
        // Missing required fields: firstName, lastName, dateOfBirth, phoneNumber
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/clients')
        .send(invalidClientData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should retrieve a client by ID', async () => {
      // First create a client
      const client = await prisma.client.create({
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: new Date('1985-05-15'),
          phoneNumber: '9876543211',
          whatsappNumber: '9876543211',
          email: 'jane.smith@example.com',
          panNumber: 'FGHIJ5678K',
          gender: 'FEMALE' as Gender,
          maritalStatus: 'MARRIED' as MaritalStatus
        }
      });

      // Retrieve the client
      const response = await request(app)
        .get(`/api/clients/${client.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: client.id,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phoneNumber: '9876543211',
        panNumber: 'FGHIJ5678K',
        gender: 'FEMALE',
        maritalStatus: 'MARRIED'
      });
    });

    it('should return 404 for non-existent client', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/clients/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update an existing client', async () => {
      // First create a client
      const client = await prisma.client.create({
        data: {
          firstName: 'Original',
          lastName: 'Name',
          dateOfBirth: new Date('1990-01-01'),
          phoneNumber: '9876543222',
          whatsappNumber: '9876543222',
          email: 'original@example.com',
          panNumber: 'KLMNO5678P',
          gender: 'MALE' as Gender,
          maritalStatus: 'SINGLE' as MaritalStatus
        }
      });

      // Update the client
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        maritalStatus: 'MARRIED' as MaritalStatus
      };

      const response = await request(app)
        .put(`/api/clients/${client.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: client.id,
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        maritalStatus: 'MARRIED'
      });
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should delete a client', async () => {
      // First create a client
      const client = await prisma.client.create({
        data: {
          firstName: 'ToDelete',
          lastName: 'Client',
          dateOfBirth: new Date('1990-01-01'),
          phoneNumber: '9876543333',
          whatsappNumber: '9876543333',
          email: 'delete@example.com',
          panNumber: 'PQRST9012U'
        }
      });

      // Delete the client
      await request(app)
        .delete(`/api/clients/${client.id}`)
        .expect(200);

      // Verify client is deleted
      const deletedClient = await prisma.client.findUnique({
        where: { id: client.id }
      });

      expect(deletedClient).toBeNull();
    });
  });

  describe('Document Management Integration', () => {
    it('associates documents with clients', async () => {
      // Create a client first
      const clientData = {
        clientType: 'PERSONAL',
        firstName: 'Document',
        lastName: 'Test',
        personalDetails: {
          mobileNumber: '9876543217',
          birthDate: '1990-01-01T00:00:00.000Z'
        }
      }

      const clientResponse = await request(app)
        .post('/api/enhanced-clients')
        .send(clientData)
        .expect(201)

      const clientId = clientResponse.body.data.id

      // Add a document
      const documentData = {
        clientId,
        documentType: 'IDENTITY_PROOF',
        fileName: 'passport.pdf',
        originalName: 'passport.pdf',
        cloudinaryUrl: 'https://cloudinary.com/passport.pdf',
        cloudinaryId: 'passport_123',
        fileSize: 1024000,
        mimeType: 'application/pdf'
      }

      const docResponse = await request(app)
        .post('/api/documents')
        .send(documentData)
        .expect(201)

      expect(docResponse.body.success).toBe(true)
      expect(docResponse.body.data.documentType).toBe('IDENTITY_PROOF')

      // Verify document is associated with client
      const clientWithDocs = await request(app)
        .get(`/api/enhanced-clients/${clientId}`)
        .expect(200)

      expect(clientWithDocs.body.data.documents).toHaveLength(1)
      expect(clientWithDocs.body.data.documents[0].documentType).toBe('IDENTITY_PROOF')
    })
  })

  describe('Audit Logging Integration', () => {
    it('creates audit logs for client operations', async () => {
      // Create a client
      const clientData = {
        clientType: 'PERSONAL',
        firstName: 'Audit',
        lastName: 'Test',
        personalDetails: {
          mobileNumber: '9876543218',
          birthDate: '1990-01-01T00:00:00.000Z'
        }
      }

      const response = await request(app)
        .post('/api/enhanced-clients')
        .send(clientData)
        .expect(201)

      const clientId = response.body.data.id

      // Check if audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: { clientId }
      })

      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0].action).toBe('CREATE')
    })

    it('creates audit logs for client updates', async () => {
      // Create a client first
      const clientData = {
        clientType: 'PERSONAL',
        firstName: 'Update',
        lastName: 'Test',
        personalDetails: {
          mobileNumber: '9876543219',
          birthDate: '1990-01-01T00:00:00.000Z'
        }
      }

      const createResponse = await request(app)
        .post('/api/enhanced-clients')
        .send(clientData)
        .expect(201)

      const clientId = createResponse.body.data.id

      // Update the client
      const updateData = {
        firstName: 'Updated',
        personalDetails: {
          mobileNumber: '9876543219',
          birthDate: '1990-01-01T00:00:00.000Z',
          education: 'PhD'
        }
      }

      await request(app)
        .put(`/api/enhanced-clients/${clientId}`)
        .send(updateData)
        .expect(200)

      // Check audit logs
      const auditLogs = await prisma.auditLog.findMany({
        where: { clientId },
        orderBy: { changedAt: 'asc' }
      })

      expect(auditLogs).toHaveLength(2)
      expect(auditLogs[0].action).toBe('CREATE')
      expect(auditLogs[1].action).toBe('UPDATE')
    })
  })

  describe('Validation Integration', () => {
    it('validates PAN number format across all client types', async () => {
      const testCases = [
        {
          clientType: 'PERSONAL',
          firstName: 'Test',
          lastName: 'Personal',
          personalDetails: {
            mobileNumber: '9876543220',
            birthDate: '1990-01-01T00:00:00.000Z',
            panNumber: 'INVALID_PAN'
          }
        },
        {
          clientType: 'FAMILY_EMPLOYEE',
          firstName: 'Test',
          lastName: 'Family',
          familyDetails: {
            phoneNumber: '9876543221',
            whatsappNumber: '9876543222',
            dateOfBirth: '1990-01-01T00:00:00.000Z',
            panNumber: 'INVALID_PAN'
          }
        },
        {
          clientType: 'CORPORATE',
          firstName: 'Test Corp',
          corporateDetails: {
            companyName: 'Test Corp',
            panNumber: 'INVALID_PAN'
          }
        }
      ]

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/enhanced-clients')
          .send(testCase)
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.errors).toBeDefined()
      }
    })

    it('validates email format across applicable client types', async () => {
      const personalClientData = {
        clientType: 'PERSONAL',
        firstName: 'Test',
        lastName: 'Email',
        email: 'invalid-email-format',
        personalDetails: {
          mobileNumber: '9876543223',
          birthDate: '1990-01-01T00:00:00.000Z'
        }
      }

      const response = await request(app)
        .post('/api/enhanced-clients')
        .send(personalClientData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('Search and Filtering Integration', () => {
    beforeEach(async () => {
      // Create test clients for search
      const clients = [
        {
          clientType: 'PERSONAL',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          personalDetails: {
            mobileNumber: '9876543224',
            birthDate: '1990-01-01T00:00:00.000Z'
          }
        },
        {
          clientType: 'FAMILY_EMPLOYEE',
          firstName: 'Jane',
          lastName: 'Smith',
          familyDetails: {
            phoneNumber: '9876543225',
            whatsappNumber: '9876543226',
            dateOfBirth: '1985-05-15T00:00:00.000Z',
            relationship: 'SPOUSE'
          }
        },
        {
          clientType: 'CORPORATE',
          firstName: 'Tech Corp',
          corporateDetails: {
            companyName: 'Tech Corp',
            email: 'contact@techcorp.com'
          }
        }
      ]

      for (const client of clients) {
        await request(app)
          .post('/api/enhanced-clients')
          .send(client)
          .expect(201)
      }
    })

    it('filters clients by type', async () => {
      const response = await request(app)
        .get('/api/enhanced-clients?clientType=PERSONAL')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].clientType).toBe('PERSONAL')
    })

    it('searches clients by name', async () => {
      const response = await request(app)
        .get('/api/enhanced-clients?search=John')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].firstName).toBe('John')
    })

    it('searches clients by email', async () => {
      const response = await request(app)
        .get('/api/enhanced-clients?search=john@example.com')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].email).toBe('john@example.com')
    })
  })
})