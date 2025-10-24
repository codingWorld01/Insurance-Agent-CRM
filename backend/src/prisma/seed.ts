import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../services/authService';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default settings with hashed password
  const passwordHash = await hashPassword('admin123');
  
  const settings = await prisma.settings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      passwordHash,
      agentName: 'Insurance Agent',
      agentEmail: 'agent@insurancecrm.com',
    },
  });

  console.log('✅ Created default settings');

  // Create sample leads
  const sampleLeads = [
    {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '5551234567',
      insuranceInterest: 'Life',
      status: 'New',
      priority: 'Hot',
      notes: 'Interested in term life insurance for family protection'
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '5559876543',
      insuranceInterest: 'Auto',
      status: 'Contacted',
      priority: 'Warm',
      notes: 'Looking for better auto insurance rates'
    },
    {
      name: 'Mike Davis',
      email: 'mike.davis@email.com',
      phone: '5555551234',
      insuranceInterest: 'Health',
      status: 'Qualified',
      priority: 'Hot',
      notes: 'Self-employed, needs comprehensive health coverage'
    }
  ];

  for (const lead of sampleLeads) {
    await prisma.lead.upsert({
      where: { email: lead.email },
      update: {},
      create: lead,
    });
  }

  console.log('✅ Created sample leads');

  // Create sample clients
  const sampleClients = [
    {
      name: 'Robert Wilson',
      email: 'robert.wilson@email.com',
      phone: '5551112222',
      dateOfBirth: new Date('1980-05-15'),
      address: '123 Main St, Anytown, ST 12345'
    },
    {
      name: 'Lisa Brown',
      email: 'lisa.brown@email.com',
      phone: '5553334444',
      dateOfBirth: new Date('1975-09-22'),
      address: '456 Oak Ave, Somewhere, ST 67890'
    }
  ];

  for (const client of sampleClients) {
    await prisma.client.upsert({
      where: { email: client.email },
      update: {},
      create: client,
    });
  }

  console.log('✅ Created sample clients');

  // Create sample policies for clients
  const clients = await prisma.client.findMany();
  
  if (clients.length > 0) {
    const samplePolicies = [
      {
        policyNumber: 'LIFE-001-2024',
        policyType: 'Life',
        provider: 'ABC Life Insurance',
        premiumAmount: 150.00,
        status: 'Active',
        startDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-01-01'),
        commissionAmount: 1800.00,
        clientId: clients[0].id
      },
      {
        policyNumber: 'AUTO-002-2024',
        policyType: 'Auto',
        provider: 'XYZ Auto Insurance',
        premiumAmount: 120.00,
        status: 'Active',
        startDate: new Date('2024-03-15'),
        expiryDate: new Date('2025-03-15'),
        commissionAmount: 720.00,
        clientId: clients[1].id
      }
    ];

    for (const policy of samplePolicies) {
      await prisma.policy.upsert({
        where: { policyNumber: policy.policyNumber },
        update: {},
        create: policy,
      });
    }

    console.log('✅ Created sample policies');
  }

  // Create sample activities
  const sampleActivities = [
    {
      action: 'lead_created',
      description: 'Created new lead: John Smith'
    },
    {
      action: 'client_added',
      description: 'Added new client: Robert Wilson'
    },
    {
      action: 'policy_created',
      description: 'Created policy LIFE-001-2024 for Robert Wilson'
    }
  ];

  for (const activity of sampleActivities) {
    await prisma.activity.create({
      data: activity
    });
  }

  console.log('✅ Created sample activities');
  console.log('🎉 Database seeded successfully!');
  console.log('📧 Default login: agent@insurancecrm.com');
  console.log('🔑 Default password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });