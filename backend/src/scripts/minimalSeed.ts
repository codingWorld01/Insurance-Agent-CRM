#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function minimalSeed() {
  try {
    console.log('🚀 Adding minimal dummy data to database...\n');

    // 1. Create settings (login credentials)
    console.log('⚙️  Creating settings...');
    const existingSettings = await prisma.settings.findFirst();
    if (!existingSettings) {
      const passwordHash = await bcrypt.hash('Amit@123', 10);
      await prisma.settings.create({
        data: {
          passwordHash,
          agentName: 'Demo Agent',
          agentEmail: 'demo@insurance.com'
        }
      });
      console.log('✅ Settings created');
    } else {
      console.log('✅ Settings already exist');
    }

    // 2. Create 3 sample leads
    console.log('👥 Creating sample leads...');
    const sampleLeads = [
      {
        name: 'John Smith',
        phone: '(555) 123-4567',
        insuranceInterest: 'Auto Insurance',
        status: 'New',
        priority: 'Hot',
        notes: 'Interested in comprehensive auto coverage'
      },
      {
        name: 'Sarah Johnson',
        phone: '(555) 234-5678',
        insuranceInterest: 'Home Insurance',
        status: 'Contacted',
        priority: 'Warm',
        notes: 'Needs home insurance for new property'
      },
      {
        name: 'Michael Brown',
        phone: '(555) 345-6789',
        insuranceInterest: 'Life Insurance',
        status: 'Qualified',
        priority: 'Cold',
        notes: null
      }
    ];

    for (const leadData of sampleLeads) {
      const existingLead = await prisma.lead.findFirst({
        where: { phone: leadData.phone }
      });
      
      if (!existingLead) {
        await prisma.lead.create({ data: leadData });
      }
    }
    console.log('✅ Created 3 sample leads');

    // 3. Create 5 sample clients
    console.log('👤 Creating sample clients...');
    const sampleClients = [
      {
        firstName: 'Emily',
        lastName: 'Davis',
        dateOfBirth: new Date('1985-03-15'),
        phoneNumber: '(555) 456-7890',
        whatsappNumber: '(555) 456-7890',
        email: 'emily.davis@email.com',
        address: '123 Main St, Anytown, ST 12345',
        gender: 'FEMALE' as const,
        maritalStatus: 'MARRIED' as const,
        annualIncome: 75000
      },
      {
        firstName: 'Robert',
        lastName: 'Wilson',
        dateOfBirth: new Date('1990-07-22'),
        phoneNumber: '(555) 567-8901',
        whatsappNumber: '(555) 567-8901',
        email: 'robert.wilson@email.com',
        address: '456 Oak Ave, Springfield, ST 67890',
        gender: 'MALE' as const,
        maritalStatus: 'SINGLE' as const,
        annualIncome: 65000
      },
      {
        firstName: 'Lisa',
        lastName: 'Anderson',
        dateOfBirth: new Date('1978-11-08'),
        phoneNumber: '(555) 678-9012',
        whatsappNumber: '(555) 678-9012',
        email: 'lisa.anderson@email.com',
        address: '789 Pine Rd, Riverside, ST 54321',
        gender: 'FEMALE' as const,
        maritalStatus: 'DIVORCED' as const,
        annualIncome: 85000
      },
      {
        firstName: 'David',
        lastName: 'Martinez',
        dateOfBirth: new Date('1982-05-12'),
        phoneNumber: '(555) 789-0123',
        whatsappNumber: '(555) 789-0123',
        email: 'david.martinez@email.com',
        address: '321 Elm St, Lakewood, ST 98765',
        gender: 'MALE' as const,
        maritalStatus: 'MARRIED' as const,
        companyName: 'Tech Solutions Inc',
        annualIncome: 95000
      },
      {
        firstName: 'Jennifer',
        lastName: 'Taylor',
        dateOfBirth: new Date('1995-09-30'),
        phoneNumber: '(555) 890-1234',
        whatsappNumber: '(555) 890-1234',
        email: 'jennifer.taylor@email.com',
        address: '654 Maple Dr, Hillside, ST 13579',
        gender: 'FEMALE' as const,
        maritalStatus: 'SINGLE' as const,
        annualIncome: 55000
      }
    ];

    const createdClients = [];
    for (const clientData of sampleClients) {
      const existingClient = await prisma.client.findFirst({
        where: { email: clientData.email }
      });
      
      if (!existingClient) {
        const client = await prisma.client.create({ data: clientData });
        createdClients.push(client);
      } else {
        createdClients.push(existingClient);
      }
    }
    console.log('✅ Created 5 sample clients');

    // 4. Create 4 policy templates
    console.log('📋 Creating policy templates...');
    const sampleTemplates = [
      {
        policyNumber: 'AUTO-001',
        policyType: 'Auto Insurance',
        provider: 'State Farm',
        description: 'Comprehensive auto insurance coverage'
      },
      {
        policyNumber: 'HOME-001',
        policyType: 'Home Insurance',
        provider: 'Allstate',
        description: 'Complete home insurance protection'
      },
      {
        policyNumber: 'LIFE-001',
        policyType: 'Life Insurance',
        provider: 'MetLife',
        description: 'Term life insurance policy'
      },
      {
        policyNumber: 'HEALTH-001',
        policyType: 'Health Insurance',
        provider: 'Blue Cross',
        description: 'Comprehensive health insurance plan'
      }
    ];

    const createdTemplates = [];
    for (const templateData of sampleTemplates) {
      const existingTemplate = await prisma.policyTemplate.findUnique({
        where: { policyNumber: templateData.policyNumber }
      });
      
      if (!existingTemplate) {
        const template = await prisma.policyTemplate.create({ data: templateData });
        createdTemplates.push(template);
      } else {
        createdTemplates.push(existingTemplate);
      }
    }
    console.log('✅ Created 4 policy templates');

    // 5. Create 6 policy instances (linking clients to templates)
    console.log('📄 Creating policy instances...');
    if (createdClients.length > 0 && createdTemplates.length > 0) {
      const policyInstances = [
        {
          policyTemplateId: createdTemplates[0].id, // Auto Insurance
          clientId: createdClients[0].id, // Emily Davis
          premiumAmount: 1200.00,
          status: 'Active',
          startDate: new Date('2024-01-15'),
          expiryDate: new Date('2025-01-15'),
          commissionAmount: 120.00
        },
        {
          policyTemplateId: createdTemplates[1].id, // Home Insurance
          clientId: createdClients[1].id, // Robert Wilson
          premiumAmount: 2500.00,
          status: 'Active',
          startDate: new Date('2024-03-01'),
          expiryDate: new Date('2025-03-01'),
          commissionAmount: 250.00
        },
        {
          policyTemplateId: createdTemplates[2].id, // Life Insurance
          clientId: createdClients[2].id, // Lisa Anderson
          premiumAmount: 800.00,
          status: 'Active',
          startDate: new Date('2024-02-10'),
          expiryDate: new Date('2025-02-10'),
          commissionAmount: 80.00
        },
        {
          policyTemplateId: createdTemplates[3].id, // Health Insurance
          clientId: createdClients[3].id, // David Martinez
          premiumAmount: 3200.00,
          status: 'Active',
          startDate: new Date('2024-04-01'),
          expiryDate: new Date('2025-04-01'),
          commissionAmount: 320.00
        },
        {
          policyTemplateId: createdTemplates[0].id, // Auto Insurance
          clientId: createdClients[4].id, // Jennifer Taylor
          premiumAmount: 1100.00,
          status: 'Active',
          startDate: new Date('2024-05-15'),
          expiryDate: new Date('2025-05-15'),
          commissionAmount: 110.00
        },
        {
          policyTemplateId: createdTemplates[1].id, // Home Insurance
          clientId: createdClients[0].id, // Emily Davis (second policy)
          premiumAmount: 1800.00,
          status: 'Expired',
          startDate: new Date('2023-06-01'),
          expiryDate: new Date('2024-06-01'),
          commissionAmount: 180.00
        }
      ];

      for (const instanceData of policyInstances) {
        const existingInstance = await prisma.policyInstance.findUnique({
          where: {
            policyTemplateId_clientId: {
              policyTemplateId: instanceData.policyTemplateId,
              clientId: instanceData.clientId
            }
          }
        });
        
        if (!existingInstance) {
          await prisma.policyInstance.create({ data: instanceData });
        }
      }
      console.log('✅ Created 6 policy instances');
    }

    // 6. Create some activities
    console.log('📊 Creating sample activities...');
    const sampleActivities = [
      { action: 'System Started', description: 'CRM system initialized with minimal data' },
      { action: 'Client Added', description: 'New client Emily Davis added to system' },
      { action: 'Policy Created', description: 'Auto insurance policy created for Emily Davis' },
      { action: 'Lead Converted', description: 'Lead John Smith converted to client' },
      { action: 'Data Seeded', description: 'Minimal sample data added to database' }
    ];

    await prisma.activity.createMany({ 
      data: sampleActivities,
      skipDuplicates: true 
    });
    console.log('✅ Created 5 sample activities');

    console.log('\n🎉 Minimal seeding completed successfully!');
    
    // Display summary
    const counts = await Promise.all([
      prisma.lead.count(),
      prisma.client.count(),
      prisma.policyTemplate.count(),
      prisma.policyInstance.count(),
      prisma.activity.count(),
    ]);

    console.log('\n📊 Summary:');
    console.log(`   Leads: ${counts[0]}`);
    console.log(`   Clients: ${counts[1]}`);
    console.log(`   Policy Templates: ${counts[2]}`);
    console.log(`   Policy Instances: ${counts[3]}`);
    console.log(`   Activities: ${counts[4]}`);

    console.log('\n🔐 Login credentials:');
    console.log('   Email: demo@insurance.com');
    console.log('   Password: Amit@123');

  } catch (error) {
    console.error('❌ Error during minimal seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  minimalSeed();
}

export { minimalSeed };