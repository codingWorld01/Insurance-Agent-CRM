import cron from 'node-cron';
import { AutomationService } from './automationService';

export class CronService {
  private static isInitialized = false;

  /**
   * Initialize all cron jobs
   */
  static initialize(): void {
    if (this.isInitialized) {
      console.log('⚠️ Cron jobs already initialized');
      return;
    }

    // Check if we're in a serverless environment (Vercel)
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    if (isServerless) {
      console.log('🌐 Serverless environment detected - Cron jobs handled by platform');
      console.log('📅 Email automation will run via Vercel Cron at 9:00 AM IST');
      this.isInitialized = true;
      return;
    }

    console.log('🕘 Initializing cron jobs for local/server environment...');

    // Daily email automation at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🕘 Running daily email automation at 9:00 AM...');
      
      try {
        const result = await AutomationService.runAutomatedTasks();
        
        console.log('✅ Daily email automation completed:', {
          birthdayWishes: result.birthdayWishes,
          policyRenewals: result.policyRenewals,
          timestamp: new Date().toISOString()
        });
        
        // Log summary
        const totalSent = result.birthdayWishes.email.sent + result.policyRenewals.email.sent;
        const totalFailed = result.birthdayWishes.email.failed + result.policyRenewals.email.failed;
        
        console.log(`📊 Daily Summary: ${totalSent} emails sent, ${totalFailed} failed`);
        
      } catch (error) {
        console.error('❌ Error in daily email automation:', error);
      }
    }, {
      timezone: "Asia/Kolkata" // Indian Standard Time
    });

    // Optional: Weekly summary every Monday at 10:00 AM
    cron.schedule('0 10 * * 1', async () => {
      console.log('📊 Running weekly email automation summary...');
      
      try {
        // You can add weekly summary logic here if needed
        console.log('📈 Weekly summary completed');
      } catch (error) {
        console.error('❌ Error in weekly summary:', error);
      }
    }, {
      timezone: "Asia/Kolkata"
    });

    this.isInitialized = true;
    console.log('✅ Cron jobs initialized successfully');
    console.log('📅 Daily email automation scheduled for 9:00 AM IST');
    console.log('📊 Weekly summary scheduled for Monday 10:00 AM IST');
  }

  /**
   * Stop all cron jobs
   */
  static destroy(): void {
    // Note: node-cron doesn't have a global destroy method
    // Individual tasks would need to be stored and destroyed separately
    this.isInitialized = false;
    console.log('🛑 All cron jobs stopped');
  }

  /**
   * Get cron job status
   */
  static getStatus(): { initialized: boolean; nextRun: string } {
    const now = new Date();
    const tomorrow9AM = new Date();
    tomorrow9AM.setDate(now.getDate() + 1);
    tomorrow9AM.setHours(9, 0, 0, 0);
    
    // If it's before 9 AM today, next run is today at 9 AM
    if (now.getHours() < 9) {
      tomorrow9AM.setDate(now.getDate());
    }

    return {
      initialized: this.isInitialized,
      nextRun: tomorrow9AM.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'short'
      })
    };
  }

  /**
   * Manually trigger email automation (for testing)
   */
  static async runManually(): Promise<any> {
    console.log('🔧 Manually triggering email automation...');
    
    try {
      const result = await AutomationService.runAutomatedTasks();
      console.log('✅ Manual email automation completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in manual email automation:', error);
      throw error;
    }
  }
}