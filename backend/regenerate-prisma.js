const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Regenerating Prisma Client...');

try {
  // Try to stop any running processes that might be using the client
  console.log('📦 Generating Prisma Client...');
  
  // Remove existing client if it exists
  const clientPath = path.join(__dirname, 'node_modules', '.prisma', 'client');
  if (fs.existsSync(clientPath)) {
    console.log('🗑️  Removing existing Prisma client...');
    fs.rmSync(clientPath, { recursive: true, force: true });
  }
  
  // Generate new client
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  console.log('✅ Prisma Client regenerated successfully!');
  console.log('🚀 You can now restart your server.');
  
} catch (error) {
  console.error('❌ Error regenerating Prisma Client:', error.message);
  console.log('💡 Try running this manually:');
  console.log('   1. Stop the server');
  console.log('   2. Run: npx prisma generate');
  console.log('   3. Restart the server');
}