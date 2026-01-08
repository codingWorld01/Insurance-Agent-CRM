import { WhatsAppService } from '../services/whatsappService';

async function debugWhatsApp() {
  console.log('🔍 Debugging WhatsApp Integration...');
  console.log('');

  // Check configuration
  console.log('📋 Configuration:');
  console.log(`  AUTH_KEY: ${process.env.MSG91_AUTH_KEY ? '✅ Set (' + process.env.MSG91_AUTH_KEY.substring(0, 10) + '...)' : '❌ Missing'}`);
  console.log(`  NUMBER: ${process.env.MSG91_INTEGRATED_NUMBER || '918208691655'}`);
  console.log(`  NAMESPACE: ${process.env.MSG91_NAMESPACE || '2be3d7b5_0eea_40c4_bea6_4ea50f3dee92'}`);
  console.log('');

  try {
    // Test 1: Simple birthday wish
    console.log('🧪 Test 1: Sending birthday wish...');
    const result1 = await WhatsAppService.sendBirthdayWish(
      '918600777024',
      'Test User'
    );

    console.log('Result 1:', result1);
    console.log('');

    // Test 2: Manual API call to MSG91
    console.log('🧪 Test 2: Direct MSG91 API call...');
    
    const payload = {
      integrated_number: "918208691655",
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: "birthday_wish",
          language: {
            code: "en",
            policy: "deterministic"
          },
          namespace: "2be3d7b5_0eea_40c4_bea6_4ea50f3dee92",
          to_and_components: [
            {
              to: ["918600777024"],
              components: {
                body_1: {
                  type: "text",
                  value: "Test User"
                }
              }
            }
          ]
        }
      }
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('');

    const response = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': process.env.MSG91_AUTH_KEY!
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response Body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed Response:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('Could not parse response as JSON');
    }

    if (!response.ok) {
      console.log('❌ API call failed');
      console.log('Status:', response.status, response.statusText);
    } else {
      console.log('✅ API call successful');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
    
    if (error instanceof Error) {
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
    }
  }

  console.log('');
  console.log('🔍 Debugging completed. Check the output above for issues.');
  console.log('');
  console.log('💡 Common issues:');
  console.log('  1. WhatsApp templates not approved in MSG91 dashboard');
  console.log('  2. MSG91 account balance insufficient');
  console.log('  3. Phone number not registered with WhatsApp Business');
  console.log('  4. Template name or namespace mismatch');
  console.log('  5. AUTH_KEY permissions insufficient');
}

debugWhatsApp();