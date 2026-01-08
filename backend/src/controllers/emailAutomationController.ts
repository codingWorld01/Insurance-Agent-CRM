import { Request, Response } from 'express';
import { GmailService } from '../services/gmailService';
import { AutomationService } from '../services/automationService';
import { CronService } from '../services/cronService';
import { prisma } from '../services/database';

export class EmailAutomationController {
  /**
   * GET /api/email-automation/dashboard
   * Get email automation dashboard data
   */
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { days = 30 } = req.query;
      const daysNumber = parseInt(days as string, 10);

      const [emailLogs, emailStats, upcomingBirthdays, upcomingRenewals, cronStatus] = await Promise.all([
        GmailService.getEmailLogs(daysNumber),
        GmailService.getEmailStats(daysNumber),
        AutomationService.getUpcomingBirthdays(),
        AutomationService.getUpcomingRenewals(60),
        Promise.resolve(CronService.getStatus())
      ]);

      res.json({
        success: true,
        data: {
          emailLogs,
          stats: emailStats,
          upcomingBirthdays,
          upcomingRenewals: upcomingRenewals.map(renewal => ({
            ...renewal,
            daysUntilExpiry: Math.ceil((new Date(renewal.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          })),
          cronStatus
        }
      });
    } catch (error) {
      console.error('Error fetching email automation dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email automation dashboard',
        statusCode: 500
      });
    }
  }

  /**
   * GET /api/email-automation/logs
   * Get email logs with pagination
   */
  static async getEmailLogs(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 50, days = 30, type, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const where: any = {
        createdAt: {
          gte: startDate
        }
      };

      if (type) {
        where.emailType = type;
      }

      if (status) {
        where.status = status;
      }

      const [logs, total] = await Promise.all([
        prisma.emailLog.findMany({
          where,
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            lead: {
              select: {
                name: true,
                email: true
              }
            },
            emailTemplate: {
              select: {
                name: true,
                type: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: Number(limit)
        }),
        prisma.emailLog.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching email logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email logs',
        statusCode: 500
      });
    }
  }

  /**
   * POST /api/email-automation/send-birthday-wishes
   * Manually trigger birthday wishes
   */
  static async sendBirthdayWishes(req: Request, res: Response): Promise<void> {
    try {
      const result = await AutomationService.processBirthdayWishes();
      
      res.json({
        success: true,
        data: result,
        message: `Birthday wishes processed: ${result.sent} sent, ${result.failed} failed`
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
   * POST /api/email-automation/send-renewal-reminders
   * Manually trigger policy renewal reminders
   */
  static async sendRenewalReminders(req: Request, res: Response): Promise<void> {
    try {
      const { daysBefore = 30 } = req.body;
      const result = await AutomationService.processPolicyRenewals(daysBefore);
      
      res.json({
        success: true,
        data: result,
        message: `Renewal reminders processed: ${result.sent} sent, ${result.failed} failed`
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
   * POST /api/email-automation/run-all
   * Run all automated tasks
   */
  static async runAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const result = await AutomationService.runAutomatedTasks();
      
      res.json({
        success: true,
        data: result,
        message: 'All automated tasks completed'
      });
    } catch (error) {
      console.error('Error running automated tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run automated tasks',
        statusCode: 500
      });
    }
  }

  /**
   * GET /api/email-automation/upcoming-birthdays
   * Get upcoming birthdays
   */
  static async getUpcomingBirthdays(req: Request, res: Response): Promise<void> {
    try {
      const birthdays = await AutomationService.getUpcomingBirthdays();
      
      res.json({
        success: true,
        data: birthdays
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
   * GET /api/email-automation/upcoming-renewals
   * Get upcoming policy renewals
   */
  static async getUpcomingRenewals(req: Request, res: Response): Promise<void> {
    try {
      const { days = 60 } = req.query;
      const renewals = await AutomationService.getUpcomingRenewals(Number(days));
      
      res.json({
        success: true,
        data: renewals.map(renewal => ({
          ...renewal,
          daysUntilExpiry: Math.ceil((new Date(renewal.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        }))
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
   * POST /api/email-automation/send-custom-email
   * Send custom email
   */
  static async sendCustomEmail(req: Request, res: Response): Promise<void> {
    try {
      const { to, subject, html, text, recipientName, clientId, leadId } = req.body;

      if (!to || !subject || !html || !recipientName) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: to, subject, html, recipientName',
          statusCode: 400
        });
        return;
      }

      const result = await GmailService.sendEmail({
        to,
        subject,
        html,
        text,
        recipientName,
        emailType: 'CUSTOM' as any,
        clientId,
        leadId
      });

      if (result.success) {
        res.json({
          success: true,
          data: { messageId: result.messageId },
          message: 'Email sent successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to send email',
          statusCode: 400
        });
      }
    } catch (error) {
      console.error('Error sending custom email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send custom email',
        statusCode: 500
      });
    }
  }

  /**
   * GET /api/email-automation/templates
   * Get email templates
   */
  static async getEmailTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await prisma.emailTemplate.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email templates',
        statusCode: 500
      });
    }
  }

  /**
   * GET /api/email-automation/stats
   * Get email statistics
   */
  static async getEmailStats(req: Request, res: Response): Promise<void> {
    try {
      const { days = 30 } = req.query;
      const stats = await GmailService.getEmailStats(Number(days));
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching email stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email stats',
        statusCode: 500
      });
    }
  }
}