import { PrismaClient, Gender, MaritalStatus, Relationship, DocumentType } from '@prisma/client';
import { hashPassword } from '../services/authService';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default settings with hashed password
  const passwordHash = await hashPassword('Amit@123');
  
  const settings = await prisma.settings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      passwordHash,
      agentName: 'Amit Ulhe',
      agentEmail: 'amitulhe@gmail.com',
    },
  });

  console.log('✅ Created default settings');

//   // Create sample leads
//   const sampleLeads = [
//     {
//       name: 'John Smith',
//       email: 'john.smith@email.com',
//       phone: '5551234567',
//       insuranceInterest: 'Life',
//       status: 'New',
//       priority: 'Hot',
//       notes: 'Interested in term life insurance for family protection'
//     },
//     {
//       name: 'Sarah Johnson',
//       email: 'sarah.j@email.com',
//       phone: '5559876543',
//       insuranceInterest: 'Auto',
//       status: 'Contacted',
//       priority: 'Warm',
//       notes: 'Looking for better auto insurance rates'
//     },
//     {
//       name: 'Mike Davis',
//       email: 'mike.davis@email.com',
//       phone: '5555551234',
//       insuranceInterest: 'Health',
//       status: 'Qualified',
//       priority: 'Hot',
//       notes: 'Self-employed, needs comprehensive health coverage'
//     },
//     {
//       name: 'Emily Wilson',
//       email: 'emily.wilson@email.com',
//       phone: '5556667777',
//       insuranceInterest: 'Home',
//       status: 'New',
//       priority: 'Warm',
//       notes: 'First-time homebuyer looking for home insurance'
//     },
//     {
//       name: 'David Brown',
//       email: 'david.brown@email.com',
//       phone: '5558889999',
//       insuranceInterest: 'Business',
//       status: 'Contacted',
//       priority: 'Hot',
//       notes: 'Small business owner needs liability coverage'
//     }
//   ];

//   for (const lead of sampleLeads) {
//     await prisma.lead.upsert({
//       where: { email: lead.email },
//       update: {},
//       create: lead,
//     });
//   }

//   console.log('✅ Created sample leads');

//   // Create sample personal clients
//   const personalClient1 = await prisma.client.create({
//     data: {
//       firstName: 'Robert',
//       lastName: 'Wilson',
//       dateOfBirth: new Date('1980-05-15'),
//       phoneNumber: '5551112222',
//       whatsappNumber: '5551112222',
//       email: 'robert.wilson@email.com',
//       state: 'California',
//       city: 'Los Angeles',
//       address: '123 Main St, Los Angeles, CA 90210',
//       gender: Gender.MALE,
//       height: 5.9,
//       weight: 175,
//       education: 'Bachelor\'s Degree',
//       maritalStatus: MaritalStatus.MARRIED,
//       businessJob: 'Software Engineer',
//       nameOfBusiness: 'Tech Corp',
//       typeOfDuty: 'Development',
//       annualIncome: 85000,
//       panNumber: 'ABCDE1234F'
//     }
//   });

//   const personalClient2 = await prisma.client.create({
//     data: {
//       firstName: 'Lisa',
//       lastName: 'Brown',
//       dateOfBirth: new Date('1975-09-22'),
//       phoneNumber: '5553334444',
//       whatsappNumber: '5553334444',
//       email: 'lisa.brown@email.com',
//       state: 'Texas',
//       city: 'Houston',
//       address: '456 Oak Ave, Houston, TX 77001',
//       gender: Gender.FEMALE,
//       height: 5.5,
//       weight: 140,
//       education: 'Master\'s Degree',
//       maritalStatus: MaritalStatus.SINGLE,
//       businessJob: 'Marketing Manager',
//       nameOfBusiness: 'Marketing Solutions Inc',
//       typeOfDuty: 'Management',
//       annualIncome: 75000,
//       panNumber: 'FGHIJ5678K'
//     }
//   });

//   // Create sample family/employee client
//   const familyClient = await prisma.client.create({
//     data: {
//       firstName: 'Michael',
//       lastName: 'Johnson',
//       dateOfBirth: new Date('1985-03-10'),
//       phoneNumber: '5557778888',
//       whatsappNumber: '5557778888',
//       email: 'johnson.family@email.com',
//       height: 6.0,
//       weight: 180,
//       gender: Gender.MALE,
//       relationship: Relationship.SPOUSE,
//       panNumber: 'KLMNO9012P'
//     }
//   });

//   // Create sample corporate client
//   const corporateClient = await prisma.client.create({
//     data: {
//       firstName: 'Tech',
//       lastName: 'Startup Inc',
//       dateOfBirth: new Date('2020-01-01'), // Company founding date
//       phoneNumber: '5559990000',
//       whatsappNumber: '5559990000',
//       email: 'contact@techstartup.com',
//       companyName: 'Tech Startup Inc',
//       state: 'New York',
//       city: 'New York',
//       address: '789 Business Ave, New York, NY 10001',
//       annualIncome: 500000,
//       panNumber: 'PQRST3456U',
//       gstNumber: 'GST123456789'
//     }
//   });

