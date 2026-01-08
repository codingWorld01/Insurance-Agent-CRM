import { prisma } from '../services/database';
import bcrypt from 'bcrypt';

async function updateCredentials() {
  console.log('🔧 Updating CRM credentials...');
  
  try {
    // Hash the new password
    const newPassword = 'Amit@123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the settings with new email and password
    const updatedSettings = await prisma.settings.updateMany({
      data: {
        passwordHash: hashedPassword,
        agentName: 'Amit Ulhe',
        agentEmail: 'amitulhe@gmail.com'
      }
    });

    console.log('✅ Settings updated successfully!');
    console.log('');
    console.log('🔐 New Login Credentials:');
    console.log('  📧 Email: amitulhe@gmail.com');
    console.log('  🔑 Password: Amit@123');
    console.log('');
    console.log('👤 Agent Information:');
    console.log('  📛 Name: Amit Ulhe');
    console.log('  📧 Email: amitulhe@gmail.com');
    console.log('');
    console.log('🎯 You can now login with these new credentials!');

  } catch (error) {
    console.error('❌ Error updating credentials:', error);
    throw error;
  }
}

// Run the update if this file is executed directly
if (require.main === module) {
  updateCredentials()
    .then(() => {
      console.log('✅ Credentials update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Credentials update failed:', error);
      process.exit(1);
    });
}

export { updateCredentials };