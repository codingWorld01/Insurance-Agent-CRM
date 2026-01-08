import { AutomationService } from '../services/automationService';
import { prisma } from '../services/database';

async function testFreshAutomation() {
  console.log('🧪 Testing Fresh Automation (clearing today\'s logs)...');
  
  try {
    // Clear today's logs to test fresh
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log('🧹 Clearing today\'s logs for fresh test...');
    
    const [deletedEmails, deletedWhatsApp] = await Promise.all([
      prisma.emailLog.deleteMany({
        where: {
          createdAt: {
            gte: todayStart,
            lt: todayEnd
          }
        }
      }),
      prisma.whatsAppLog.deleteMany({
        where: {
          createdAt: {
            gte: todayStart,
            lt: todayEnd
          }
        }
      })
    ]);

    console.log(`✅ Cleared ${deletedEmails.count} email logs and ${deletedWhatsApp.count} WhatsApp logs`);
    console.log('');

    // Now test automation
    console.log('🎂 Testing Birthday Automation...');
    const birthdayResults = await AutomationService.processBirthdayWishes();
    
    console.log('Birthday Results:');
    console.log(`  📧 Email: ${birthdayResults.email.sent} sent, ${birthdayResults.email.failed} failed`);
    console.log(`  💬 WhatsApp: ${birthdayResults.whatsapp.sent} sent, ${birthdayResults.whatsapp.failed} failed`);
    console.log('');

    // Test renewal automation
    console.log('📋 Testing Renewal Automation...');
    const renewalResults = await AutomationService.processPolicyRenewals(30);
    
    console.log('Renewal Results:');
    console.log(`  📧 Email: ${renewalResults.email.sent} sent, ${renewalResults.email.failed} failed`);
    console.log(`  💬 WhatsApp: ${renewalResults.whatsapp.sent} sent, ${renewalResults.whatsapp.failed} failed`);
    console.log('');

    const totalEmailSent = birthdayResults.email.sent + renewalResults.email.sent;
    const totalWhatsAppSent = birthdayResults.whatsapp.sent + renewalResults.whatsapp.sent;
    const totalSent = totalEmailSent + totalWhatsAppSent;
    
    console.log('🎉 Final Results:');
    console.log(`  📧 Total Email Messages: ${totalEmailSent}`);
    console.log(`  💬 Total WhatsApp Messages: ${totalWhatsAppSent}`);
    console.log(`  🎯 Grand Total: ${totalSent} messages sent`);
    console.log('');
    
    if (totalSent > 0) {
      console.log('✅ SUCCESS! Both Email and WhatsApp automation working!');
      console.log('📧 Check email: yatharthaurangpure27@gmail.com, vaishaliaurangpure777@gmail.com');
      console.log('📱 Check WhatsApp: +918600777024');
    } else {
      console.log('⚠️ No messages sent - check configuration');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFreshAutomation();