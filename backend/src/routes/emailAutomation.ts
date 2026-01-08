import { Router } from 'express';
import { EmailAutomationController } from '../controllers/emailAutomationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Dashboard and overview routes
router.get('/dashboard', EmailAutomationController.getDashboard);
router.get('/stats', EmailAutomationController.getEmailStats);

// Email logs and history
router.get('/logs', EmailAutomationController.getEmailLogs);

// Upcoming events
router.get('/upcoming-birthdays', EmailAutomationController.getUpcomingBirthdays);
router.get('/upcoming-renewals', EmailAutomationController.getUpcomingRenewals);

// Manual triggers
router.post('/send-birthday-wishes', EmailAutomationController.sendBirthdayWishes);
router.post('/send-renewal-reminders', EmailAutomationController.sendRenewalReminders);
router.post('/run-all', EmailAutomationController.runAllTasks);

// Custom email
router.post('/send-custom-email', EmailAutomationController.sendCustomEmail);

// Internal automation endpoint for cron jobs
router.post('/run-automation', async (req, res) => {
  try {
    // Optional: Verify internal API key
    const authHeader = req.headers.authorization;
    const internalKey = process.env.INTERNAL_API_KEY || 'internal-cron-key';
    
    if (authHeader !== `Bearer ${internalKey}`) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid internal API key'
      });
    }

    console.log('🤖 Internal Cron: Running automated email tasks...');
    
    const { AutomationService } = require('../services/automationService');
    const result = await AutomationService.runAutomatedTasks();
    
    console.log('✅ Internal Cron: Automation completed', result);
    
    res.json({
      success: true,
      data: result,
      message: 'Automated email tasks completed successfully'
    });
    
  } catch (error) {
    console.error('❌ Internal Cron: Automation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Automated email tasks failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Templates
router.get('/templates', EmailAutomationController.getEmailTemplates);

// Cron status
router.get('/cron-status', (req, res) => {
  const status = require('../services/cronService').CronService.getStatus();
  res.json({ success: true, data: status });
});

export default router;