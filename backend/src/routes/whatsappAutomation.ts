import { Router } from 'express';
import { WhatsAppAutomationController } from '../controllers/whatsappAutomationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Dashboard and overview routes
router.get('/dashboard', WhatsAppAutomationController.getDashboard);
router.get('/stats', WhatsAppAutomationController.getWhatsAppStats);

// WhatsApp logs and history
router.get('/logs', WhatsAppAutomationController.getWhatsAppLogs);

// Upcoming events
router.get('/upcoming-birthdays', WhatsAppAutomationController.getUpcomingBirthdays);
router.get('/upcoming-renewals', WhatsAppAutomationController.getUpcomingRenewals);

// Manual triggers
router.post('/send-birthday-wishes', WhatsAppAutomationController.sendBirthdayWishes);
router.post('/send-renewal-reminders', WhatsAppAutomationController.sendRenewalReminders);
router.post('/run-all', WhatsAppAutomationController.runAllTasks);

// Custom WhatsApp message
router.post('/send-custom-message', WhatsAppAutomationController.sendCustomMessage);

export default router;