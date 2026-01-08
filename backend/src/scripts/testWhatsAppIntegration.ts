import { WhatsAppService } from '../services/whatsappService';
import { MessageType } from '@prisma/client';

async function testWhatsAppIntegration() {
  console.log('🧪 Testing WhatsApp Integration...');

  // Test configuration
  const testPhone = process.env.TEST_WHATSAPP_NUMBER || '919876543210';
  const testName = 'Test User';

  try {
    console.log('📋 Configuration Check:');
    console.log(`  - MSG91_AUTH_KEY: ${process.env.MSG91_AUTH_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`  - MSG91_INTEGRATED_NUMBER: ${process.env.MSG91_INTEGRATED_NUMBER || '918208691655'}`);
    console.log(`  - MSG91_NAMESPACE: ${process.env.MSG91_NAMESPACE || '2be3d7b5_0eea_40c4_bea6_4ea50f3dee92'}`);
    console.log(`  - Test Phone: ${testPhone}`);
    console.log('');

    if (!process.env.MSG91_AUTH_KEY) {
      console.log('❌ MSG91_AUTH_KEY is required. Please set it in your .env file.');
      return;
    }

    // Test 1: Birthday Wish
    console.log('🎂 Testing Birthday Wish...');
    const birthdayResult = await WhatsAppService.sendBirthdayWish(
      testPhone,
      testName
    );

    if (birthdayResult.success) {
      console.log(`✅ Birthday wish sent successfully! Message ID: ${birthdayResult.messageId}`);
    } else {
      console.log(`❌ Birthday wish failed: ${birthdayResult.error}`);
    }

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Policy Renewal Reminder
    console.log('📋 Testing Policy Renewal Reminder...');
    const renewalResult = await WhatsAppService.sendPolicyRenewalReminder(
      testPhone,
      testName,
      'Life Insurance',
      'LI123456789',
      'HDFC Life',
      '31/12/2024',
      '50,000'
    );

    if (renewalResult.success) {
      console.log(`✅ Renewal reminder sent successfully! Message ID: ${renewalResult.messageId}`);
    } else {
      console.log(`❌ Renewal reminder failed: ${renewalResult.error}`);
    }

    // Test 3: Get Statistics
    console.log('📊 Testing Statistics...');
    const stats = await WhatsAppService.getWhatsAppStats(7);
    console.log('WhatsApp Stats (Last 7 days):', {
      totalSent: stats.totalSent,
      totalFailed: stats.totalFailed,
      successRate: `${stats.successRate}%`
    });

    // Test 4: Get Logs
    console.log('📝 Testing Logs...');
    const logs = await WhatsAppService.getWhatsAppLogs(7, 1, 5);
    console.log(`Recent WhatsApp Logs: ${logs.logs.length} messages found`);

    console.log('');
    console.log('🎉 WhatsApp Integration Test Completed!');
    console.log('');
    console.log('📱 Check your WhatsApp messages on:', testPhone);
    console.log('💡 If messages didn\'t arrive, check:');
    console.log('   - MSG91 account balance');
    console.log('   - WhatsApp templates are approved');
    console.log('   - Phone number is registered with WhatsApp');
    console.log('   - Template names and namespace are correct');

  } catch (error) {
    console.error('❌ WhatsApp Integration Test Failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('MSG91_AUTH_KEY')) {
        console.log('💡 Make sure to set MSG91_AUTH_KEY in your .env file');
      } else if (error.message.includes('template')) {
        console.log('💡 Make sure your WhatsApp templates are approved in MSG91 dashboard');
      } else if (error.message.includes('phone')) {
        console.log('💡 Make sure the phone number is valid and registered with WhatsApp');
      }
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testWhatsAppIntegration()
    .then(() => {
      console.log('✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testWhatsAppIntegration };