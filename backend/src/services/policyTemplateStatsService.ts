import { prisma } from './database';
import { cacheService } from './cacheService';
import { Prisma } from '@prisma/client';

export interface PolicyTemplateStats {
  totalTemplates: number;
  totalInstances: number;
  activeInstances: number;
  totalClients: number;
  topProviders: Array<{
    provider: string;
    templateCount: number;
    instanceCount: number;
  }>;
  policyTypeDistribution: Array<{
    type: string;
    templateCount: number;
    instanceCount: number;
  }>;
}

export interface PolicyDetailStats {
  totalClients: number;
  activeInstances: number;
  expiredInstances: number;
  totalPremium: number;
  totalCommission: number;
  averagePremium: number;
  expiringThisMonth: number;
}

export interface ExpiryTrackingStats {
  expiringThisWeek: number;
  expiringThisMonth: number;
  expiringNextMonth: number;
  expiredLastMonth: number;
  expiringInstances: Array<{
    id: string;
    clientName: string;
    policyNumber: string;
    expiryDate: Date;
    daysUntilExpiry: number;
  }>;
}

export interface SystemLevelMetrics {
  totalRevenue: number;
  totalCommission: number;
  averageInstanceValue: number;
  clientRetentionRate: number;
  policyRenewalRate: number;
  monthlyGrowthRate: number;
  topPerformingTemplates: Array<{
    id: string;
    policyNumber: string;
    instanceCount: number;
    totalRevenue: number;
    averageValue: number;
  }>;
}

export interface ProviderPerformanceMetrics {
  provider: string;
  templateCount: number;
  instanceCount: number;
  totalRevenue: number;
  averageInstanceValue: number;
  activeInstancesRatio: number;
  expiryRate: number;
}

export interface PolicyTypePerformanceMetrics {
  policyType: string;
  templateCount: number;
  instanceCount: number;
  totalRevenue: number;
  averageInstanceValue: number;
  popularityRank: number;
  growthRate: number;
}

/**
 * Service for calculating comprehensive policy template and instance statistics
 */
export class PolicyTemplateStatsService {
  /**
   * Calculate policy template statistics with optional filtering
   */
  static async calculatePolicyTemplateStats(
    where: Prisma.PolicyTemplateWhereInput = {}
  ): Promise<PolicyTemplateStats> {
    // Try to get from cache if no specific where clause
    const isDefaultQuery = Object.keys(where).length === 0;
    if (isDefaultQuery) {
      const cachedStats = cacheService.getPolicyTemplateStats();
      if (cachedStats) {
        return cachedStats;
      }
    }
    try {
      const [
        totalTemplates,
        totalInstances,
        activeInstances,
        totalClients,
        topProviders,
        policyTypeDistribution
      ] = await Promise.all([
        // Total templates count
        prisma.policyTemplate.count({ where }),
        
        // Total instances count
        Object.keys(where).length === 0 
          ? prisma.policyInstance.count()
          : prisma.policyInstance.count({
              where: {
                policyTemplate: where
              }
            }),
        
        // Active instances count (not expired based on expiry date)
        Object.keys(where).length === 0
          ? prisma.policyInstance.count({
              where: { 
                expiryDate: { gte: new Date() }
              }
            })
          : prisma.policyInstance.count({
              where: {
                expiryDate: { gte: new Date() },
                policyTemplate: where
              }
            }),
        
        // Total unique clients
        Object.keys(where).length === 0
          ? prisma.policyInstance.findMany({
              select: { clientId: true },
              distinct: ['clientId']
            }).then(clients => clients.length)
          : prisma.policyInstance.findMany({
              where: {
                policyTemplate: where
              },
              select: { clientId: true },
              distinct: ['clientId']
            }).then(clients => clients.length),
        
        // Top providers with template and instance counts
        this.getTopProvidersWithCounts(where),
        
        // Policy type distribution with template and instance counts
        this.getPolicyTypeDistributionWithCounts(where)
      ]);

      const stats = {
        totalTemplates,
        totalInstances,
        activeInstances,
        totalClients,
        topProviders,
        policyTypeDistribution
      };



      // Cache the result if it's the default query
      if (isDefaultQuery) {
        cacheService.setPolicyTemplateStats(stats);
      }

      return stats;
    } catch (error) {
      console.error('Error calculating policy template stats:', error);
      return {
        totalTemplates: 0,
        totalInstances: 0,
        activeInstances: 0,
        totalClients: 0,
        topProviders: [],
        policyTypeDistribution: []
      };
    }
  }

  /**
   * Calculate policy detail statistics for a specific template
   */
  static async calculatePolicyDetailStats(templateId: string): Promise<PolicyDetailStats> {
    // Try to get from cache first
    const cachedStats = cacheService.getPolicyDetailStats(templateId);
    if (cachedStats) {
      return cachedStats;
    }
    try {
      const [
        totalClients,
        activeInstances,
        expiredInstances,
        aggregations,
        expiringThisMonth
      ] = await Promise.all([
        // Total clients count
        prisma.policyInstance.count({
          where: { policyTemplateId: templateId }
        }),
        
        // Active instances count (not expired based on expiry date)
        prisma.policyInstance.count({
          where: { 
            policyTemplateId: templateId,
            expiryDate: {
              gte: new Date()
            }
          }
        }),
        
        // Expired instances count (based on expiry date, not status)
        prisma.policyInstance.count({
          where: { 
            policyTemplateId: templateId,
            expiryDate: {
              lt: new Date()
            }
          }
        }),
        
        // Sum of premiums and commissions
        prisma.policyInstance.aggregate({
          where: { policyTemplateId: templateId },
          _sum: {
            premiumAmount: true,
            commissionAmount: true
          },
          _avg: {
            premiumAmount: true
          }
        }),
        
        // Instances expiring this month
        this.getExpiringInstancesCount(templateId, 'thisMonth')
      ]);

      const stats = {
        totalClients,
        activeInstances,
        expiredInstances,
        totalPremium: aggregations._sum.premiumAmount || 0,
        totalCommission: aggregations._sum.commissionAmount || 0,
        averagePremium: aggregations._avg.premiumAmount || 0,
        expiringThisMonth
      };

      // Cache the result
      cacheService.setPolicyDetailStats(templateId, stats);

      return stats;
    } catch (error) {
      console.error('Error calculating policy detail stats:', error);
      return {
        totalClients: 0,
        activeInstances: 0,
        expiredInstances: 0,
        totalPremium: 0,
        totalCommission: 0,
        averagePremium: 0,
        expiringThisMonth: 0
      };
    }
  }

  /**
   * Get comprehensive expiry tracking statistics
   */
  static async getExpiryTrackingStats(): Promise<ExpiryTrackingStats> {
    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const twoMonthsFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        expiringThisWeek,
        expiringThisMonth,
        expiringNextMonth,
        expiredLastMonth,
        expiringInstances
      ] = await Promise.all([
        // Expiring this week (not yet expired)
        prisma.policyInstance.count({
          where: {
            expiryDate: {
              gte: now,
              lte: oneWeekFromNow
            }
          }
        }),
        
        // Expiring this month (not yet expired)
        prisma.policyInstance.count({
          where: {
            expiryDate: {
              gte: now,
              lte: oneMonthFromNow
            }
          }
        }),
        
        // Expiring next month (not yet expired)
        prisma.policyInstance.count({
          where: {
            expiryDate: {
              gte: oneMonthFromNow,
              lte: twoMonthsFromNow
            }
          }
        }),
        
        // Expired last month (based on expiry date)
        prisma.policyInstance.count({
          where: {
            expiryDate: {
              gte: oneMonthAgo,
              lte: now
            }
          }
        }),
        
        // Get detailed expiring instances
        this.getExpiringInstancesDetails()
      ]);

      return {
        expiringThisWeek,
        expiringThisMonth,
        expiringNextMonth,
        expiredLastMonth,
        expiringInstances
      };
    } catch (error) {
      console.error('Error getting expiry tracking stats:', error);
      return {
        expiringThisWeek: 0,
        expiringThisMonth: 0,
        expiringNextMonth: 0,
        expiredLastMonth: 0,
        expiringInstances: []
      };
    }
  }

  /**
   * Get system-level metrics for comprehensive analysis
   */
  static async getSystemLevelMetrics(): Promise<SystemLevelMetrics> {
    try {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [
        revenueData,
        instanceCount,
        clientRetention,
        renewalRate,
        currentMonthInstances,
        previousMonthInstances,
        topTemplates
      ] = await Promise.all([
        // Total revenue and commission
        prisma.policyInstance.aggregate({
          _sum: {
            premiumAmount: true,
            commissionAmount: true
          }
        }),
        
        // Total instance count for average calculation
        prisma.policyInstance.count(),
        
        // Client retention calculation
        this.calculateClientRetentionRate(),
        
        // Policy renewal rate calculation
        this.calculatePolicyRenewalRate(),
        
        // Current month instances for growth calculation
        prisma.policyInstance.count({
          where: {
            createdAt: { gte: currentMonth }
          }
        }),
        
        // Previous month instances for growth calculation
        prisma.policyInstance.count({
          where: {
            createdAt: {
              gte: previousMonth,
              lt: currentMonth
            }
          }
        }),
        
        // Top performing templates
        this.getTopPerformingTemplates()
      ]);

      const totalRevenue = revenueData._sum.premiumAmount || 0;
      const totalCommission = revenueData._sum.commissionAmount || 0;
      const averageInstanceValue = instanceCount > 0 ? totalRevenue / instanceCount : 0;
      
      // Calculate monthly growth rate
      const monthlyGrowthRate = previousMonthInstances > 0 
        ? ((currentMonthInstances - previousMonthInstances) / previousMonthInstances) * 100 
        : 0;

      return {
        totalRevenue,
        totalCommission,
        averageInstanceValue,
        clientRetentionRate: clientRetention,
        policyRenewalRate: renewalRate,
        monthlyGrowthRate,
        topPerformingTemplates: topTemplates
      };
    } catch (error) {
      console.error('Error getting system level metrics:', error);
      return {
        totalRevenue: 0,
        totalCommission: 0,
        averageInstanceValue: 0,
        clientRetentionRate: 0,
        policyRenewalRate: 0,
        monthlyGrowthRate: 0,
        topPerformingTemplates: []
      };
    }
  }

  /**
   * Get provider performance metrics
   */
  static async getProviderPerformanceMetrics(): Promise<ProviderPerformanceMetrics[]> {
    try {
      const providers = await prisma.policyTemplate.groupBy({
        by: ['provider'],
        _count: { provider: true },
        orderBy: {
          _count: { provider: 'desc' }
        }
      });

      const providerMetrics = await Promise.all(
        providers.map(async (provider) => {
          const [instanceData, activeInstances, expiredInstances] = await Promise.all([
            // Instance count and revenue for this provider
            prisma.policyInstance.aggregate({
              where: {
                policyTemplate: {
                  provider: provider.provider
                }
              },
              _count: { id: true },
              _sum: { premiumAmount: true }
            }),
            
            // Active instances count
            prisma.policyInstance.count({
              where: {
                status: 'Active',
                policyTemplate: {
                  provider: provider.provider
                }
              }
            }),
            
            // Expired instances count
            prisma.policyInstance.count({
              where: {
                status: 'Expired',
                policyTemplate: {
                  provider: provider.provider
                }
              }
            })
          ]);

          const instanceCount = instanceData._count.id || 0;
          const totalRevenue = instanceData._sum.premiumAmount || 0;
          const averageInstanceValue = instanceCount > 0 ? totalRevenue / instanceCount : 0;
          const activeInstancesRatio = instanceCount > 0 ? (activeInstances / instanceCount) * 100 : 0;
          const expiryRate = instanceCount > 0 ? (expiredInstances / instanceCount) * 100 : 0;

          return {
            provider: provider.provider,
            templateCount: provider._count.provider,
            instanceCount,
            totalRevenue,
            averageInstanceValue,
            activeInstancesRatio,
            expiryRate
          };
        })
      );

      return providerMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } catch (error) {
      console.error('Error getting provider performance metrics:', error);
      return [];
    }
  }

  /**
   * Get policy type performance metrics
   */
  static async getPolicyTypePerformanceMetrics(): Promise<PolicyTypePerformanceMetrics[]> {
    try {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const policyTypes = await prisma.policyTemplate.groupBy({
        by: ['policyType'],
        _count: { policyType: true },
        orderBy: {
          _count: { policyType: 'desc' }
        }
      });

      const typeMetrics = await Promise.all(
        policyTypes.map(async (type, index) => {
          const [instanceData, recentInstances] = await Promise.all([
            // Instance count and revenue for this policy type
            prisma.policyInstance.aggregate({
              where: {
                policyTemplate: {
                  policyType: type.policyType
                }
              },
              _count: { id: true },
              _sum: { premiumAmount: true }
            }),
            
            // Recent instances for growth calculation
            prisma.policyInstance.count({
              where: {
                createdAt: { gte: threeMonthsAgo },
                policyTemplate: {
                  policyType: type.policyType
                }
              }
            })
          ]);

          const instanceCount = instanceData._count.id || 0;
          const totalRevenue = instanceData._sum.premiumAmount || 0;
          const averageInstanceValue = instanceCount > 0 ? totalRevenue / instanceCount : 0;
          
          // Simple growth rate calculation based on recent activity
          const growthRate = instanceCount > 0 ? (recentInstances / instanceCount) * 100 : 0;

          return {
            policyType: type.policyType,
            templateCount: type._count.policyType,
            instanceCount,
            totalRevenue,
            averageInstanceValue,
            popularityRank: index + 1,
            growthRate
          };
        })
      );

      return typeMetrics;
    } catch (error) {
      console.error('Error getting policy type performance metrics:', error);
      return [];
    }
  }

  /**
   * Helper method to get top providers with template and instance counts
   */
  private static async getTopProvidersWithCounts(
    where: Prisma.PolicyTemplateWhereInput
  ) {
    try {
      const providers = await prisma.policyTemplate.groupBy({
        by: ['provider'],
        where,
        _count: { provider: true },
        orderBy: {
          _count: { provider: 'desc' }
        },
        take: 5
      });

      const providersWithInstances = await Promise.all(
        providers.map(async (provider) => {
          const instanceCount = Object.keys(where).length === 0
            ? await prisma.policyInstance.count({
                where: {
                  policyTemplate: {
                    provider: provider.provider
                  }
                }
              })
            : await prisma.policyInstance.count({
                where: {
                  policyTemplate: {
                    provider: provider.provider,
                    ...where
                  }
                }
              });
          
          return {
            provider: provider.provider,
            templateCount: provider._count.provider,
            instanceCount
          };
        })
      );

      return providersWithInstances;
    } catch (error) {
      console.error('Error getting top providers with counts:', error);
      return [];
    }
  }

  /**
   * Helper method to get policy type distribution with template and instance counts
   */
  private static async getPolicyTypeDistributionWithCounts(
    where: Prisma.PolicyTemplateWhereInput
  ) {
    try {
      const policyTypes = await prisma.policyTemplate.groupBy({
        by: ['policyType'],
        where,
        _count: { policyType: true },
        orderBy: {
          _count: { policyType: 'desc' }
        }
      });

      const typesWithInstances = await Promise.all(
        policyTypes.map(async (type) => {
          const instanceCount = Object.keys(where).length === 0
            ? await prisma.policyInstance.count({
                where: {
                  policyTemplate: {
                    policyType: type.policyType
                  }
                }
              })
            : await prisma.policyInstance.count({
                where: {
                  policyTemplate: {
                    policyType: type.policyType,
                    ...where
                  }
                }
              });
          
          return {
            type: type.policyType,
            templateCount: type._count.policyType,
            instanceCount
          };
        })
      );

      return typesWithInstances;
    } catch (error) {
      console.error('Error getting policy type distribution with counts:', error);
      return [];
    }
  }

  /**
   * Helper method to get expiring instances count for different periods
   */
  private static async getExpiringInstancesCount(
    templateId: string, 
    period: 'thisWeek' | 'thisMonth' | 'nextMonth'
  ): Promise<number> {
    try {
      const now = new Date();
      let startDate = now;
      let endDate: Date;

      switch (period) {
        case 'thisWeek':
          endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'thisMonth':
          endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case 'nextMonth':
          startDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          endDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
          break;
      }

      return await prisma.policyInstance.count({
        where: {
          policyTemplateId: templateId,
          expiryDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });
    } catch (error) {
      console.error('Error getting expiring instances count:', error);
      return 0;
    }
  }

  /**
   * Helper method to get detailed expiring instances
   */
  private static async getExpiringInstancesDetails() {
    try {
      const now = new Date();
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const instances = await prisma.policyInstance.findMany({
        where: {
          status: 'Active',
          expiryDate: {
            gte: now,
            lte: oneMonthFromNow
          }
        },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          policyTemplate: {
            select: {
              policyNumber: true
            }
          }
        },
        orderBy: {
          expiryDate: 'asc'
        },
        take: 20 // Limit to top 20 expiring instances
      });

      return instances.map(instance => {
        const daysUntilExpiry = Math.ceil(
          (instance.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: instance.id,
          clientName: `${instance.client.firstName} ${instance.client.lastName}`,
          policyNumber: instance.policyTemplate.policyNumber,
          expiryDate: instance.expiryDate,
          daysUntilExpiry
        };
      });
    } catch (error) {
      console.error('Error getting expiring instances details:', error);
      return [];
    }
  }

  /**
   * Helper method to calculate client retention rate
   */
  private static async calculateClientRetentionRate(): Promise<number> {
    try {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const [totalClients, retainedClients] = await Promise.all([
        // Total clients who had policies a year ago
        prisma.policyInstance.findMany({
          where: {
            createdAt: { lte: oneYearAgo }
          },
          select: { clientId: true },
          distinct: ['clientId']
        }).then(clients => clients.length),
        
        // Clients who still have active policies
        prisma.policyInstance.findMany({
          where: {
            createdAt: { lte: oneYearAgo },
            status: 'Active'
          },
          select: { clientId: true },
          distinct: ['clientId']
        }).then(clients => clients.length)
      ]);

      return totalClients > 0 ? (retainedClients / totalClients) * 100 : 0;
    } catch (error) {
      console.error('Error calculating client retention rate:', error);
      return 0;
    }
  }

  /**
   * Helper method to calculate policy renewal rate
   */
  private static async calculatePolicyRenewalRate(): Promise<number> {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      const [expiredPolicies, renewedPolicies] = await Promise.all([
        // Policies that expired in the last 6 months
        prisma.policyInstance.count({
          where: {
            expiryDate: {
              gte: sixMonthsAgo,
              lte: now
            }
          }
        }),
        
        // Estimate renewals by checking for new instances of same template-client pairs
        // This is a simplified calculation - in practice, you might track renewals explicitly
        prisma.policyInstance.count({
          where: {
            createdAt: { gte: sixMonthsAgo },
            // Additional logic would be needed to identify actual renewals
          }
        })
      ]);

      // This is a simplified renewal rate calculation
      // In practice, you'd want to track renewals more explicitly
      return expiredPolicies > 0 ? Math.min((renewedPolicies / expiredPolicies) * 100, 100) : 0;
    } catch (error) {
      console.error('Error calculating policy renewal rate:', error);
      return 0;
    }
  }

  /**
   * Helper method to get top performing templates
   */
  private static async getTopPerformingTemplates() {
    try {
      const templates = await prisma.policyTemplate.findMany({
        include: {
          _count: {
            select: {
              instances: true
            }
          },
          instances: {
            select: {
              premiumAmount: true
            }
          }
        },
        orderBy: {
          instances: {
            _count: 'desc'
          }
        },
        take: 10
      });

      return templates.map(template => {
        const instanceCount = template._count.instances;
        const totalRevenue = template.instances.reduce(
          (sum, instance) => sum + instance.premiumAmount, 
          0
        );
        const averageValue = instanceCount > 0 ? totalRevenue / instanceCount : 0;

        return {
          id: template.id,
          policyNumber: template.policyNumber,
          instanceCount,
          totalRevenue,
          averageValue
        };
      });
    } catch (error) {
      console.error('Error getting top performing templates:', error);
      return [];
    }
  }
}