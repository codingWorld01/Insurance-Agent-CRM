#!/usr/bin/env node

/**
 * Email Automation Runner
 * 
 * This script runs the automated email tasks (birthday wishes and policy renewals).
 * It can be run manually or scheduled via cron.
 * 
 * Usage:
 *   npm run email-automation
 *   or
 *   npx tsx src/scripts/runEmailAutomation.ts
 * 
 * Cron example (run daily at 9 AM):
 *   0 9 * * * cd /path/to/project && npm run email-automation
 */

import { AutomationService } from '../services/automationService';
import { prisma } from '../services/database';

async function runEmailAutomation() {
  console.log('🚀 Starting email automation tasks...');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  
  try {
    // Run all automated tasks
    const results = await AutomationService.runAutomatedTasks();
    
    console.log('\n📊 Results:');
    console.log(`🎂 Birthday Wishes: ${results.birthdayWishes.sent} sent, ${results.birthdayWishes.failed} failed`);
    console.log(`📋 Policy Renewals: ${results.policyRenewals.sent} sent, ${results.policyRenewals.failed} failed`);
    
    const totalSent = results.birthdayWishes.sent + results.policyRenewals.sent;
    const totalFailed = results.birthdayWishes.failed + results.policyRenewals.failed;
    
    console.log(`\n✅ Total: ${totalSent} emails sent, ${totalFailed} failed`);
    
    if (totalSent > 0) {
      console.log('🎉 Email automation completed successfully!');
    } else {
      console.log('ℹ️  No emails were sent (no recipients found or already sent today)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running email automation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted, cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Process terminated, cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the automation
runEmailAutomation();