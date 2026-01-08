import { prisma } from './database';
import { GmailService } from './gmailService';
import { WhatsAppService } from './whatsappService';
import { EmailType, AutomationTrigger, MessageType, MessageChannel } from '@prisma/client';

export class AutomationService {
  /**
   * Check and send birthday wishes for today (Email + WhatsApp)
   */
  static async processBirthdayWishes(): Promise<{ 
    email: { sent: number; failed: number }; 
    whatsapp: { sent: number; failed: number } 
  }> {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const todayDay = today.getDate();

    let emailSent = 0, emailFailed = 0;
    let whatsappSent = 0, whatsappFailed = 0;

    try {
      // Find clients with birthdays today
      const allClients = await prisma.client.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          whatsappNumber: true,
          dateOfBirth: true
        }
      });

      // Filter clients whose birthday is today
      const birthdayClients = allClients.filter(client => {
        if (!client.dateOfBirth) return false;
        const birthDate = new Date(client.dateOfBirth);
        return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay;
      });

      // Check if we already sent birthday wishes today (Email)
      const alreadySentEmailToday = await prisma.emailLog.findMany({
        where: {
          emailType: EmailType.BIRTHDAY_WISH,
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          }
        },
        select: { clientId: true }
      });

      // Check if we already sent birthday wishes today (WhatsApp)
      const alreadySentWhatsAppToday = await prisma.whatsAppLog.findMany({
        where: {
          messageType: MessageType.BIRTHDAY_WISH,
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          }
        },
        select: { clientId: true }
      });

      const alreadySentEmailClientIds = new Set(alreadySentEmailToday.map(log => log.clientId).filter(Boolean));
      const alreadySentWhatsAppClientIds = new Set(alreadySentWhatsAppToday.map(log => log.clientId).filter(Boolean));

      // Send birthday wishes to clients
      for (const client of birthdayClients) {
        const clientName = `${client.firstName} ${client.lastName}`;

        // Send Email if email exists and not already sent
        if (client.email && client.email.trim() !== '' && !alreadySentEmailClientIds.has(client.id)) {
          const emailSuccess = await GmailService.sendBirthdayWish(
            {
              name: clientName,
              email: client.email,
              dateOfBirth: client.dateOfBirth!
            },
            client.id
          );

          if (emailSuccess) {
            emailSent++;
          } else {
            emailFailed++;
          }
        }

        // Send WhatsApp if WhatsApp number exists and not already sent
        if (client.whatsappNumber && client.whatsappNumber.trim() !== '' && !alreadySentWhatsAppClientIds.has(client.id)) {
          const whatsappResult = await WhatsAppService.sendBirthdayWish(
            client.whatsappNumber,
            clientName,
            client.id
          );

          if (whatsappResult.success) {
            whatsappSent++;
          } else {
            whatsappFailed++;
          }
        }
      }

      // Also check leads with birthdays
      const allLeads = await prisma.lead.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          whatsappNumber: true,
          dateOfBirth: true
        }
      });

      const birthdayLeads = allLeads.filter(lead => {
        if (!lead.dateOfBirth) return false;
        const birthDate = new Date(lead.dateOfBirth);
        return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay;
      });

      const alreadySentEmailLeadIds = new Set(
        (await prisma.emailLog.findMany({
          where: {
            emailType: EmailType.BIRTHDAY_WISH,
            createdAt: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            }
          },
          select: { leadId: true }
        })).map(log => log.leadId).filter(Boolean)
      );

      const alreadySentWhatsAppLeadIds = new Set(
        (await prisma.whatsAppLog.findMany({
          where: {
            messageType: MessageType.BIRTHDAY_WISH,
            createdAt: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            }
          },
          select: { leadId: true }
        })).map(log => log.leadId).filter(Boolean)
      );

      for (const lead of birthdayLeads) {
        // Send Email
        if (lead.email && lead.email.trim() !== '' && !alreadySentEmailLeadIds.has(lead.id)) {
          const emailSuccess = await GmailService.sendBirthdayWish(
            {
              name: lead.name,
              email: lead.email,
              dateOfBirth: lead.dateOfBirth!
            },
            undefined,
            lead.id
          );

          if (emailSuccess) {
            emailSent++;
          } else {
            emailFailed++;
          }
        }

        // Send WhatsApp
        if (lead.whatsappNumber && lead.whatsappNumber.trim() !== '' && !alreadySentWhatsAppLeadIds.has(lead.id)) {
          const whatsappResult = await WhatsAppService.sendBirthdayWish(
            lead.whatsappNumber,
            lead.name,
            undefined,
            lead.id
          );

          if (whatsappResult.success) {
            whatsappSent++;
          } else {
            whatsappFailed++;
          }
        }
      }

      console.log(`Birthday wishes processed - Email: ${emailSent} sent, ${emailFailed} failed | WhatsApp: ${whatsappSent} sent, ${whatsappFailed} failed`);
      return { 
        email: { sent: emailSent, failed: emailFailed },
        whatsapp: { sent: whatsappSent, failed: whatsappFailed }
      };

    } catch (error) {
      console.error('Error processing birthday wishes:', error);
      return { 
        email: { sent: emailSent, failed: emailFailed },
        whatsapp: { sent: whatsappSent, failed: whatsappFailed }
      };
    }
  }

  /**
   * Check and send policy renewal reminders (Email + WhatsApp)
   */
  static async processPolicyRenewals(daysBefore: number = 30): Promise<{ 
    email: { sent: number; failed: number }; 
    whatsapp: { sent: number; failed: number } 
  }> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysBefore);

    let emailSent = 0, emailFailed = 0;
    let whatsappSent = 0, whatsappFailed = 0;

    try {
      // Find policy instances expiring within the specified days
      const expiringPolicies = await prisma.policyInstance.findMany({
        where: {
          status: 'Active',
          expiryDate: {
            lte: futureDate,
            gte: new Date() // Not already expired
          }
        },
        include: {
          client: true,
          policyTemplate: true
        }
      });

      // Check which policies already have renewal reminders sent recently (Email)
      const recentEmailReminders = await prisma.emailLog.findMany({
        where: {
          emailType: EmailType.POLICY_RENEWAL,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        select: { policyInstanceId: true }
      });

      // Check which policies already have renewal reminders sent recently (WhatsApp)
      const recentWhatsAppReminders = await prisma.whatsAppLog.findMany({
        where: {
          messageType: MessageType.POLICY_RENEWAL,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        select: { policyInstanceId: true }
      });

      const recentEmailReminderPolicyIds = new Set(
        recentEmailReminders.map(log => log.policyInstanceId).filter(Boolean)
      );
      const recentWhatsAppReminderPolicyIds = new Set(
        recentWhatsAppReminders.map(log => log.policyInstanceId).filter(Boolean)
      );

      // Send renewal reminders
      for (const policyInstance of expiringPolicies) {
        const clientName = `${policyInstance.client.firstName} ${policyInstance.client.lastName}`;
        const expiryDateStr = policyInstance.expiryDate.toLocaleDateString('en-IN');
        const premiumAmountStr = policyInstance.premiumAmount.toLocaleString('en-IN');

        // Send Email if email exists and not already sent
        if (policyInstance.client.email && 
            policyInstance.client.email.trim() !== '' && 
            !recentEmailReminderPolicyIds.has(policyInstance.id)) {
          
          const emailSuccess = await GmailService.sendPolicyRenewalReminder(
            {
              name: clientName,
              email: policyInstance.client.email
            },
            {
              policyNumber: policyInstance.policyTemplate.policyNumber,
              policyType: policyInstance.policyTemplate.policyType,
              expiryDate: policyInstance.expiryDate
            },
            policyInstance.id,
            policyInstance.clientId
          );

          if (emailSuccess) {
            emailSent++;
          } else {
            emailFailed++;
          }
        }

        // Send WhatsApp if WhatsApp number exists and not already sent
        if (policyInstance.client.whatsappNumber && 
            policyInstance.client.whatsappNumber.trim() !== '' && 
            !recentWhatsAppReminderPolicyIds.has(policyInstance.id)) {
          
          const whatsappResult = await WhatsAppService.sendPolicyRenewalReminder(
            policyInstance.client.whatsappNumber,
            clientName,
            policyInstance.policyTemplate.policyType,
            policyInstance.policyTemplate.policyNumber,
            policyInstance.policyTemplate.provider,
            expiryDateStr,
            premiumAmountStr,
            policyInstance.clientId,
            policyInstance.id
          );

          if (whatsappResult.success) {
            whatsappSent++;
          } else {
            whatsappFailed++;
          }
        }
      }

      console.log(`Policy renewal reminders processed - Email: ${emailSent} sent, ${emailFailed} failed | WhatsApp: ${whatsappSent} sent, ${whatsappFailed} failed`);
      return { 
        email: { sent: emailSent, failed: emailFailed },
        whatsapp: { sent: whatsappSent, failed: whatsappFailed }
      };

    } catch (error) {
      console.error('Error processing policy renewals:', error);
      return { 
        email: { sent: emailSent, failed: emailFailed },
        whatsapp: { sent: whatsappSent, failed: whatsappFailed }
      };
    }
  }

  /**
   * Run all automated tasks (Email + WhatsApp)
   */
  static async runAutomatedTasks(): Promise<{
    birthdayWishes: { email: { sent: number; failed: number }; whatsapp: { sent: number; failed: number } };
    policyRenewals: { email: { sent: number; failed: number }; whatsapp: { sent: number; failed: number } };
  }> {
    console.log('Running automated tasks (Email + WhatsApp)...');

    const [birthdayResults, renewalResults] = await Promise.all([
      this.processBirthdayWishes(),
      this.processPolicyRenewals(30) // 30 days before expiry
    ]);

    // Update automation logs
    await this.updateAutomationLogs();

    return {
      birthdayWishes: birthdayResults,
      policyRenewals: renewalResults
    };
  }

  /**
   * Update automation logs for both Email and WhatsApp
   */
  private static async updateAutomationLogs(): Promise<void> {
    const now = new Date();

    // Update Email automation logs
    await prisma.emailAutomation.upsert({
      where: {
        emailType_triggerCondition: {
          emailType: EmailType.BIRTHDAY_WISH,
          triggerCondition: AutomationTrigger.BIRTHDAY
        }
      },
      update: {
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Next day
      },
      create: {
        name: 'Birthday Wishes',
        emailType: EmailType.BIRTHDAY_WISH,
        triggerCondition: AutomationTrigger.BIRTHDAY,
        isActive: true,
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    await prisma.emailAutomation.upsert({
      where: {
        emailType_triggerCondition: {
          emailType: EmailType.POLICY_RENEWAL,
          triggerCondition: AutomationTrigger.POLICY_EXPIRY
        }
      },
      update: {
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Next day
      },
      create: {
        name: 'Policy Renewal Reminders',
        emailType: EmailType.POLICY_RENEWAL,
        triggerCondition: AutomationTrigger.POLICY_EXPIRY,
        isActive: true,
        daysBefore: 30,
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Update WhatsApp automation logs
    await prisma.messageAutomation.upsert({
      where: {
        messageType_channel_triggerCondition: {
          messageType: MessageType.BIRTHDAY_WISH,
          channel: MessageChannel.WHATSAPP,
          triggerCondition: AutomationTrigger.BIRTHDAY
        }
      },
      update: {
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      },
      create: {
        name: 'WhatsApp Birthday Wishes',
        messageType: MessageType.BIRTHDAY_WISH,
        channel: MessageChannel.WHATSAPP,
        triggerCondition: AutomationTrigger.BIRTHDAY,
        isActive: true,
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    await prisma.messageAutomation.upsert({
      where: {
        messageType_channel_triggerCondition: {
          messageType: MessageType.POLICY_RENEWAL,
          channel: MessageChannel.WHATSAPP,
          triggerCondition: AutomationTrigger.POLICY_EXPIRY
        }
      },
      update: {
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      },
      create: {
        name: 'WhatsApp Policy Renewal Reminders',
        messageType: MessageType.POLICY_RENEWAL,
        channel: MessageChannel.WHATSAPP,
        triggerCondition: AutomationTrigger.POLICY_EXPIRY,
        isActive: true,
        daysBefore: 30,
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      }
    });
  }

  /**
   * Get upcoming birthdays (next 30 days) with both email and WhatsApp contacts
   */
  static async getUpcomingBirthdays(): Promise<any[]> {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    // Get all clients and leads with birthdays
    const [allClients, allLeads] = await Promise.all([
      prisma.client.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          whatsappNumber: true,
          dateOfBirth: true
        }
      }),
      prisma.lead.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          whatsappNumber: true,
          dateOfBirth: true
        }
      })
    ]);

    // Filter for valid data (must have either email or WhatsApp)
    const clients = allClients.filter(client => 
      client.dateOfBirth && (
        (client.email && client.email.trim() !== '') || 
        (client.whatsappNumber && client.whatsappNumber.trim() !== '')
      )
    );
    const leads = allLeads.filter(lead => 
      lead.dateOfBirth && (
        (lead.email && lead.email.trim() !== '') || 
        (lead.whatsappNumber && lead.whatsappNumber.trim() !== '')
      )
    );

    const upcomingBirthdays: any[] = [];

    // Process clients
    clients.forEach(client => {
      if (client.dateOfBirth) {
        const nextBirthday = this.getNextBirthday(client.dateOfBirth);
        const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= 30) {
          upcomingBirthdays.push({
            id: client.id,
            name: `${client.firstName} ${client.lastName}`,
            email: client.email,
            whatsappNumber: client.whatsappNumber,
            dateOfBirth: client.dateOfBirth,
            nextBirthday,
            daysUntil,
            type: 'client',
            hasEmail: !!(client.email && client.email.trim() !== ''),
            hasWhatsApp: !!(client.whatsappNumber && client.whatsappNumber.trim() !== '')
          });
        }
      }
    });

    // Process leads
    leads.forEach(lead => {
      if (lead.dateOfBirth) {
        const nextBirthday = this.getNextBirthday(lead.dateOfBirth);
        const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= 30) {
          upcomingBirthdays.push({
            id: lead.id,
            name: lead.name,
            email: lead.email,
            whatsappNumber: lead.whatsappNumber,
            dateOfBirth: lead.dateOfBirth,
            nextBirthday,
            daysUntil,
            type: 'lead',
            hasEmail: !!(lead.email && lead.email.trim() !== ''),
            hasWhatsApp: !!(lead.whatsappNumber && lead.whatsappNumber.trim() !== '')
          });
        }
      }
    });

    return upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  /**
   * Get upcoming policy renewals with both email and WhatsApp contacts
   */
  static async getUpcomingRenewals(days: number = 60): Promise<any[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const renewals = await prisma.policyInstance.findMany({
      where: {
        status: 'Active',
        expiryDate: {
          lte: futureDate,
          gte: new Date()
        }
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            whatsappNumber: true
          }
        },
        policyTemplate: {
          select: {
            policyNumber: true,
            policyType: true,
            provider: true
          }
        }
      },
      orderBy: {
        expiryDate: 'asc'
      }
    });

    return renewals.map(renewal => ({
      ...renewal,
      hasEmail: !!(renewal.client.email && renewal.client.email.trim() !== ''),
      hasWhatsApp: !!(renewal.client.whatsappNumber && renewal.client.whatsappNumber.trim() !== '')
    }));
  }

  /**
   * Calculate next birthday for a given date of birth
   */
  private static getNextBirthday(dateOfBirth: Date): Date {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    const nextBirthday = new Date(currentYear, dateOfBirth.getMonth(), dateOfBirth.getDate());
    
    // If birthday already passed this year, get next year's birthday
    if (nextBirthday < today) {
      nextBirthday.setFullYear(currentYear + 1);
    }
    
    return nextBirthday;
  }
}