//   console.log('✅ Created sample clients');

//   // Create policy templates
//   const policyTemplates = [
//     {
//       policyNumber: 'TEMP-LIFE-001',
//       policyType: 'Life Insurance',
//       provider: 'ABC Life Insurance',
//       description: 'Comprehensive life insurance coverage'
//     },
//     {
//       policyNumber: 'TEMP-AUTO-001',
//       policyType: 'Auto Insurance',
//       provider: 'XYZ Auto Insurance',
//       description: 'Full coverage auto insurance'
//     },
//     {
//       policyNumber: 'TEMP-HEALTH-001',
//       policyType: 'Health Insurance',
//       provider: 'Health Plus Insurance',
//       description: 'Complete health coverage plan'
//     },
//     {
//       policyNumber: 'TEMP-HOME-001',
//       policyType: 'Home Insurance',
//       provider: 'Secure Home Insurance',
//       description: 'Comprehensive home protection'
//     }
//   ];

//   const createdTemplates = [];
//   for (const template of policyTemplates) {
//     const created = await prisma.policyTemplate.upsert({
//       where: { policyNumber: template.policyNumber },
//       update: template,
//       create: template
//     });
//     createdTemplates.push(created);
//   }

//   console.log('✅ Created policy templates');

//   // Create policy instances
//   const clients = [personalClient1, personalClient2, familyClient, corporateClient];
  
//   const policyInstances = [
//     {
//       policyTemplateId: createdTemplates[0].id,
//       clientId: personalClient1.id,
//       premiumAmount: 150.00,
//       status: 'Active',
//       startDate: new Date('2024-01-01'),
//       expiryDate: new Date('2025-01-01'),
//       commissionAmount: 1800.00
//     },
//     {
//       policyTemplateId: createdTemplates[1].id,
//       clientId: personalClient2.id,
//       premiumAmount: 120.00,
//       status: 'Active',
//       startDate: new Date('2024-03-15'),
//       expiryDate: new Date('2025-03-15'),
//       commissionAmount: 720.00
//     },
//     {
//       policyTemplateId: createdTemplates[2].id,
//       clientId: familyClient.id,
//       premiumAmount: 200.00,
//       status: 'Active',
//       startDate: new Date('2024-06-01'),
//       expiryDate: new Date('2025-06-01'),
//       commissionAmount: 1200.00
//     },
//     {
//       policyTemplateId: createdTemplates[3].id,
//       clientId: corporateClient.id,
//       premiumAmount: 500.00,
//       status: 'Active',
//       startDate: new Date('2024-02-01'),
//       expiryDate: new Date('2025-02-01'),
//       commissionAmount: 3000.00
//     }
//   ];

//   for (const instance of policyInstances) {
//     await prisma.policyInstance.create({
//       data: instance
//     });
//   }

//   console.log('✅ Created policy instances');

//   // Create legacy policies for backward compatibility
//   const legacyPolicies = [
//     {
//       policyNumber: 'LIFE-001-2024',
//       policyType: 'Life',
//       provider: 'ABC Life Insurance',
//       premiumAmount: 150.00,
//       status: 'Active',
//       startDate: new Date('2024-01-01'),
//       expiryDate: new Date('2025-01-01'),
//       commissionAmount: 1800.00,
//       clientId: personalClient1.id
//     },
//     {
//       policyNumber: 'AUTO-002-2024',
//       policyType: 'Auto',
//       provider: 'XYZ Auto Insurance',
//       premiumAmount: 120.00,
//       status: 'Active',
//       startDate: new Date('2024-03-15'),
//       expiryDate: new Date('2025-03-15'),
//       commissionAmount: 720.00,
//       clientId: personalClient2.id
//     }
//   ];

//   for (const policy of legacyPolicies) {
//     await prisma.policy.upsert({
//       where: { policyNumber: policy.policyNumber },
//       update: policy,
//       create: policy
//     });
//   }

//   console.log('✅ Created legacy policies');

//   // Create sample activities
//   const sampleActivities = [
//     {
//       action: 'lead_created',
//       description: 'Created new lead: John Smith'
//     },
//     {
//       action: 'client_added',
//       description: 'Added new personal client: Robert Wilson'
//     },
//     {
//       action: 'policy_created',
//       description: 'Created policy instance for Robert Wilson'
//     },
//     {
//       action: 'client_added',
//       description: 'Added new corporate client: Tech Startup Inc'
//     },
//     {
//       action: 'template_created',
//       description: 'Created new policy template: Life Insurance'
//     }
//   ];

//   for (const activity of sampleActivities) {
//     await prisma.activity.create({
//       data: activity
//     });
//   }

//   console.log('✅ Created sample activities');
//   console.log('🎉 Database seeded successfully!');
//   console.log('📧 Default login: amitulhe@gmail.com');
//   console.log('🔑 Default password: Amit@123');
// }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });