const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkAndCreateUser() {
  try {
    console.log('Checking existing settings...');
    
    // Check if settings exist
    const settings = await prisma.settings.findFirst();
    
    if (settings) {
      console.log('Found existing settings:');
      console.log('Email:', settings.agentEmail);
      console.log('Name:', settings.agentName);
      
      // Test the password you're trying to use
      const isValidPassword = await bcrypt.compare('admin123', settings.passwordHash);
      console.log('Password "admin123" is valid:', isValidPassword);
      
      const isValidPassword2 = await bcrypt.compare('password123', settings.passwordHash);
      console.log('Password "password123" is valid:', isValidPassword2);
    } else {
      console.log('No settings found. Creating new settings...');
      
      // Create settings with your desired credentials
      const passwordHash = await bcrypt.hash('admin123', 12);
      
      const newSettings = await prisma.settings.create({
        data: {
          passwordHash,
          agentName: 'Insurance Agent',
          agentEmail: 'agent@insurancecrm.com'
        }
      });
      
      console.log('Created new settings:');
      console.log('Email:', newSettings.agentEmail);
      console.log('Password: admin123');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateUser();