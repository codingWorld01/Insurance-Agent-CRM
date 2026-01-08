import DatabaseService, { prisma } from './src/services/database';
import bcrypt from 'bcrypt';

async function setupInitialData() {
  try {
    // Connect to database first
    await DatabaseService.connect();
    
    console.log('Setting up initial data...');
    
    // Create settings record for login
    const hashedPassword = await bcrypt.hash('Amit@123', 10);
    
    const settings = await prisma.settings.create({
      data: {
        agentName: 'Demo Agent',
        agentEmail: 'amitulhe@gmail.com',
        passwordHash: hashedPassword
      }
    });
    
    console.log('✅ Settings created:', {
      id: settings.id,
      agentName: settings.agentName,
      agentEmail: settings.agentEmail
    });

    // Get today's date for birthdays and policy expiry
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Create birthday date for today (but in a previous year)
    const birthdayToday = new Date(currentYear - 25, today.getMonth(), today.getDate());
    const birthdayToday2 = new Date(currentYear - 30, today.getMonth(), today.getDate());
    
    // Create leads with birthdays today
    console.log('\n📝 Creating leads with birthdays today...');
    
    const lead1 = await prisma.lead.create({
      data: {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1234567890',
        dateOfBirth: birthdayToday,
        age: 25,
        insuranceInterest: 'Life Insurance',
        status: 'Warm',
        priority: 'High',
        notes: 'Interested in term life insurance'
      }
    });

    const lead2 = await prisma.lead.create({
      data: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1234567891',
        dateOfBirth: birthdayToday2,
        age: 30,
        insuranceInterest: 'Health Insurance',
        status: 'Hot',
        priority: 'High',
        notes: 'Looking for family health coverage'
      }
    });

    console.log('✅ Created leads with birthdays today:', [
      { name: lead1.name, email: lead1.email, birthday: lead1.dateOfBirth },
      { name: lead2.name, email: lead2.email, birthday: lead2.dateOfBirth }
    ]);

    // Create clients with birthdays today
    console.log('\n👥 Creating clients with birthdays today...');
    
    const client1 = await prisma.client.create({
      data: {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@example.com',
        dateOfBirth: birthdayToday,
        phoneNumber: '+1234567892',
        whatsappNumber: '+1234567892',
        age: 25,
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        city: 'New York',
        state: 'NY'
      }
    });

    const client2 = await prisma.client.create({
      data: {
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@example.com',
        dateOfBirth: birthdayToday2,
        phoneNumber: '+1234567893',
        whatsappNumber: '+1234567893',
        age: 30,
        gender: 'FEMALE',
        maritalStatus: 'MARRIED',
        city: 'Los Angeles',
        state: 'CA'
      }
    });

    console.log('✅ Created clients with birthdays today:', [
      { name: `${client1.firstName} ${client1.lastName}`, email: client1.email, birthday: client1.dateOfBirth },
      { name: `${client2.firstName} ${client2.lastName}`, email: client2.email, birthday: client2.dateOfBirth }
    ]);

    // Create policy templates
    console.log('\n📋 Creating policy templates...');
    
    const policyTemplate1 = await prisma.policyTemplate.create({
      data: {
        policyNumber: 'LIFE-001',
        policyType: 'Life Insurance',
        provider: 'ABC Insurance Co.',
        description: 'Term Life Insurance Policy'
      }
    });

    const policyTemplate2 = await prisma.policyTemplate.create({
      data: {
        policyNumber: 'HEALTH-001',
        policyType: 'Health Insurance',
        provider: 'XYZ Health Insurance',
        description: 'Family Health Insurance Policy'
      }
    });

    console.log('✅ Created policy templates:', [
      { policyNumber: policyTemplate1.policyNumber, type: policyTemplate1.policyType },
      { policyNumber: policyTemplate2.policyNumber, type: policyTemplate2.policyType }
    ]);

    // Create policy instances that expire today
    console.log('\n🏥 Creating policy instances expiring today...');
    
    const policyStartDate = new Date(currentYear - 1, today.getMonth(), today.getDate());
    const policyExpiryToday = new Date(currentYear, today.getMonth(), today.getDate());

    const policyInstance1 = await prisma.policyInstance.create({
      data: {
        policyTemplateId: policyTemplate1.id,
        clientId: client1.id,
        premiumAmount: 5000.00,
        status: 'Active',
        startDate: policyStartDate,
        expiryDate: policyExpiryToday,
        commissionAmount: 500.00
      }
    });

    const policyInstance2 = await prisma.policyInstance.create({
      data: {
        policyTemplateId: policyTemplate2.id,
        clientId: client2.id,
        premiumAmount: 8000.00,
        status: 'Active',
        startDate: policyStartDate,
        expiryDate: policyExpiryToday,
        commissionAmount: 800.00
      }
    });

    console.log('✅ Created policy instances expiring today:', [
      { 
        client: `${client1.firstName} ${client1.lastName}`, 
        policy: policyTemplate1.policyNumber, 
        expiryDate: policyInstance1.expiryDate 
      },
      { 
        client: `${client2.firstName} ${client2.lastName}`, 
        policy: policyTemplate2.policyNumber, 
        expiryDate: policyInstance2.expiryDate 
      }
    ]);

    // Create some additional sample data for variety
    console.log('\n📊 Creating additional sample data...');
    
    // Additional client without birthday today
    const client3 = await prisma.client.create({
      data: {
        firstName: 'Robert',
        lastName: 'Wilson',
        email: 'robert.wilson@example.com',
        dateOfBirth: new Date(1985, 5, 15), // June 15, 1985
        phoneNumber: '+1234567894',
        whatsappNumber: '+1234567894',
        age: 38,
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        city: 'Chicago',
        state: 'IL'
      }
    });

    // Policy instance expiring in 30 days (for renewal reminders)
    const futureExpiryDate = new Date();
    futureExpiryDate.setDate(today.getDate() + 30);

    const policyTemplate3 = await prisma.policyTemplate.create({
      data: {
        policyNumber: 'AUTO-001',
        policyType: 'Auto Insurance',
        provider: 'DEF Auto Insurance',
        description: 'Comprehensive Auto Insurance'
      }
    });

    const policyInstance3 = await prisma.policyInstance.create({
      data: {
        policyTemplateId: policyTemplate3.id,
        clientId: client3.id,
        premiumAmount: 1200.00,
        status: 'Active',
        startDate: new Date(currentYear - 1, today.getMonth(), today.getDate()),
        expiryDate: futureExpiryDate,
        commissionAmount: 120.00
      }
    });

    // Create some activities
    await prisma.activity.create({
      data: {
        action: 'CLIENT_CREATED',
        description: 'New client Michael Brown added to system'
      }
    });

    await prisma.activity.create({
      data: {
        action: 'POLICY_CREATED',
        description: 'Life insurance policy created for Michael Brown'
      }
    });

    console.log('✅ Additional sample data created');
    
    console.log('\n🎉 Database setup complete!');
    console.log('\n📧 Email Automation Test Data:');
    console.log('- 2 leads with birthdays TODAY');
    console.log('- 2 clients with birthdays TODAY');
    console.log('- 2 policy instances expiring TODAY');
    console.log('- 1 policy instance expiring in 30 days');
    console.log('\nLogin credentials:');
    console.log('Email: demo@insurance.com');
    console.log('Password: Amit@123');
    console.log('\nYou can now test:');
    console.log('1. Birthday wish automation');
    console.log('2. Policy renewal reminders');
    console.log('3. Email automation dashboard');
    
  } catch (error) {
    console.error('❌ Error setting up initial data:', error);
  } finally {
    await DatabaseService.disconnect();
  }
}

setupInitialData();