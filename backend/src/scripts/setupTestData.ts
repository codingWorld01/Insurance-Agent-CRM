import { prisma } from '../services/database';
import { Gender, MaritalStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

async function setupTestData() {
  console.log('🧹 Clearing existing data...');
  
  try {
    // Clear all data in correct order (respecting foreign key constraints)
    await prisma.whatsAppLog.deleteMany();
    await prisma.emailLog.deleteMany();
    await prisma.whatsAppTemplate.deleteMany();
    await prisma.emailTemplate.deleteMany();
    await prisma.messageAutomation.deleteMany();
    await prisma.emailAutomation.deleteMany();
    await prisma.policyInstance.deleteMany();
    await prisma.policyTemplate.deleteMany();
    await prisma.policy.deleteMany();
    await prisma.document.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.client.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.settings.deleteMany();

    console.log('✅ Database cleared successfully');

    // Get today's date for birthday and expiry testing
    const today = new Date();
    const todayISO = today.toISOString();
    
    // Calculate expiry date (30 days from today for renewal testing)
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + 30);

    console.log('📅 Test dates:');
    console.log(`  - Today (Birthday): ${today.toDateString()}`);
    console.log(`  - Expiry Date (30 days): ${expiryDate.toDateString()}`);

    // 1. Create Settings
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await prisma.settings.create({
      data: {
        passwordHash: hashedPassword,
        agentName: 'Demo Agent',
        agentEmail: 'amitulhe@gmail.com'
      }
    });

    // 2. Create Test Clients with Today's Birthday
    console.log('👥 Creating test clients...');
    
    const client1 = await prisma.client.create({
      data: {
        firstName: 'Yatharth',
        lastName: 'Aurangpure',
        dateOfBirth: today, // Today's birthday!
        phoneNumber: '8600777024',
        whatsappNumber: '918600777024', // With country code
        email: 'yatharthaurangpure27@gmail.com',
        gender: Gender.MALE,
        maritalStatus: MaritalStatus.SINGLE,
        age: 25,
        city: 'Mumbai',
        state: 'Maharashtra',
        address: '123 Test Street, Mumbai',
        annualIncome: 500000,
        businessJob: 'Software Engineer'
      }
    });

    const client2 = await prisma.client.create({
      data: {
        firstName: 'Vaishali',
        lastName: 'Aurangpure',
        dateOfBirth: today, // Today's birthday!
        phoneNumber: '8600777024',
        whatsappNumber: '918600777024', // With country code
        email: 'vaishaliaurangpure777@gmail.com',
        gender: Gender.FEMALE,
        maritalStatus: MaritalStatus.MARRIED,
        age: 28,
        city: 'Mumbai',
        state: 'Maharashtra',
        address: '456 Test Avenue, Mumbai',
        annualIncome: 600000,
        businessJob: 'Business Analyst'
      }
    });

    // 3. Create Test Leads with Today's Birthday
    console.log('🎯 Creating test leads...');
    
    const lead1 = await prisma.lead.create({
      data: {
        name: 'Test Lead Birthday',
        email: 'yatharthaurangpure27@gmail.com',
        phone: '8600777024',
        whatsappNumber: '918600777024',
        dateOfBirth: today, // Today's birthday!
        age: 30,
        insuranceInterest: 'Life Insurance',
        status: 'Warm',
        priority: 'High',
        notes: 'Test lead with today birthday for automation testing'
      }
    });

    // 4. Create Policy Templates
    console.log('📋 Creating policy templates...');
    
    const policyTemplate1 = await prisma.policyTemplate.create({
      data: {
        policyNumber: 'LI-TEST-001',
        policyType: 'Life Insurance',
        provider: 'HDFC Life',
        description: 'Test Life Insurance Policy'
      }
    });

    const policyTemplate2 = await prisma.policyTemplate.create({
      data: {
        policyNumber: 'HI-TEST-002',
        policyType: 'Health Insurance',
        provider: 'Star Health',
        description: 'Test Health Insurance Policy'
      }
    });

    // 5. Create Policy Instances with Expiry Date (30 days from today)
    console.log('🏥 Creating policy instances...');
    
    const policyInstance1 = await prisma.policyInstance.create({
      data: {
        policyTemplateId: policyTemplate1.id,
        clientId: client1.id,
        premiumAmount: 50000,
        status: 'Active',
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        expiryDate: expiryDate, // 30 days from today
        commissionAmount: 5000
      }
    });

    const policyInstance2 = await prisma.policyInstance.create({
      data: {
        policyTemplateId: policyTemplate2.id,
        clientId: client2.id,
        premiumAmount: 25000,
        status: 'Active',
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        expiryDate: expiryDate, // 30 days from today
        commissionAmount: 2500
      }
    });

    // 6. Create Email Templates
    console.log('📧 Creating email templates...');
    
    await prisma.emailTemplate.create({
      data: {
        name: 'birthday_wish_template',
        subject: '🎉 Happy Birthday {{name}}!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🎉 Happy Birthday {{name}}! 🎂</h2>
            <p>Wishing you a wonderful year filled with good health, happiness, and prosperity!</p>
            <p>Thank you for trusting us with your insurance needs.</p>
            <p>Best regards,<br>Demo Agent<br>Insurance CRM</p>
          </div>
        `,
        textContent: 'Happy Birthday {{name}}! Wishing you a wonderful year ahead!',
        type: 'BIRTHDAY_WISH',
        isActive: true
      }
    });

    await prisma.emailTemplate.create({
      data: {
        name: 'policy_renewal_template',
        subject: '⏰ Policy Renewal Reminder - {{policyNumber}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⏰ Policy Renewal Reminder</h2>
            <p>Dear {{name}},</p>
            <p>Your {{policyType}} policy is due for renewal.</p>
            <p><strong>Policy Details:</strong></p>
            <ul>
              <li>Policy Number: {{policyNumber}}</li>
              <li>Expiry Date: {{expiryDate}}</li>
              <li>Premium Amount: ₹{{premiumAmount}}</li>
            </ul>
            <p>Please contact us to renew your policy.</p>
            <p>Best regards,<br>Demo Agent<br>Insurance CRM</p>
          </div>
        `,
        textContent: 'Policy Renewal Reminder: Your {{policyType}} policy {{policyNumber}} expires on {{expiryDate}}.',
        type: 'POLICY_RENEWAL',
        isActive: true
      }
    });

    // 7. Create WhatsApp Templates
    console.log('💬 Creating WhatsApp templates...');
    
    await prisma.whatsAppTemplate.create({
      data: {
        name: 'birthday_wish_template',
        templateName: 'birthday_wish',
        namespace: '2be3d7b5_0eea_40c4_bea6_4ea50f3dee92',
        language: 'en',
        messageType: 'BIRTHDAY_WISH',
        isActive: true
      }
    });

    await prisma.whatsAppTemplate.create({
      data: {
        name: 'policy_renewal_template',
        templateName: 'policy_renewal',
        namespace: '2be3d7b5_0eea_40c4_bea6_4ea50f3dee92',
        language: 'en',
        messageType: 'POLICY_RENEWAL',
        isActive: true
      }
    });

    // 8. Create some activity logs
    await prisma.activity.createMany({
      data: [
        {
          action: 'DATA_SETUP',
          description: 'Test data setup completed for automation testing'
        },
        {
          action: 'CLIENT_CREATED',
          description: `Created test client: ${client1.firstName} ${client1.lastName}`
        },
        {
          action: 'CLIENT_CREATED',
          description: `Created test client: ${client2.firstName} ${client2.lastName}`
        }
      ]
    });

    console.log('');
    console.log('🎉 Test data setup completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  ✅ 2 Clients created with TODAY's birthday`);
    console.log(`  ✅ 1 Lead created with TODAY's birthday`);
    console.log(`  ✅ 2 Policy instances expiring in 30 days`);
    console.log(`  ✅ Email templates created`);
    console.log(`  ✅ WhatsApp templates created`);
    console.log('');
    console.log('📱 Contact Details:');
    console.log(`  📧 Email: yatharthaurangpure27@gmail.com, vaishaliaurangpure777@gmail.com`);
    console.log(`  📱 WhatsApp: +918600777024`);
    console.log('');
    console.log('🧪 Ready for Testing:');
    console.log(`  🎂 Birthday automation will trigger for TODAY (${today.toDateString()})`);
    console.log(`  📋 Renewal automation will trigger for policies expiring on ${expiryDate.toDateString()}`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('  1. Set your MSG91_AUTH_KEY in .env file');
    console.log('  2. Run: npm run test-automation');
    console.log('  3. Check your email and WhatsApp for messages!');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupTestData()
    .then(() => {
      console.log('✅ Test data setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test data setup failed:', error);
      process.exit(1);
    });
}

export { setupTestData };