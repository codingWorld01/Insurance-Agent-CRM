#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function quickSeed() {
  try {
    console.log('🚀 Quick seeding database with essential data...\n');

    // Create settings if they don't exist
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
    }

    // Create a few sample clients
    const sampleClients = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phoneNumber: '(555) 123-4567',
        whatsappNumber: '(555) 123-4567',
        dateOfBirth: new Date('1985-03-15'),
        address: '123 Main St, Anytown, ST 12345',
        clientType: 'INDIVIDUAL'
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phoneNumber: '(555) 234-5678',
        whatsappNumber: '(555) 234-5678',
        dateOfBirth: new Date('1990-07-22'),
        address: '456 Oak Ave, Springfield, ST 67890',
        clientType: 'INDIVIDUAL'
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@email.com',
        phoneNumber: '(555) 345-6789',
        whatsappNumber: '(555) 345-6789',
        dateOfBirth: new Date('1978-11-08'),
        address: '789 Pine Rd, Riverside, ST 54321',
        clientType: 'INDIVIDUAL'
      }
    ];

    for (const clientData of sampleClients) {
      const existingClient = await prisma.client.findFirst({
        where: { email: clientData.email }
      });
      
      if (!existingClient) {
        await prisma.client.create({ data: clientData });
      }
    }
    console.log('✅ Sample clients created');

    // Create sample policy templates
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
      }
    ];

    for (const templateData of sampleTemplates) {
      const existingTemplate = await prisma.policyTemplate.findUnique({
        where: { policyNumber: templateData.policyNumber }
      });
      
      if (!existingTemplate) {
        await prisma.policyTemplate.create({ data: templateData });
      }
    }
    console.log('✅ Sample policy templates created');

    // Create sample leads
    const sampleLeads = [
      {
        name: 'Emily Davis',
        phone: '(555) 456-7890',
        insuranceInterest: 'Auto Insurance',
        status: 'New',
        priority: 'Hot',
        notes: 'Interested in comprehensive auto coverage'
      },
      {
        name: 'Robert Wilson',
        phone: '(555) 567-8901',
        insuranceInterest: 'Home Insurance',
        status: 'Contacted',
        priority: 'Warm',
        notes: 'Needs home insurance for new property'
      }
    ];

    for (const leadData of sampleLeads) {
      const existingLead = await prisma.lead.findFirst({
        where: {
          phone: leadData.phone
        }
      });
      
      if (!existingLead) {
        await prisma.lead.create({ data: leadData });
      }
    }
    console.log('✅ Sample leads created');

    // Create some activities
    const sampleActivities = [
      { action: 'System Started', description: 'CRM system initialized with sample data' },
      { action: 'Data Seeded', description: 'Sample data added to database' }
    ];

    await prisma.activity.createMany({ 
      data: sampleActivities,
      skipDuplicates: true 
    });
    console.log('✅ Sample activities created');

    console.log('\n🎉 Quick seeding completed!');
    console.log('\n🔐 Login credentials:');
    console.log('   Email: demo@insurance.com');
    console.log('   Password: Amit@123');

  } catch (error) {
    console.error('❌ Error during quick seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  quickSeed();
}

export { quickSeed };