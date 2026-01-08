import { prisma } from '../services/database';
import { MessageType } from '@prisma/client';

async function setupWhatsAppTemplates() {
  console.log('🔧 Setting up WhatsApp templates...');

  try {
    // Create birthday wish template
    const birthdayTemplate = await prisma.whatsAppTemplate.upsert({
      where: { name: 'birthday_wish_template' },
      update: {},
      create: {
        name: 'birthday_wish_template',
        templateName: 'birthday_wish',
        namespace: '2be3d7b5_0eea_40c4_bea6_4ea50f3dee92',
        language: 'en',
        messageType: MessageType.BIRTHDAY_WISH,
        isActive: true
      }
    });

    console.log('✅ Birthday wish template created:', birthdayTemplate.id);

    // Create policy renewal template
    const renewalTemplate = await prisma.whatsAppTemplate.upsert({
      where: { name: 'policy_renewal_template' },
      update: {},
      create: {
        name: 'policy_renewal_template',
        templateName: 'policy_renewal',
        namespace: '2be3d7b5_0eea_40c4_bea6_4ea50f3dee92',
        language: 'en',
        messageType: MessageType.POLICY_RENEWAL,
        isActive: true
      }
    });

    console.log('✅ Policy renewal template created:', renewalTemplate.id);

    console.log('🎉 WhatsApp templates setup completed successfully!');

    // Display template information
    console.log('\n📋 Template Details:');
    console.log('Birthday Wish Template:');
    console.log(`  - Name: ${birthdayTemplate.templateName}`);
    console.log(`  - Namespace: ${birthdayTemplate.namespace}`);
    console.log(`  - Message: 🎉 Happy Birthday {{1}} ! 🎂`);
    console.log('');
    console.log('Policy Renewal Template:');
    console.log(`  - Name: ${renewalTemplate.templateName}`);
    console.log(`  - Namespace: ${renewalTemplate.namespace}`);
    console.log(`  - Message: Hello {{1}}, your {{2}} policy ({{3}}) with {{4}} expires on {{5}}. Premium: ₹{{6}}`);

  } catch (error) {
    console.error('❌ Error setting up WhatsApp templates:', error);
    throw error;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupWhatsAppTemplates()
    .then(() => {
      console.log('✅ Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupWhatsAppTemplates };