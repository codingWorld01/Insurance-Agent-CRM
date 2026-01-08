import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsappService';
import { AutomationService } from '../services/automationService';
import { prisma } from '../services/database';

export class WhatsAppAutomationController {
  /**
   * GET /api/whatsapp-automation/dashboard
   * Get WhatsApp automation dashboard data
   */
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { days = 30 } = req.query;
      const daysNumber = parseInt(days as string, 10);

      const [whatsappLogs, whatsappStats, upcomingBirthdays, upcomingRenewals] = await Promise.all([
        WhatsAppService.getWhatsAppLogs(daysNumber),
        WhatsAppService.getWhatsAppStats(daysNumber),
        AutomationService.getUpcomingBirthdays(),
        AutomationService.getUpcomingRenewals(60)
      ]);

      res.json({
        success: true,
        data: {
          whatsappLogs: whatsappLogs.logs,
          stats: whatsappStats,
          upcomingBirthdays: upcomingBirthdays.filter(b => b.hasWhatsApp),
          upcomingRenewals: upcomingRenewals.filter(r => r.hasWhatsApp).map(renewal => ({
            ...renewal,
            daysUntilExpiry: Math.ceil((new Date(renewal.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching WhatsApp automation dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch WhatsApp automation dashboard',
        statusCode: 500
      });
    }
  }

  /**
   * GET /api/whatsapp-automation/logs
   * Get WhatsApp logs with pagination
   */
  static async getWhatsAppLogs(req: Request, res: Response): Promise<void> {
    try {
      const { days = 30, page = 1, limit = 50 } = req.query;
      const daysNumber = parseInt(days as string, 10);
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      const result = await WhatsAppService.getWhatsAppLogs(daysNumber, pageNumber, limitNumber);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching WhatsApp logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch WhatsApp logs',
        statusCode: 500
      });
    }
  }

  /**
   * GET /api/whatsapp-automation/stats
   * Get WhatsApp statistics
   */
  static async getWhatsAppStats(req: Request, res: Response): Promise<void> {
    try {
      const { days = 30 } = req.query;
      const daysNumber = parseInt(days as string, 10);

      const stats = await WhatsAppService.getWhatsAppStats(daysNumber);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching WhatsApp stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch WhatsApp statistics',
        statusCode: 500
      });
    }
  }

  /**
   * GET /api/whatsapp-automation/upcoming-birthdays
   * Get upcoming birthdays with WhatsApp numbers
   */
  static async getUpcomingBirthdays(req: Request, res: Response): Promise<void> {
    try {
      const upcomingBirthdays = await AutomationService.getUpcomingBirthdays();
      const whatsappBirthdays = upcomingBirthdays.filter(birthday => birthday.hasWhatsApp);

      res.json({
        success: true,
        data: whatsappBirthdays
      });
    } catch (error) {
      console.error('Error fetching upcoming birthdays:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming birthdays',
        statusCode: 500
      });
    }
  }

  /**
   * GET /api/whatsapp-automation/upcoming-renewals
   * Get upcoming renewals with WhatsApp numbers
   */
  static async getUpcomingRenewals(req: Request, res: Response): Promise<void> {
    try {
      const { days = 60 } = req.query;
      const daysNumber = parseInt(days as string, 10);

      const upcomingRenewals = await AutomationService.getUpcomingRenewals(daysNumber);
      const whatsappRenewals = upcomingRenewals.filter(renewal => renewal.hasWhatsApp);

      const renewalsWithDays = whatsappRenewals.map(renewal => ({
        ...renewal,
        daysUntilExpiry: Math.ceil((new Date(renewal.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }));

      res.json({
        success: true,
        data: renewalsWithDays
      });
    } catch (error) {
      console.error('Error fetching upcoming renewals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming renewals',
        statusCode: 500
      });
    }
  }

  /**
   * POST /api/whatsapp-automation/send-birthday-wishes
   * Manually trigger birthday wishes via WhatsApp
   */
  static async sendBirthdayWishes(req: Request, res: Response): Promise<void> {
    try {
      const result = await AutomationService.processBirthdayWishes();

      res.json({
        success: true,
        message: 'Birthday wishes processing completed',
        data: {
          whatsapp: result.whatsapp
        }
      });
    } catch (error) {
      console.error('Error sending birthday wishes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send birthday wishes',
        statusCode: 500
      });
    }
  }

  /**
   * POST /api/whatsapp-automation/send-renewal-reminders
   * Manually trigger renewal reminders via WhatsApp
   */
  static async sendRenewalReminders(req: Request, res: Response): Promise<void> {
    try {
      const { daysBefore = 30 } = req.body;
      const result = await AutomationService.processPolicyRenewals(daysBefore);

      res.json({
        success: true,
        message: 'Renewal reminders processing completed',
        data: {
          whatsapp: result.whatsapp
        }
      });
    } catch (error) {
      console.error('Error sending renewal reminders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send renewal reminders',
        statusCode: 500
      });
    }
  }

  /**
   * POST /api/whatsapp-automation/run-all
   * Run all WhatsApp automation tasks
   */
  static async runAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const result = await AutomationService.runAutomatedTasks();

      res.json({
        success: true,
        message: 'All WhatsApp automation tasks completed',
        data: {
          birthdayWishes: result.birthdayWishes.whatsapp,
          policyRenewals: result.policyRenewals.whatsapp
        }
      });
    } catch (error) {
      console.error('Error running WhatsApp automation tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run WhatsApp automation tasks',
        statusCode: 500
      });
    }
  }

  /**
   * POST /api/whatsapp-automation/send-custom-message
   * Send custom WhatsApp message
   */
  static async sendCustomMessage(req: Request, res: Response): Promise<void> {
    try {
      const { recipientPhone, recipientName, templateName, components, clientId, leadId } = req.body;

      if (!recipientPhone || !recipientName || !templateName) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: recipientPhone, recipientName, templateName',
          statusCode: 400
        });
        return;
      }

      const result = await WhatsAppService.sendMessage({
        to: recipientPhone,
        recipientName,
        messageType: 'CUSTOM' as any,
        templateName,
        components: components || {},
        clientId,
        leadId
      });

      if (result.success) {
        res.json({
          success: true,
          message: 'WhatsApp message sent successfully',
          data: {
            messageId: result.messageId
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error || 'Failed to send WhatsApp message',
          statusCode: 500
        });
      }
    } catch (error) {
      console.error('Error sending custom WhatsApp message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send custom WhatsApp message',
        statusCode: 500
      });
    }
  }
}