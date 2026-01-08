import nodemailer from 'nodemailer';
import { prisma } from './database';
import { EmailType, EmailStatus } from '@prisma/client';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  recipientName: string;
  emailType: EmailType;
  clientId?: string;
  leadId?: string;
  policyInstanceId?: string;
}

export class GmailService {
  private static transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  private static senderEmail = process.env.SENDER_EMAIL || process.env.GMAIL_USER;
  private static senderName = process.env.SENDER_NAME || 'Insurance CRM';

  /**
   * Send email using Gmail SMTP
   */
  static async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Create email log entry
      const emailLog = await prisma.emailLog.create({
        data: {
          emailTemplateId: await this.getOrCreateTemplate(emailData.emailType, emailData.subject),
          recipientEmail: emailData.to,
          recipientName: emailData.recipientName,
          subject: emailData.subject,
          emailType: emailData.emailType,
          status: EmailStatus.PENDING,
          clientId: emailData.clientId,
          leadId: emailData.leadId,
          policyInstanceId: emailData.policyInstanceId,
        }
      });

      // Send email via Gmail SMTP
      const result = await this.transporter.sendMail({
        from: `${this.senderName} <${this.senderEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });

      // Update email log with success
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
        }
      });

      console.log(`✅ Email sent successfully to ${emailData.to} via Gmail`);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('Error sending email via Gmail:', error);
      
      // Update email log with error if it was created
      try {
        const emailLog = await prisma.emailLog.findFirst({
          where: {
            recipientEmail: emailData.to,
            subject: emailData.subject,
            status: EmailStatus.PENDING
          },
          orderBy: { createdAt: 'desc' }
        });

        if (emailLog) {
          await prisma.emailLog.update({
            where: { id: emailLog.id },
            data: {
              status: EmailStatus.FAILED,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            }
          });
        }
      } catch (logError) {
        console.error('Error updating email log:', logError);
      }

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send birthday wish email
   */
  static async sendBirthdayWish(recipient: { name: string; email: string; dateOfBirth: Date }, clientId?: string, leadId?: string): Promise<boolean> {
    const age = this.calculateAge(recipient.dateOfBirth);
    
    const html = this.generateBirthdayEmailHTML(recipient.name, age);
    const text = this.generateBirthdayEmailText(recipient.name, age);

    const result = await this.sendEmail({
      to: recipient.email,
      subject: `🎉 Happy Birthday ${recipient.name}!`,
      html,
      text,
      recipientName: recipient.name,
      emailType: EmailType.BIRTHDAY_WISH,
      clientId,
      leadId,
    });

    return result.success;
  }

  /**
   * Send policy renewal reminder
   */
  static async sendPolicyRenewalReminder(
    client: { name: string; email: string },
    policy: { policyNumber: string; policyType: string; expiryDate: Date },
    policyInstanceId: string,
    clientId: string
  ): Promise<boolean> {
    const daysUntilExpiry = Math.ceil((policy.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    const html = this.generateRenewalEmailHTML(client.name, policy, daysUntilExpiry);
    const text = this.generateRenewalEmailText(client.name, policy, daysUntilExpiry);

    const result = await this.sendEmail({
      to: client.email,
      subject: `⏰ Policy Renewal Reminder - ${policy.policyNumber}`,
      html,
      text,
      recipientName: client.name,
      emailType: EmailType.POLICY_RENEWAL,
      clientId,
      policyInstanceId,
    });

    return result.success;
  }

  /**
   * Get or create email template
   */
  private static async getOrCreateTemplate(emailType: EmailType, subject: string): Promise<string> {
    let template = await prisma.emailTemplate.findFirst({
      where: { type: emailType }
    });

    if (!template) {
      const { htmlContent, textContent } = this.getDefaultTemplate(emailType);
      
      template = await prisma.emailTemplate.create({
        data: {
          name: `Default ${emailType.replace('_', ' ')} Template`,
          subject: subject,
          htmlContent,
          textContent,
          type: emailType,
        }
      });
    }

    return template.id;
  }

  /**
   * Get default email templates
   */
  private static getDefaultTemplate(emailType: EmailType): { htmlContent: string; textContent: string } {
    switch (emailType) {
      case EmailType.BIRTHDAY_WISH:
        return {
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">🎉 Happy Birthday {{name}}!</h1>
              <p>Wishing you a wonderful birthday and another year of happiness and success!</p>
              <p>Thank you for being a valued client. We hope your special day is filled with joy.</p>
              <p>Best wishes,<br>Your Insurance Team</p>
            </div>
          `,
          textContent: `Happy Birthday {{name}}! Wishing you a wonderful birthday and another year of happiness and success!`
        };
      
      case EmailType.POLICY_RENEWAL:
        return {
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #dc2626;">⏰ Policy Renewal Reminder</h1>
              <p>Dear {{name}},</p>
              <p>This is a friendly reminder that your {{policyType}} policy ({{policyNumber}}) is expiring soon.</p>
              <p><strong>Expiry Date:</strong> {{expiryDate}}</p>
              <p>Please contact us to renew your policy and ensure continuous coverage.</p>
              <p>Best regards,<br>Your Insurance Team</p>
            </div>
          `,
          textContent: `Policy Renewal Reminder: Your {{policyType}} policy ({{policyNumber}}) is expiring on {{expiryDate}}.`
        };
      
      default:
        return {
          htmlContent: '<p>{{content}}</p>',
          textContent: '{{content}}'
        };
    }
  }

  /**
   * Generate birthday email HTML
   */
  private static generateBirthdayEmailHTML(name: string, age: number): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #2563eb; text-align: center; margin-bottom: 20px;">🎉 Happy Birthday ${name}!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Wishing you a wonderful ${age}th birthday filled with joy, happiness, and all your favorite things!
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Thank you for being a valued client. We appreciate your trust in our services and look forward to continuing to serve you.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; display: inline-block;">
              🎂 Hope your special day is amazing! 🎂
            </div>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Best wishes,<br>
            <strong>Your Insurance Team</strong>
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate birthday email text
   */
  private static generateBirthdayEmailText(name: string, age: number): string {
    return `Happy Birthday ${name}! Wishing you a wonderful ${age}th birthday filled with joy and happiness. Thank you for being a valued client. Best wishes, Your Insurance Team`;
  }

  /**
   * Generate renewal email HTML
   */
  private static generateRenewalEmailHTML(
    name: string, 
    policy: { policyNumber: string; policyType: string; expiryDate: Date }, 
    daysUntilExpiry: number
  ): string {
    const urgencyColor = daysUntilExpiry <= 7 ? '#dc2626' : daysUntilExpiry <= 30 ? '#f59e0b' : '#2563eb';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: ${urgencyColor}; text-align: center; margin-bottom: 20px;">⏰ Policy Renewal Reminder</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Dear ${name},
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            This is a friendly reminder that your <strong>${policy.policyType}</strong> policy is expiring soon.
          </p>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #374151;"><strong>Policy Number:</strong> ${policy.policyNumber}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: #374151;"><strong>Expiry Date:</strong> ${policy.expiryDate.toLocaleDateString()}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: ${urgencyColor};"><strong>Days Remaining:</strong> ${daysUntilExpiry} days</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Please contact us as soon as possible to renew your policy and ensure continuous coverage. Don't let your protection lapse!
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Best regards,<br>
            <strong>Your Insurance Team</strong>
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate renewal email text
   */
  private static generateRenewalEmailText(
    name: string, 
    policy: { policyNumber: string; policyType: string; expiryDate: Date }, 
    daysUntilExpiry: number
  ): string {
    return `Policy Renewal Reminder: Dear ${name}, your ${policy.policyType} policy (${policy.policyNumber}) expires on ${policy.expiryDate.toLocaleDateString()} - ${daysUntilExpiry} days remaining. Please contact us to renew.`;
  }

  /**
   * Calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get email logs for dashboard
   */
  static async getEmailLogs(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.emailLog.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
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
      }
    });
  }

  /**
   * Get email statistics
   */
  static async getEmailStats(days: number = 30): Promise<{
    totalSent: number;
    totalFailed: number;
    birthdayWishes: number;
    policyRenewals: number;
    successRate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await prisma.emailLog.groupBy({
      by: ['status', 'emailType'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: true
    });

    let totalSent = 0;
    let totalFailed = 0;
    let birthdayWishes = 0;
    let policyRenewals = 0;

    stats.forEach(stat => {
      if (stat.status === EmailStatus.SENT) {
        totalSent += stat._count;
      } else if (stat.status === EmailStatus.FAILED) {
        totalFailed += stat._count;
      }

      if (stat.emailType === EmailType.BIRTHDAY_WISH) {
        birthdayWishes += stat._count;
      } else if (stat.emailType === EmailType.POLICY_RENEWAL) {
        policyRenewals += stat._count;
      }
    });

    const total = totalSent + totalFailed;
    const successRate = total > 0 ? (totalSent / total) * 100 : 0;

    return {
      totalSent,
      totalFailed,
      birthdayWishes,
      policyRenewals,
      successRate: Math.round(successRate * 100) / 100
    };
  }
}