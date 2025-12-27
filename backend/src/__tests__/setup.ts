import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { hashPassword } from '../services/authService';

// Test database URL - should be different from development
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/insurance_crm_test';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

// Create a new Prisma client for testing
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DATABASE_URL,
    },
  },
});

// Global test setup
beforeAll(async () => {
  // Reset the test database
  try {
    execSync('npx prisma migrate reset --force --skip-seed', {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'inherit',
    });
  } catch (error) {
    console.warn('Could not reset database, continuing with existing state');
  }

  // Seed test data
  await seedTestData();
});

// Clean up after all tests
afterAll(async () => {
  await testPrisma.$disconnect();
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data but keep the settings record
  await testPrisma.activity.deleteMany();
  await testPrisma.policy.deleteMany();
  await testPrisma.client.deleteMany();
  await testPrisma.lead.deleteMany();
  
  // Re-seed settings if needed
  const settings = await testPrisma.settings.findFirst();
  if (!settings) {
    await seedTestData();
  }
});

// Seed basic test data
async function seedTestData() {
  const passwordHash = await hashPassword('Amit@123');
  
  // Check if settings already exist
  const existingSettings = await testPrisma.settings.findFirst({
    where: { agentEmail: 'test@agent.com' }
  });

  if (!existingSettings) {
    await testPrisma.settings.create({
      data: {
        passwordHash,
        agentName: 'Test Agent',
        agentEmail: 'test@agent.com',
      },
    });
  }
}

// Helper function to create test leads
export async function createTestLead(overrides: any = {}) {
  return testPrisma.lead.create({
    data: {
      name: 'Test Lead',
      email: 'lead@test.com',
      phone: '1234567890',
      insuranceInterest: 'Life',
      status: 'New',
      priority: 'Warm',
      notes: 'Test notes',
      ...overrides,
    },
  });
}

// Helper function to create test clients
export async function createTestClient(overrides: any = {}) {
  return testPrisma.client.create({
    data: {
      name: 'Test Client',
      email: 'client@test.com',
      phone: '1234567890',
      dateOfBirth: new Date('1990-01-01'),
      address: '123 Test St',
      ...overrides,
    },
  });
}

// Helper function to create test policies
export async function createTestPolicy(clientId: string, overrides: any = {}) {
  return testPrisma.policy.create({
    data: {
      policyNumber: 'POL-001',
      policyType: 'Life',
      provider: 'Test Insurance Co',
      premiumAmount: 1000,
      status: 'Active',
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      commissionAmount: 100,
      clientId,
      ...overrides,
    },
  });
}

// Helper function to get auth token for tests
export async function getAuthToken() {
  const { generateToken } = await import('../services/authService');
  const settings = await testPrisma.settings.findFirst();
  
  if (!settings) {
    throw new Error('No settings found for test authentication');
  }
  
  return generateToken({
    id: settings.id,  // Required by JWTPayload interface
    userId: settings.id,
    email: settings.agentEmail,
  });
}