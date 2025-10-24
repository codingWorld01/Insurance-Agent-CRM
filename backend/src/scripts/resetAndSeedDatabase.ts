#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Dummy data generators
const generateRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const generateRandomAmount = (min: number, max: number): number => {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
};

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Sample data arrays
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa',
  'William', 'Jennifer', 'James', 'Mary', 'Christopher', 'Patricia', 'Daniel',
  'Linda', 'Matthew', 'Elizabeth', 'Anthony', 'Barbara', 'Mark', 'Susan',
  'Donald', 'Jessica', 'Steven', 'Karen', 'Paul', 'Nancy', 'Andrew', 'Betty'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

const insuranceProviders = [
  'State Farm', 'Geico', 'Progressive', 'Allstate', 'USAA', 'Liberty Mutual',
  'Farmers', 'Nationwide', 'American Family', 'Travelers', 'MetLife', 'Prudential'
];

const policyTypes = [
  'Auto Insurance', 'Home Insurance', 'Life Insurance', 'Health Insurance',
  'Renters Insurance', 'Umbrella Insurance', 'Disability Insurance', 'Business Insurance'
];

const insuranceInterests = [
  'Auto Insurance', 'Home Insurance', 'Life Insurance', 'Health Insurance',
  'Business Insurance', 'Travel Insurance', 'Pet Insurance'
];

const statuses = ['Active', 'Expired', 'Cancelled'];
const leadStatuses = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
const priorities = ['Hot', 'Warm', 'Cold'];

const addresses = [
  '123 Main St, Anytown, ST 12345',
  '456 Oak Ave, Springfield, ST 67890',
  '789 Pine Rd, Riverside, ST 54321',
  '321 Elm St, Lakewood, ST 98765',
  '654 Maple Dr, Hillside, ST 13579',
  '987 Cedar Ln, Brookfield, ST 24680',
  '147 Birch Way, Greenville, ST 11223',
  '258 Willow Ct, Fairview, ST 33445',
  '369 Spruce Blvd, Madison, ST 55667',
  '741 Ash Pl, Georgetown, ST 77889'
];

const phoneNumbers = [
  '(555) 123-4567', '(555) 234-5678', '(555) 345-6789', '(555) 456-7890',
  '(555) 567-8901', '(555) 678-9012', '(555) 789-0123', '(555) 890-1234',
  '(555) 901-2345', '(555) 012-3456'
];

const activities = [
  { action: 'Lead Created', description: 'New lead added to system' },
  { action: 'Client Converted', description: 'Lead converted to client' },
  { action: 'Policy Created', description: 'New policy created for client' },
  { action: 'Policy Updated', description: 'Policy information updated' },
  { action: 'Policy Renewed', description: 'Policy renewed for another term' },
  { action: 'Payment Received', description: 'Premium payment received' },
  { action: 'Claim Filed', description: 'Insurance claim filed' },
  { action: 'Quote Generated', description: 'Insurance quote generated' }
];

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  
  // Delete in order to respect foreign key constraints
  await prisma.activity.deleteMany({});
  await prisma.policyInstance.deleteMany({});
  await prisma.policy.deleteMany({});
  await prisma.policyTemplate.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.client.deleteMany({});
  // Keep settings for login functionality
  
  console.log('✅ Database cleared successfully');
}

async function seedSettings() {
  console.log('⚙️  Creating settings...');
  
  const existingSettings = await prisma.settings.findFirst();
  if (!existingSettings) {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await prisma.settings.create({
      data: {
        passwordHash,
        agentName: 'Demo Agent',
        agentEmail: 'demo@insurance.com'
      }
    });
    
    console.log('✅ Settings created with email: demo@insurance.com, password: password123');
  } else {
    console.log('✅ Settings already exist');
  }
}

async function seedLeads() {
  console.log('👥 Creating leads...');
  
  const leads = [];
  for (let i = 0; i < 25; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`;
    
    leads.push({
      name: `${firstName} ${lastName}`,
      email,
      phone: getRandomElement(phoneNumbers),
      insuranceInterest: getRandomElement(insuranceInterests),
      status: getRandomElement(leadStatuses),
      priority: getRandomElement(priorities),
      notes: Math.random() > 0.5 ? `Interested in ${getRandomElement(insuranceInterests)} coverage` : null,
      createdAt: generateRandomDate(new Date(2024, 0, 1), new Date()),
      updatedAt: generateRandomDate(new Date(2024, 0, 1), new Date())
    });
  }
  
  await prisma.lead.createMany({ data: leads });
  console.log(`✅ Created ${leads.length} leads`);
}

async function seedClients() {
  console.log('👤 Creating clients...');
  
  const clients = [];
  for (let i = 0; i < 50; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.client${i}@email.com`;
    const dateOfBirth = generateRandomDate(new Date(1950, 0, 1), new Date(2000, 11, 31));
    const age = new Date().getFullYear() - dateOfBirth.getFullYear();
    
    clients.push({
      name: `${firstName} ${lastName}`,
      email,
      phone: getRandomElement(phoneNumbers),
      dateOfBirth,
      age,
      address: getRandomElement(addresses),
      createdAt: generateRandomDate(new Date(2024, 0, 1), new Date()),
      updatedAt: generateRandomDate(new Date(2024, 0, 1), new Date())
    });
  }
  
  await prisma.client.createMany({ data: clients });
  console.log(`✅ Created ${clients.length} clients`);
  
  return await prisma.client.findMany();
}

