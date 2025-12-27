import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('🔍 Verifying database data...');
    
    const counts = await Promise.all([
      prisma.lead.count(),
      prisma.client.count(),
      prisma.policyTemplate.count(),
      prisma.policyInstance.count(),
      prisma.activity.count(),
      prisma.settings.count()
    ]);

    console.log('\n📊 Database Summary:');
    console.log(`👥 Leads: ${counts[0]}`);
    console.log(`👤 Clients: ${counts[1]}`);
    console.log(`📋 Policy Templates: ${counts[2]}`);
    console.log(`📄 Policy Instances: ${counts[3]}`);
    console.log(`📊 Activities: ${counts[4]}`);
    console.log(`⚙️  Settings: ${counts[5]}`);

    // Check if demo user exists
    const demoUser = await prisma.settings.findFirst({
      where: { agentEmail: 'demo@insurance.com' }
    });

    if (demoUser) {
      console.log('\n✅ Demo user found: demo@insurance.com');
      console.log('🔑 Password: Amit@123');
    } else {
      console.log('\n❌ Demo user not found');
    }

    console.log('\n🎉 Data verification completed!');
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();