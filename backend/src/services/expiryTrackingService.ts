import { prisma } from './database';
import { ActivityService } from './activityService';

export interface ExpiryWarning {
  id: string;
  clientId: string;
  clientName: string;
  policyTemplateId: string;
  policyNumber: string;
  policyType: string;
  provider: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  premiumAmount: number;
  commissionAmount: number;
  warningLevel: 'critical' | 'warning' | 'info';
}

export interface ExpiryTrackingConfig {
  criticalDays: number; // Days before expiry to show critical warning (default: 7)
  warningDays: number;  // Days before expiry to show warning (default: 30)
  infoDays: number;     // Days before expiry to show info (default: 60)
}

/**
 * Service for tracking policy expiry dates and generating warnings
 */
export class ExpiryTrackingService {
  private static readonly DEFAULT_CONFIG: ExpiryTrackingConfig = {
    criticalDays: 7,
    warningDays: 30,
    infoDays: 60
  };

  /**
   * Get all expiring policies with warning levels
   */
  static async getExpiringPolicies(
    config: ExpiryTrackingConfig = this.DEFAULT_CONFIG
  ): Promise<ExpiryWarning[]> {
    try {
      const now = new Date();
      const maxDaysAhead = Math.max(config.criticalDays, config.warningDays, config.infoDays);
      const maxDate = new Date(now.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000);

      const expiringInstances = await prisma.policyInstance.findMany({
        where: {
          status: 'Active',
          expiryDate: {
            gte: now,
            lte: maxDate
          }
        },
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          },
          policyTemplate: {
            select: {
              id: true,
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

      const warnings: ExpiryWarning[] = expiringInstances.map(instance => {
        const daysUntilExpiry = Math.ceil(
          (instance.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        let warningLevel: 'critical' | 'warning' | 'info';
        if (daysUntilExpiry <= config.criticalDays) {
          warningLevel = 'critical';
        } else if (daysUntilExpiry <= config.warningDays) {
          warningLevel = 'warning';
        } else {
          warningLevel = 'info';
        }

        return {
          id: instance.id,
          clientId: instance.client.id,
          clientName: instance.client.name,
          policyTemplateId: instance.policyTemplate.id,
          policyNumber: instance.policyTemplate.policyNumber,
          policyType: instance.policyTemplate.policyType,
          provider: instance.policyTemplate.provider,
          expiryDate: instance.expiryDate,
          daysUntilExpiry,
          premiumAmount: instance.premiumAmount,
          commissionAmount: instance.commissionAmount,
          warningLevel
        };
      });

      return warnings;
    } catch (error) {
      console.error('Error getting expiring policies:', error);
      return [];
    }
  }

  /**
   * Get expiring policies grouped by warning level
   */
  static async getExpiringPoliciesByLevel(
    config: ExpiryTrackingConfig = this.DEFAULT_CONFIG
  ) {
    try {
      const warnings = await this.getExpiringPolicies(config);

      const grouped = {
        critical: warnings.filter(w => w.warningLevel === 'critical'),
        warning: warnings.filter(w => w.warningLevel === 'warning'),
        info: warnings.filter(w => w.warningLevel === 'info')
      };

      return {
        ...grouped,
        counts: {
          critical: grouped.critical.length,
          warning: grouped.warning.length,
          info: grouped.info.length,
          total: warnings.length
        }
      };
    } catch (error) {
      console.error('Error getting expiring policies by level:', error);
      return {
        critical: [],
        warning: [],
        info: [],
        counts: {
          critical: 0,
          warning: 0,
          info: 0,
          total: 0
        }
      };
    }
  }

  /**
   * Get expiry summary statistics
   */
  static async getExpirySummary(
    config: ExpiryTrackingConfig = this.DEFAULT_CONFIG
  ) {
    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const [
        expiringThisWeek,
        expiringThisMonth,
        expiringNextThreeMonths,
        totalActiveInstances,
        revenueAtRisk
      ] = await Promise.all([
        // Expiring this week
        prisma.policyInstance.count({
          where: {
            status: 'Active',
            expiryDate: {
              gte: now,
              lte: oneWeekFromNow
            }
          }
        }),

        // Expiring this month
        prisma.policyInstance.count({
          where: {
            status: 'Active',
            expiryDate: {
              gte: now,
              lte: oneMonthFromNow
            }
          }
        }),

        // Expiring in next 3 months
        prisma.policyInstance.count({
          where: {
            status: 'Active',
            expiryDate: {
              gte: now,
              lte: threeMonthsFromNow
            }
          }
        }),

        // Total active instances for percentage calculation
        prisma.policyInstance.count({
          where: {
            status: 'Active'
          }
        }),

        // Revenue at risk (premium + commission for expiring policies)
        prisma.policyInstance.aggregate({
          where: {
            status: 'Active',
            expiryDate: {
              gte: now,
              lte: threeMonthsFromNow
            }
          },
          _sum: {
            premiumAmount: true,
            commissionAmount: true
          }
        })
      ]);

      const expiryRateThisWeek = totalActiveInstances > 0 
        ? (expiringThisWeek / totalActiveInstances) * 100 
        : 0;

      const expiryRateThisMonth = totalActiveInstances > 0 
        ? (expiringThisMonth / totalActiveInstances) * 100 
        : 0;

      return {
        expiringThisWeek,
        expiringThisMonth,
        expiringNextThreeMonths,
        totalActiveInstances,
        expiryRateThisWeek,
        expiryRateThisMonth,
        revenueAtRisk: {
          premium: revenueAtRisk._sum.premiumAmount || 0,
          commission: revenueAtRisk._sum.commissionAmount || 0,
          total: (revenueAtRisk._sum.premiumAmount || 0) + (revenueAtRisk._sum.commissionAmount || 0)
        }
      };
    } catch (error) {
      console.error('Error getting expiry summary:', error);
      return {
        expiringThisWeek: 0,
        expiringThisMonth: 0,
        expiringNextThreeMonths: 0,
        totalActiveInstances: 0,
        expiryRateThisWeek: 0,
        expiryRateThisMonth: 0,
        revenueAtRisk: {
          premium: 0,
          commission: 0,
          total: 0
        }
      };
    }
  }

  /**
   * Get expiring policies for a specific client
   */
  static async getClientExpiringPolicies(
    clientId: string,
    config: ExpiryTrackingConfig = this.DEFAULT_CONFIG
  ): Promise<ExpiryWarning[]> {
    try {
      const now = new Date();
      const maxDaysAhead = Math.max(config.criticalDays, config.warningDays, config.infoDays);
      const maxDate = new Date(now.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000);

      const expiringInstances = await prisma.policyInstance.findMany({
        where: {
          clientId,
          status: 'Active',
          expiryDate: {
            gte: now,
            lte: maxDate
          }
        },
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          },
          policyTemplate: {
            select: {
              id: true,
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

      return expiringInstances.map(instance => {
        const daysUntilExpiry = Math.ceil(
          (instance.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        let warningLevel: 'critical' | 'warning' | 'info';
        if (daysUntilExpiry <= config.criticalDays) {
          warningLevel = 'critical';
        } else if (daysUntilExpiry <= config.warningDays) {
          warningLevel = 'warning';
        } else {
          warningLevel = 'info';
        }

        return {
          id: instance.id,
          clientId: instance.client.id,
          clientName: instance.client.name,
          policyTemplateId: instance.policyTemplate.id,
          policyNumber: instance.policyTemplate.policyNumber,
          policyType: instance.policyTemplate.policyType,
          provider: instance.policyTemplate.provider,
          expiryDate: instance.expiryDate,
          daysUntilExpiry,
          premiumAmount: instance.premiumAmount,
          commissionAmount: instance.commissionAmount,
          warningLevel
        };
      });
    } catch (error) {
      console.error('Error getting client expiring policies:', error);
      return [];
    }
  }

  /**
   * Get expiring policies for a specific policy template
   */
  static async getTemplateExpiringPolicies(
    templateId: string,
    config: ExpiryTrackingConfig = this.DEFAULT_CONFIG
  ): Promise<ExpiryWarning[]> {
    try {
      const now = new Date();
      const maxDaysAhead = Math.max(config.criticalDays, config.warningDays, config.infoDays);
      const maxDate = new Date(now.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000);

      const expiringInstances = await prisma.policyInstance.findMany({
        where: {
          policyTemplateId: templateId,
          status: 'Active',
          expiryDate: {
            gte: now,
            lte: maxDate
          }
        },
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          },
          policyTemplate: {
            select: {
              id: true,
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

      return expiringInstances.map(instance => {
        const daysUntilExpiry = Math.ceil(
          (instance.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 1000)
        );

        let warningLevel: 'critical' | 'warning' | 'info';
        if (daysUntilExpiry <= config.criticalDays) {
          warningLevel = 'critical';
        } else if (daysUntilExpiry <= config.warningDays) {
          warningLevel = 'warning';
        } else {
          warningLevel = 'info';
        }

        return {
          id: instance.id,
          clientId: instance.client.id,
          clientName: instance.client.name,
          policyTemplateId: instance.policyTemplate.id,
          policyNumber: instance.policyTemplate.policyNumber,
          policyType: instance.policyTemplate.policyType,
          provider: instance.policyTemplate.provider,
          expiryDate: instance.expiryDate,
          daysUntilExpiry,
          premiumAmount: instance.premiumAmount,
          commissionAmount: instance.commissionAmount,
          warningLevel
        };
      });
    } catch (error) {
      console.error('Error getting template expiring policies:', error);
      return [];
    }
  }

  /**
   * Automatically update expired policy statuses
   */
  static async updateExpiredPolicyStatuses(): Promise<{
    updatedCount: number;
    updatedPolicies: Array<{ id: string; policyNumber: string; clientName: string }>;
  }> {
    try {
      const now = new Date();

      // Find all active policies that have expired
      const expiredInstances = await prisma.policyInstance.findMany({
        where: {
          status: 'Active',
          expiryDate: {
            lt: now
          }
        },
        include: {
          client: {
            select: {
              name: true
            }
          },
          policyTemplate: {
            select: {
              policyNumber: true
            }
          }
        }
      });

      if (expiredInstances.length === 0) {
        return {
          updatedCount: 0,
          updatedPolicies: []
        };
      }

      // Update all expired policies to 'Expired' status
      await prisma.policyInstance.updateMany({
        where: {
          id: {
            in: expiredInstances.map(instance => instance.id)
          }
        },
        data: {
          status: 'Expired'
        }
      });

      // Log activities for each expired policy
      const updatedPolicies = expiredInstances.map(instance => ({
        id: instance.id,
        policyNumber: instance.policyTemplate.policyNumber,
        clientName: instance.client.name
      }));

      // Log bulk expiry update
      await ActivityService.logActivity(
        'bulk_policy_expiry_update',
        `Automatically updated ${expiredInstances.length} expired policies`
      );

      return {
        updatedCount: expiredInstances.length,
        updatedPolicies
      };
    } catch (error) {
      console.error('Error updating expired policy statuses:', error);
      return {
        updatedCount: 0,
        updatedPolicies: []
      };
    }
  }

  /**
   * Generate expiry warnings and log them
   */
  static async generateExpiryWarnings(
    config: ExpiryTrackingConfig = this.DEFAULT_CONFIG
  ): Promise<void> {
    try {
      const warnings = await this.getExpiringPoliciesByLevel(config);

      // Log warnings if there are any
      if (warnings.counts.critical > 0) {
        await ActivityService.logExpiryWarningGenerated(
          warnings.counts.critical,
          'this week (critical)'
        );
      }

      if (warnings.counts.warning > 0) {
        await ActivityService.logExpiryWarningGenerated(
          warnings.counts.warning,
          'this month (warning)'
        );
      }

      if (warnings.counts.info > 0) {
        await ActivityService.logExpiryWarningGenerated(
          warnings.counts.info,
          'in next 60 days (info)'
        );
      }
    } catch (error) {
      console.error('Error generating expiry warnings:', error);
    }
  }
}