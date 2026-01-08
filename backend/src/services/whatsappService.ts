import { prisma } from './database';
import { MessageType, MessageStatus } from '@prisma/client';

export interface WhatsAppMessageData {
  to: string;
  recipientName: string;
  messageType: MessageType;
  templateName: string;
  components: Record<string, { type: string; value: string }>;
  clientId?: string;
  leadId?: string;
  policyInstanceId?: string;
}

export class WhatsAppService {
  private static readonly MSG91_API_URL = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';
  private static readonly INTEGRATED_NUMBER = '918208691655';
  private static readonly NAMESPACE = '2be3d7b5_0eea_40c4_bea6_4ea50f3dee92';
  private static readonly AUTH_KEY = process.env.MSG91_AUTH_KEY;

  /**
   * Send WhatsApp message using MSG91
   */
  static async sendMessage(messageData: WhatsAppMessageData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.AUTH_KEY) {
        throw new Error('MSG91_AUTH_KEY not configured');
      }

      // Create WhatsApp log entry
      const whatsappLog = await prisma.whatsAppLog.create({
        data: {
          whatsappTemplateId: await this.getOrCreateTemplate(messageData.messageType, messageData.templateName),
          recipientPhone: messageData.to,
          recipientName: messageData.recipientName,
          messageType: messageData.messageType,
          status: MessageStatus.PENDING,
          clientId: messageData.clientId,
          leadId: messageData.leadId,
          policyInstanceId: messageData.policyInstanceId,
        }
      });

      // Prepare MSG91 payload
      const payload = {
        integrated_number: this.INTEGRATED_NUMBER,
        content_type: "template",
        payload: {
          messaging_product: "whatsapp",
          type: "template",
          template: {
            name: messageData.templateName,
            language: {
              code: "en",
              policy: "deterministic"
            },
            namespace: this.NAMESPACE,
            to_and_components: [
              {
                to: [messageData.to],
                components: messageData.components
              }
            ]
          }
        }
      };

      // Send message via MSG91
      const response = await fetch(this.MSG91_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': this.AUTH_KEY
        },
        body: JSON.stringify(payload)
      });

      const result: any = await response.json();

      if (response.ok && (result.status === 'success' || result.type === 'success')) {
        // Update WhatsApp log with success
        await prisma.whatsAppLog.update({
          where: { id: whatsappLog.id },
          data: {
            status: MessageStatus.SENT,
            sentAt: new Date(),
            msg91MessageId: result.request_id || result.data?.message_id || result.messageId
          }
        });

        console.log(`✅ WhatsApp message sent successfully to ${messageData.to}`);
        return { success: true, messageId: result.request_id || result.data?.message_id || result.messageId };

      } else {
        throw new Error(`MSG91 API Error: ${result.message || result.errors || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      
      // Update WhatsApp log with error
      try {
        const whatsappLog = await prisma.whatsAppLog.findFirst({
          where: {
            recipientPhone: messageData.to,
            messageType: messageData.messageType,
            status: MessageStatus.PENDING
          },
          orderBy: { createdAt: 'desc' }
        });

        if (whatsappLog) {
          await prisma.whatsAppLog.update({
            where: { id: whatsappLog.id },
            data: {
              status: MessageStatus.FAILED,
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      } catch (logError) {
        console.error('Error updating WhatsApp log:', logError);
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send birthday wish WhatsApp message
   */
  static async sendBirthdayWish(recipientPhone: string, recipientName: string, clientId?: string, leadId?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      to: recipientPhone,
      recipientName,
      messageType: MessageType.BIRTHDAY_WISH,
      templateName: 'birthday_wish',
      components: {
        body_1: {
          type: 'text',
          value: recipientName
        }
      },
      clientId,
      leadId
    });
  }

  /**
   * Send policy renewal reminder WhatsApp message
   */
  static async sendPolicyRenewalReminder(
    recipientPhone: string, 
    recipientName: string, 
    policyType: string,
    policyNumber: string,
    provider: string,
    expiryDate: string,
    premiumAmount: string,
    clientId?: string,
    policyInstanceId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      to: recipientPhone,
      recipientName,
      messageType: MessageType.POLICY_RENEWAL,
      templateName: 'policy_renewal',
      components: {
        body_1: {
          type: 'text',
          value: recipientName
        },
        body_2: {
          type: 'text',
          value: policyType
        },
        body_3: {
          type: 'text',
          value: policyNumber
        },
        body_4: {
          type: 'text',
          value: provider
        },
        body_5: {
          type: 'text',
          value: expiryDate
        },
        body_6: {
          type: 'text',
          value: premiumAmount
        }
      },
      clientId,
      policyInstanceId
    });
  }

  /**
   * Get or create WhatsApp template
   */
  private static async getOrCreateTemplate(messageType: MessageType, templateName: string): Promise<string> {
    let template = await prisma.whatsAppTemplate.findFirst({
      where: { messageType, templateName }
    });

    if (!template) {
      template = await prisma.whatsAppTemplate.create({
        data: {
          name: `${messageType.toLowerCase()}_template`,
          templateName,
          namespace: this.NAMESPACE,
          messageType,
          isActive: true
        }
      });
    }

    return template.id;
  }

  /**
   * Get WhatsApp logs with pagination
   */
  static async getWhatsAppLogs(days: number = 30, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [logs, total] = await Promise.all([
      prisma.whatsAppLog.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        include: {
          whatsappTemplate: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
              whatsappNumber: true
            }
          },
          lead: {
            select: {
              name: true,
              whatsappNumber: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.whatsAppLog.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get WhatsApp statistics
   */
  static async getWhatsAppStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalSent, totalFailed, birthdayWishes, policyRenewals] = await Promise.all([
      prisma.whatsAppLog.count({
        where: {
          status: MessageStatus.SENT,
          createdAt: { gte: startDate }
        }
      }),
      prisma.whatsAppLog.count({
        where: {
          status: MessageStatus.FAILED,
          createdAt: { gte: startDate }
        }
      }),
      prisma.whatsAppLog.count({
        where: {
          messageType: MessageType.BIRTHDAY_WISH,
          status: MessageStatus.SENT,
          createdAt: { gte: startDate }
        }
      }),
      prisma.whatsAppLog.count({
        where: {
          messageType: MessageType.POLICY_RENEWAL,
          status: MessageStatus.SENT,
          createdAt: { gte: startDate }
        }
      })
    ]);

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