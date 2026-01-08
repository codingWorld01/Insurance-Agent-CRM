import { AutomationService } from '../services/automationService';

async function quickTest() {
  console.log('🧪 Quick Automation Test...');
  
  try {
    // Test birthday automation
    console.log('🎂 Testing Birthday Automation...');
    const birthdayResults = await AutomationService.processBirthdayWishes();
    
    console.log('Birthday Results:');
    console.log(`  📧 Email: ${birthdayResults.email.sent} sent, ${birthdayResults.email.failed} failed`);
    console.log(`  💬 WhatsApp: ${birthdayResults.whatsapp.sent} sent, ${birthdayResults.whatsapp.failed} failed`);
    
    // Test renewal automation
    console.log('📋 Testing Renewal Automation...');
    const renewalResults = await AutomationService.processPolicyRenewals(30);
    
    console.log('Renewal Results:');
    console.log(`  📧 Email: ${renewalResults.email.sent} sent, ${renewalResults.email.failed} failed`);
    console.log(`  💬 WhatsApp: ${renewalResults.whatsapp.sent} sent, ${renewalResults.whatsapp.failed} failed`);
    
    const totalSent = birthdayResults.email.sent + birthdayResults.whatsapp.sent + renewalResults.email.sent + renewalResults.whatsapp.sent;
    
    console.log('');
    console.log(`🎉 Total Messages Sent: ${totalSent}`);
    
    if (totalSent > 0) {
      console.log('✅ SUCCESS! Check your email and WhatsApp!');
      console.log('📧 yatharthaurangpure27@gmail.com, vaishaliaurangpure777@gmail.com');
      console.log('📱 +918600777024');
    } else {
      console.log('⚠️ No messages sent. Check configuration.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

quickTest();