async function seedPolicyTemplates() {
  console.log('📋 Creating policy templates...');
  
  const templates = [];
  let policyCounter = 1;
  
  // Create templates for each combination of policy type and provider
  for (const policyType of policyTypes) {
    for (const provider of insuranceProviders) {
      // Not every provider offers every type of insurance
      if (Math.random() > 0.3) { // 70% chance to create this combination
        templates.push({
          policyNumber: `POL-${String(policyCounter).padStart(4, '0')}`,
          policyType,
          provider,
          description: `${policyType} policy offered by ${provider}`,
          createdAt: generateRandomDate(new Date(2023, 0, 1), new Date(2024, 0, 1)),
          updatedAt: generateRandomDate(new Date(2024, 0, 1), new Date())
        });
        policyCounter++;
      }
    }
  }
  
  await prisma.policyTemplate.createMany({ data: templates });
  console.log(`✅ Created ${templates.length} policy templates`);
  
  return await prisma.policyTemplate.findMany();
}

async function seedPolicyInstances(clients: any[], templates: any[]) {
  console.log('📄 Creating policy instances...');
  
  const instances = [];
  
  // Each client gets 1-4 policy instances
  for (const client of clients) {
    const numPolicies = Math.floor(Math.random() * 4) + 1;
    const clientTemplates = templates.sort(() => 0.5 - Math.random()).slice(0, numPolicies);
    
    for (const template of clientTemplates) {
      const startDate = generateRandomDate(new Date(2023, 0, 1), new Date(2024, 6, 1));
      const expiryDate = new Date(startDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year policy
      
      const premiumAmount = generateRandomAmount(500, 5000);
      const commissionAmount = generateRandomAmount(premiumAmount * 0.05, premiumAmount * 0.15);
      
      // Some policies might be expired or cancelled
      let status = 'Active';
      if (expiryDate < new Date()) {
        status = Math.random() > 0.7 ? 'Expired' : 'Active';
      } else if (Math.random() > 0.9) {
        status = 'Cancelled';
      }
      
      instances.push({
        policyTemplateId: template.id,
        clientId: client.id,
        premiumAmount,
        status,
        startDate,
        expiryDate,
        commissionAmount,
        createdAt: generateRandomDate(startDate, new Date()),
        updatedAt: generateRandomDate(startDate, new Date())
      });
    }
  }
  
  await prisma.policyInstance.createMany({ data: instances });
  console.log(`✅ Created ${instances.length} policy instances`);
}

async function seedOldPolicies(clients: any[]) {
  console.log('📜 Creating old format policies (for migration testing)...');
  
  const oldPolicies = [];
  
  // Create some old format policies for migration testing
  for (let i = 0; i < 15; i++) {
    const client = getRandomElement(clients);
    const policyType = getRandomElement(policyTypes);
    const provider = getRandomElement(insuranceProviders);
    const startDate = generateRandomDate(new Date(2022, 0, 1), new Date(2023, 6, 1));
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    const premiumAmount = generateRandomAmount(500, 5000);
    const commissionAmount = generateRandomAmount(premiumAmount * 0.05, premiumAmount * 0.15);
    
    oldPolicies.push({
      policyNumber: `OLD-${String(i + 1).padStart(4, '0')}`,
      policyType,
      provider,
      premiumAmount,
      status: getRandomElement(statuses),
      startDate,
      expiryDate,
      commissionAmount,
      clientId: client.id,
      createdAt: generateRandomDate(startDate, new Date()),
      updatedAt: generateRandomDate(startDate, new Date())
    });
  }
  
  await prisma.policy.createMany({ data: oldPolicies });
  console.log(`✅ Created ${oldPolicies.length} old format policies`);
}

async function seedActivities() {
  console.log('📊 Creating activities...');
  
  const activityRecords = [];
  
  // Create 100 random activities over the past 6 months
  for (let i = 0; i < 100; i++) {
    const activity = getRandomElement(activities);
    activityRecords.push({
      action: activity.action,
      description: activity.description,
      createdAt: generateRandomDate(new Date(2024, 0, 1), new Date())
    });
  }
  
  await prisma.activity.createMany({ data: activityRecords });
  console.log(`✅ Created ${activityRecords.length} activities`);
}

async function main() {
  try {
    console.log('🚀 Starting database reset and seeding...\n');
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data in order
    await seedSettings();
    await seedLeads();
    const clients = await seedClients();
    const templates = await seedPolicyTemplates();
    await seedPolicyInstances(clients, templates);
    await seedOldPolicies(clients);
    await seedActivities();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    
    const counts = await Promise.all([
      prisma.lead.count(),
      prisma.client.count(),
      prisma.policyTemplate.count(),
      prisma.policyInstance.count(),
      prisma.policy.count(),
      prisma.activity.count()
    ]);
    
    console.log(`   Leads: ${counts[0]}`);
    console.log(`   Clients: ${counts[1]}`);
    console.log(`   Policy Templates: ${counts[2]}`);
    console.log(`   Policy Instances: ${counts[3]}`);
    console.log(`   Old Policies: ${counts[4]}`);
    console.log(`   Activities: ${counts[5]}`);
    
    console.log('\n🔐 Login credentials:');
    console.log('   Email: demo@insurance.com');
    console.log('   Password: password123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle command line execution
if (require.main === module) {
  main();
}

export { main as resetAndSeedDatabase };