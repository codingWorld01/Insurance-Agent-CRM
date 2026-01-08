import { prisma } from './database';
import { GmailService } from './gmailService';
import { EmailType, AutomationTrigger } from '@prisma/client';

export class AutomationService {
  /**
   * Check and send birthday wishes for today
   */
  static async processBirthdayWishes(): Promise<{ sent: number; failed: number }> {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const todayDay = today.getDate();

    let sent = 0;
    let failed = 0;

    try {
      // Find clients with birthdays today who have email addresses
      const allClients = await prisma.client.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          dateOfBirth: true
        }
      });

      // Filter clients with valid email and dateOfBirth
      const clientsWithBirthdays = allClients.filter(client => 
        client.dateOfBirth && client.email && client.email.trim() !== ''
      );

      // Filter clients whose birthday is today
      const birthdayClients = clientsWithBirthdays.filter(client => {
        if (!client.dateOfBirth) return false;
        const birthDate = new Date(client.dateOfBirth);
        return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay;
      });

      // Check if we already sent birthday wishes today
      const alreadySentToday = await prisma.emailLog.findMany({
        where: {
          emailType: EmailType.BIRTHDAY_WISH,
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          }
        },
        select: {
          clientId: true
        }
      });

      const alreadySentClientIds = new Set(alreadySentToday.map(log => log.clientId).filter(Boolean));

      // Send birthday wishes to clients who haven't received them today
      for (const client of birthdayClients) {
        if (alreadySentClientIds.has(client.id)) {
          continue; // Skip if already sent today
        }

        if (client.email && client.dateOfBirth) {
          const success = await GmailService.sendBirthdayWish(
            {
              name: `${client.firstName} ${client.lastName}`,
              email: client.email,
              dateOfBirth: client.dateOfBirth
            },
            client.id
          );

          if (success) {
            sent++;
          } else {
            failed++;
          }
        }
      }

      // Also check leads with birthdays
      const allLeads = await prisma.lead.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          dateOfBirth: true
        }
      });

      // Filter leads with valid email and dateOfBirth
      const leadsWithBirthdays = allLeads.filter(lead => 
        lead.dateOfBirth && lead.email && lead.email.trim() !== ''
      );

      const birthdayLeads = leadsWithBirthdays.filter(lead => {
        if (!lead.dateOfBirth) return false;
        const birthDate = new Date(lead.dateOfBirth);
        return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay;
      });

      const alreadySentLeadIds = new Set(
        (await prisma.emailLog.findMany({
          where: {
            emailType: EmailType.BIRTHDAY_WISH,
            createdAt: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            }
          },
          select: {
            leadId: true
          }
        })).map(log => log.leadId).filter(Boolean)
      );

      for (const lead of birthdayLeads) {
        if (alreadySentLeadIds.has(lead.id)) {
          continue;
        }

        if (lead.email && lead.dateOfBirth) {
          const success = await GmailService.sendBirthdayWish(
            {
              name: lead.name,
              email: lead.email,
              dateOfBirth: lead.dateOfBirth
            },
            undefined,
            lead.id
          );

          if (success) {
            sent++;
          } else {
            failed++;
          }
        }
      }

      console.log(`Birthday wishes processed: ${sent} sent, ${failed} failed`);
      return { sent, failed };

    } catch (error) {
      console.error('Error processing birthday wishes:', error);
      return { sent, failed };
    }
  }

  /**
   * Check and send policy renewal reminders
   */
  static async processPolicyRenewals(daysBefore: number = 30): Promise<{ sent: number; failed: number }> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysBefore);

    let sent = 0;
    let failed = 0;

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

      // Check which policies already have renewal reminders sent recently
      const recentReminders = await prisma.emailLog.findMany({
        where: {
          emailType: EmailType.POLICY_RENEWAL,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        select: {
          policyInstanceId: true
        }
      });

      const recentReminderPolicyIds = new Set(
        recentReminders.map(log => log.policyInstanceId).filter(Boolean)
      );

      // Send renewal reminders
      for (const policyInstance of expiringPolicies) {
        // Skip if reminder already sent in last 7 days
        if (recentReminderPolicyIds.has(policyInstance.id)) {
          continue;
        }

        // Skip if client doesn't have email
        if (!policyInstance.client.email) {
          continue;
        }

        const success = await GmailService.sendPolicyRenewalReminder(
          {
            name: `${policyInstance.client.firstName} ${policyInstance.client.lastName}`,
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

        if (success) {
          sent++;
        } else {
          failed++;
        }
      }

      console.log(`Policy renewal reminders processed: ${sent} sent, ${failed} failed`);
      return { sent, failed };

    } catch (error) {
      console.error('Error processing policy renewals:', error);
      return { sent, failed };
    }
  }

  /**
   * Run all automated email tasks
   */
  static async runAutomatedTasks(): Promise<{
    birthdayWishes: { sent: number; failed: number };
    policyRenewals: { sent: number; failed: number };
  }> {
    console.log('Running automated email tasks...');

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
   * Update automation logs
   */
  private static async updateAutomationLogs(): Promise<void> {
    const now = new Date();

    // Update or create birthday automation log
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

    // Update or create policy renewal automation log
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
  }

  /**
   * Get upcoming birthdays (next 30 days)
   */
  static async getUpcomingBirthdays(): Promise<any[]> {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    // Get all clients and leads with birthdays and emails
    const [allClients, allLeads] = await Promise.all([
      prisma.client.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          dateOfBirth: true
        }
      }),
      prisma.lead.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          dateOfBirth: true
        }
      })
    ]);

    // Filter for valid data
    const clients = allClients.filter(client => 
      client.dateOfBirth && client.email && client.email.trim() !== ''
    );
    const leads = allLeads.filter(lead => 
      lead.dateOfBirth && lead.email && lead.email.trim() !== ''
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
            dateOfBirth: client.dateOfBirth,
            nextBirthday,
            daysUntil,
            type: 'client'
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
            dateOfBirth: lead.dateOfBirth,
            nextBirthday,
            daysUntil,
            type: 'lead'
          });
        }
      }
    });

    return upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  /**
   * Get upcoming policy renewals
   */
  static async getUpcomingRenewals(days: number = 60): Promise<any[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await prisma.policyInstance.findMany({
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
            email: true
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