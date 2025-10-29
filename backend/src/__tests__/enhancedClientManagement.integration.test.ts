import request from 'supertest'
import { app } from '../app'
import { prisma } from '../config/database'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Enhanced Client Management Integration Tests', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.auditLog.deleteMany()
    await prisma.document.deleteMany()
    await prisma.personalDetails.deleteMany()
    await prisma.familyDetails.deleteMany()
    await prisma.corporateDetails.deleteMany()
    await prisma.client.deleteMany()
  })

  afterEach(async () => {
    // Clean up after each test
    await prisma.auditLog.deleteMany()
    await prisma.document.deleteMany()
    await prisma.personalDetails.deleteMany()
    await prisma.familyDetails.deleteMany()
    await prisma.corporateDetails.deleteMany()
    await prisma.client.deleteMany()
  })

  describe('Personal Client CRUD Operations', () => {
    it('creates a personal client with all details', async () => {
      const clientData = {
        clientType: 'PERSONAL',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '9876543210',
        personalDetails: {
          middleName: 'Michael',
          mobileNumber: '9876543210',
          birthDate: '1990-01-01T00:00:00.000Z',
          age: 34,
          state: 'California',
          city: 'San Francisco',
          address: '123 Main Street',
          birthPlace: 'New York',
          gender: 'MALE',
          height: 5.8,
          weight: 70,
          education: 'Bachelor of Science',
          maritalStatus: 'SINGLE',
          businessJob: 'Software Engineer',
          nameOfBusiness: 'Tech Corp',
          typeOfDuty: 'Development',
          annualIncome: 1000000,
          panNumber: 'ABCDE1234F',
          gstNumber: '22AAAAA0000A1Z5'
        }
      }

      const response = await request(app)
        .post('/api/enhanced-clients')
        .send(clientData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject({
        clientType: 'PERSONAL',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '9876543210'
      })

      // Verify personal details were created
      const client = await prisma.client.findUnique({
        where: { id: response.body.data.id },
        include: { personalDetails: true }
      })

      expect(client?.personalDetails).toMatchObject({
        middleName: 'Michael',
        mobileNumber: '9876543210',
        age: 34,
        panNumber: 'ABCDE1234F'
      })
    })
  })
})    i
t('validates required fields for personal client', async () => {
      const invalidClientData = {
        clientType: 'PERSONAL',
        // Missing required fields
        personalDetails: {
          // Missing mobileNumber and birthDate
          age: 30
        }
      }

      const response = await request(app)
        .post('/api/enhanced-clients')
        .send(invalidClientData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('retrieves personal client with all details', async () => {
      // First create a client
      const clientData = {
        clientType: 'PERSONAL',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '9876543211',
        personalDetails: {
          mobileNumber: '9876543211',
          birthDate: '1985-05-15T00:00:00.000Z',
          age: 39,
          panNumber: 'FGHIJ5678K'
        }
      }

      const createResponse = await request(app)
        .post('/api/enhanced-clients')
        .send(clientData)
        .expect(201)

      const clientId = createResponse.body.data.id

      // Retrieve the client
      const getResponse = await request(app)
        .get(`/api/enhanced-clients/${clientId}`)
        .expect(200)

      expect(getResponse.body.success).toBe(true)
      expect(getResponse.body.data).toMatchObject({
        clientType: 'PERSONAL',
        firstName: 'Jane',
        lastName: 'Smith',
        personalDetails: {
          mobileNumber: '9876543211',
          age: 39,
          panNumber: 'FGHIJ5678K'
        }
      })
    })

    it('updates personal client details', async () => {
      // Create a client first
      const clientData = {
        clientType: 'PERSONAL',
        firstName: 'Bob',
        lastName: 'Wilson',
        personalDetails: {
          mobileNumber: '9876543212',
          birthDate: '1980-12-25T00:00:00.000Z'
        }
      }

      const createResponse = await request(app)
        .post('/api/enhanced-clients')
        .send(clientData)
        .expect(201)

      const clientId = createResponse.body.data.id

      // Update the client
      const updateData = {
        firstName: 'Robert',
        email: 'robert.wilson@example.com',
        personalDetails: {
          mobileNumber: '9876543212',
          birthDate: '1980-12-25T00:00:00.000Z',
          education: 'Master of Science',
          annualIncome: 1500000
        }
      }

      const updateResponse = await request(app)
        .put(`/api/enhanced-clients/${clientId}`)
        .send(updateData)
        .expect(200)

      expect(updateResponse.body.success).toBe(true)
      expect(updateResponse.body.data.firstName).toBe('Robert')
      expect(updateResponse.body.data.email).toBe('robert.wilson@example.com')
    })

    it('deletes personal client and related data', async () => {
      // Create a client first
      const clientData = {
        clientType: 'PERSONAL',
        firstName: 'Alice',
        lastName: 'Johnson',
        personalDetails: {
          mobileNumber: '9876543213',
          birthDate: '1992-03-10T00:00:00.000Z'
        }
      }

      const createResponse = await request(app)
        .post('/api/enhanced-clients')
        .send(clientData)
        .expect(201)

      const clientId = createResponse.body.data.id

      // Delete the client
      await request(app)
        .delete(`/api/enhanced-clients/${clientId}`)
        .expect(200)

      // Verify client is deleted
      await request(app)
        .get(`/api/enhanced-clients/${clientId}`)
        .expect(404)

      // Verify personal details are also deleted
      const personalDetails = await prisma.personalDetails.findFirst({
        where: { clientId }
      })
      expect(personalDetails).toBeNull()
    })
  })

  describe('Family/Employee Client CRUD Operations', () => {
    it('creates a family/employee client with relationship', async () => {
      const clientData = {
        clientType: 'FAMILY_EMPLOYEE',
        firstName: 'Sarah',
        lastName: 'Connor',
        familyDetails: {
          phoneNumber: '9876543214',
          whatsappNumber: '9876543215',
          dateOfBirth: '1988-07-20T00:00:00.000Z',
          age: 36,
          relationship: 'SPOUSE',
          gender: 'FEMALE',
          panNumber: 'KLMNO9012P'
        }
      }

      const response = await request(app)
        .post('/api/enhanced-clients')
        .send(clientData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.clientType).toBe('FAMILY_EMPLOYEE')

      // Verify family details were created
      const client = await prisma.client.findUnique({
        where: { id: response.body.data.id },
        include: { familyDetails: true }
      })

      expect(client?.familyDetails).toMatchObject({
        phoneNumber: '9876543214',
        whatsappNumber: '9876543215',
        relationship: 'SPOUSE',
        gender: 'FEMALE'
      })
    })

    it('validates required fields for family/employee client', async () => {
      const invalidClientData = {
        clientType: 'FAMILY_EMPLOYEE',
        firstName: 'Test',
        familyDetails: {
          // Missing required phoneNumber, whatsappNumber, dateOfBirth
          relationship: 'CHILD'
        }
      }

      const response = await request(app)
        .post('/api/enhanced-clients')
        .send(invalidClientData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('Corporate Client CRUD Operations', () => {
    it('creates a corporate client with business details', async () => {
      const clientData = {
        clientType: 'CORPORATE',
        firstName: 'Tech Solutions Inc', // Company name stored in firstName
        corporateDetails: {
          companyName: 'Tech Solutions Inc',
          mobile: '9876543216',
          email: 'contact@techsolutions.com',
          state: 'Maharashtra',
          city: 'Mumbai',
          address: '456 Business Avenue',
          annualIncome: 50000000,
          panNumber: 'QRSTU3456V',
          gstNumber: '27QRSTU3456V1Z8'
        }
      }

      const response = await request(app)
        .post('/api/enhanced-clients')
        .send(clientData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.clientType).toBe('CORPORATE')

      // Verify corporate details were created
      const client = await prisma.client.findUnique({
        where: { id: response.body.data.id },
        include: { corporateDetails: true }
      })

      expect(client?.corporateDetails).toMatchObject({
        companyName: 'Tech Solutions Inc',
        mobile: '9876543216',
        email: 'contact@techsolutions.com',
        gstNumber: '27QRSTU3456V1Z8'
      })
    })

    it('validates GST number format for corporate client', async () => {
      const clientData = {
        clientType: 'CORPORATE',
        firstName: 'Invalid Corp',
        corporateDetails: {
          companyName: 'Invalid Corp',
          gstNumber: 'INVALID_GST_FORMAT'
        }
      }

      const response = await request(app)
        .post('/api/enhanced-clients')
        .send(clientData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })
  })

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