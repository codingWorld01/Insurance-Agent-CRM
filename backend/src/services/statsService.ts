import { prisma } from './database';
import { PolicyTemplateStatsService } from './policyTemplateStatsService';
import { ActivityService } from './activityService';
import { DashboardStats } from '../types';

/**
 * Service for calculating dashboard statistics including policy-related metrics
 */
export class StatsService {
  /**
   * Calculate comprehensive dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Get current totals
      const [
        totalLeads,
        totalClients,
        activePoliciesCount,
        currentMonthCommission,
        currentMonthPoliciesCount,
        prevMonthLeads,
        prevMonthClients,
        prevMonthPoliciesCount,
        prevMonthCommission
      ] = await Promise.all([
        // Current totals
        prisma.lead.count().catch(() => 0),
        prisma.client.count().catch(() => 0),
        
        // Active policies using PolicyInstance model
        prisma.policyInstance.count({
          where: {
            status: 'Active',
            startDate: { lte: now },
            expiryDate: { gt: now }
          }
        }).catch(() => 0),
        
        // Commission from policies created this month
        prisma.policyInstance.aggregate({
          where: {
            createdAt: { gte: currentMonth }
          },
          _sum: { commissionAmount: true }
        }).then(result => result._sum.commissionAmount || 0).catch(() => 0),
        
        // Policies created this month
        prisma.policyInstance.count({
          where: {
            createdAt: { gte: currentMonth }
          }
        }).catch(() => 0),
        
        // Previous month data for comparison
        prisma.lead.count({
          where: {
            createdAt: { lt: currentMonth }
          }
        }).catch(() => 0),
        
        prisma.client.count({
          where: {
            createdAt: { lt: currentMonth }
          }
        }).catch(() => 0),
        
        prisma.policyInstance.count({
          where: {
            createdAt: {
              gte: previousMonth,
              lt: currentMonth
            }
          }
        }).catch(() => 0),
        
        prisma.policyInstance.aggregate({
          where: {
            createdAt: {
              gte: previousMonth,
              lt: currentMonth
            }
          },
          _sum: { commissionAmount: true }
        }).then(result => result._sum.commissionAmount || 0).catch(() => 0)
      ]);

      // Calculate month-over-month changes
      const currentMonthLeads = totalLeads - prevMonthLeads;
      const currentMonthClients = totalClients - prevMonthClients;
      
      const stats: DashboardStats = {
        totalLeads,
        totalClients,
        activePolices: activePoliciesCount,
        commissionThisMonth: currentMonthCommission,
        leadsChange: this.calculatePercentageChange(currentMonthLeads, prevMonthLeads),
        clientsChange: this.calculatePercentageChange(currentMonthClients, prevMonthClients),
        policiesChange: this.calculatePercentageChange(currentMonthPoliciesCount, prevMonthPoliciesCount),
        commissionChange: this.calculatePercentageChange(currentMonthCommission, prevMonthCommission)
      };

      return stats;
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      
      // Return fallback stats
      return {
        totalLeads: 0,
        totalClients: 0,
        activePolices: 0,
        commissionThisMonth: 0,
        leadsChange: 0,
        clientsChange: 0,
        policiesChange: 0,
        commissionChange: 0
      };
    }
  }

  /**
   * Helper method to safely get policy instance aggregate data
   */
  private static async getPolicyInstanceAggregateData(where: any) {
    try {
      return await prisma.policyInstance.aggregate({
        where,
        _count: { id: true },
        _sum: { premiumAmount: true, commissionAmount: true }
      });
    } catch (error) {
      console.warn('PolicyInstance aggregate query failed, using fallback data:', error);
      return {
        _count: { id: 0 },
        _sum: { premiumAmount: 0, commissionAmount: 0 }
      };
    }
  }

  /**
   * Helper method to safely get policy instance count
   */
  private static async getPolicyInstanceCount(where: any): Promise<number> {
    try {
      return await prisma.policyInstance.count({ where });
    } catch (error) {
      console.warn('PolicyInstance count query failed, using fallback count:', error);
      return 0;
    }
  }

  /**
   * Calculate percentage change between current and previous values
   */
  private static calculatePercentageChange(current: number, previous: number): number {
    // If both are 0, no change
    if (current === 0 && previous === 0) return 0;
    
    // If previous is 0 but current is not, it's a 100% increase
    if (previous === 0 && current > 0) return 100;
    
    // If current is 0 but previous is not, it's a 100% decrease
    if (current === 0 && previous > 0) return -100;
    
    // Normal percentage calculation
    const change = ((current - previous) / Math.abs(previous)) * 100;
    
    // Cap the percentage at reasonable limits to avoid extreme values
    return Math.max(-100, Math.min(1000, Math.round(change)));
  }

  /**
   * Get policy statistics for a specific client
   */
  static async getClientPolicyStats(clientId: string) {
    try {
      const now = new Date();
      
      const [policyStats, expiringPolicies, activePolicies] = await Promise.all([
        this.getPolicyInstanceAggregateData({ clientId }),
        this.getExpiringPolicyInstances(clientId, now),
        this.getPolicyInstanceCount({
          clientId,
          status: 'Active',
          startDate: { lte: now },
          expiryDate: { gt: now }
        })
      ]);

      return {
        totalPolicies: policyStats._count.id || 0,
        activePolicies,
        totalPremium: policyStats._sum.premiumAmount || 0,
        totalCommission: policyStats._sum.commissionAmount || 0,
        expiringPolicies
      };
    } catch (error) {
      console.error('Error getting client policy stats:', error);
      return {
        totalPolicies: 0,
        activePolicies: 0,
        totalPremium: 0,
        totalCommission: 0,
        expiringPolicies: []
      };
    }
  }

  /**
   * Helper method to get expiring policy instances
   */
  private static async getExpiringPolicyInstances(clientId: string, now: Date) {
    try {
      return await prisma.policyInstance.findMany({
        where: {
          clientId,
          status: 'Active',
          expiryDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        },
        select: {
          id: true,
          expiryDate: true,
          policyTemplate: {
            select: {
              policyNumber: true,
              policyType: true
            }
          }
        }
      });
    } catch (error) {
      console.warn('PolicyInstance query failed for expiring policies:', error);
      return [];
    }
  }

  /**
   * Get comprehensive policy page statistics
   */
  static async getPolicyPageStats() {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalPolicies,
        activePolicies,
        expiredPolicies,
        expiringPolicies,
        totalPremiumData,
        monthlyCommissionData,
        topProviders,
        policyTypeDistribution
      ] = await Promise.all([
        // Total policy instances count
        this.getPolicyInstanceCount({}),
        
        // Active policy instances count
        this.getPolicyInstanceCount({
          status: 'Active',
          startDate: { lte: now },
          expiryDate: { gt: now }
        }),
        
        // Expired policy instances count
        this.getPolicyInstanceCount({
          OR: [
            { status: 'Expired' },
            { expiryDate: { lte: now } }
          ]
        }),
        
        // Policy instances expiring in next 30 days
        this.getPolicyInstanceCount({
          status: 'Active',
          expiryDate: {
            gt: now,
            lte: thirtyDaysFromNow
          }
        }),
        
        // Total premium and commission amounts
        this.getPolicyInstanceAggregateData({}),
        
        // Commission this month
        this.getPolicyInstanceAggregateData({
          createdAt: { gte: currentMonth }
        }),
        
        // Top providers from policy templates
        this.getTopProvidersFromTemplates(),
        
        // Policy type distribution from policy templates
        this.getPolicyTypeDistributionFromTemplates()
      ]);

      // Calculate average values
      const averagePremium = totalPolicies > 0 
        ? (totalPremiumData._sum.premiumAmount || 0) / totalPolicies 
        : 0;
      
      const averageCommission = totalPolicies > 0 
        ? (totalPremiumData._sum.commissionAmount || 0) / totalPolicies 
        : 0;

      return {
        totalPolicies,
        activePolicies,
        expiredPolicies,
        expiringPolicies,
        totalPremium: totalPremiumData._sum.premiumAmount || 0,
        totalCommission: totalPremiumData._sum.commissionAmount || 0,
        commissionThisMonth: monthlyCommissionData._sum.commissionAmount || 0,
        averagePremium,
        averageCommission,
        topProviders,
        policyTypeDistribution
      };
    } catch (error) {
      console.error('Error getting policy page stats:', error);
      return {
        totalPolicies: 0,
        activePolicies: 0,
        expiredPolicies: 0,
        expiringPolicies: 0,
        totalPremium: 0,
        totalCommission: 0,
        commissionThisMonth: 0,
        averagePremium: 0,
        averageCommission: 0,
        topProviders: [],
        policyTypeDistribution: []
      };
    }
  }

  /**
   * Helper method to get top providers from policy templates
   */
  private static async getTopProvidersFromTemplates() {
    try {
      const providers = await prisma.policyTemplate.groupBy({
        by: ['provider'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      });
      
      // Get instance counts for each provider
      const providersWithInstances = await Promise.all(
        providers.map(async (provider) => {
          const instanceCount = await prisma.policyInstance.count({
            where: {
              policyTemplate: {
                provider: provider.provider
              }
            }
          });
          
          const totalPremium = await prisma.policyInstance.aggregate({
            where: {
              policyTemplate: {
                provider: provider.provider
              }
            },
            _sum: { premiumAmount: true }
          });
          
          return {
            provider: provider.provider,
            count: instanceCount,
            totalPremium: totalPremium._sum.premiumAmount || 0
          };
        })
      );
      
      return providersWithInstances.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.warn('Error getting top providers from templates:', error);
      return [];
    }
  }

  /**
   * Helper method to get policy type distribution from policy templates
   */
  private static async getPolicyTypeDistributionFromTemplates() {
    try {
      const types = await prisma.policyTemplate.groupBy({
        by: ['policyType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      });
      
      // Get instance counts for each policy type
      const typesWithInstances = await Promise.all(
        types.map(async (type) => {
          const instanceCount = await prisma.policyInstance.count({
            where: {
              policyTemplate: {
                policyType: type.policyType
              }
            }
          });
          
          return {
            type: type.policyType,
            count: instanceCount
          };
        })
      );
      
      return typesWithInstances.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.warn('Error getting policy type distribution from templates:', error);
      return [];
    }
  }

  /**
   * Recalculate and cache dashboard statistics
   * This method can be called when policies are added/updated/deleted
   */
  static async refreshDashboardStats(): Promise<DashboardStats> {
    const stats = await this.getDashboardStats();
    
    // Log dashboard refresh activity
    await ActivityService.logDashboardStatsRefresh();
    
    return stats;
  }

  /**
   * Trigger dashboard refresh after policy page operations
   */
  static async refreshAfterPolicyOperation(): Promise<void> {
    // This could trigger real-time updates to dashboard
    // For now, we'll just ensure fresh stats are calculated
    await this.getDashboardStats();
  }

  /**
   * Get enhanced dashboard statistics including policy template metrics
   */
  static async getEnhancedDashboardStats(): Promise<DashboardStats & {
    policyTemplateStats?: any;
    expiryWarnings?: any;
  }> {
    try {
      const [dashboardStats, templateStats, expiryStats] = await Promise.all([
        this.getDashboardStats(),
        PolicyTemplateStatsService.calculatePolicyTemplateStats(),
        PolicyTemplateStatsService.getExpiryTrackingStats()
      ]);

      return {
        ...dashboardStats,
        policyTemplateStats: templateStats,
        expiryWarnings: {
          expiringThisWeek: expiryStats.expiringThisWeek,
          expiringThisMonth: expiryStats.expiringThisMonth,
          expiredLastMonth: expiryStats.expiredLastMonth
        }
      };
    } catch (error) {
      console.error('Error getting enhanced dashboard stats:', error);
      return this.getDashboardStats();
    }
  }

  /**
   * Get policy template system integration statistics
   */
  static async getPolicyTemplateSystemStats() {
    try {
      const [
        templateStats,
        systemMetrics,
        expiryTracking,
        providerPerformance,
        policyTypePerformance
      ] = await Promise.all([
        PolicyTemplateStatsService.calculatePolicyTemplateStats(),
        PolicyTemplateStatsService.getSystemLevelMetrics(),
        PolicyTemplateStatsService.getExpiryTrackingStats(),
        PolicyTemplateStatsService.getProviderPerformanceMetrics(),
        PolicyTemplateStatsService.getPolicyTypePerformanceMetrics()
      ]);

      return {
        overview: templateStats,
        systemMetrics,
        expiryTracking,
        providerPerformance,
        policyTypePerformance
      };
    } catch (error) {
      console.error('Error getting policy template system stats:', error);
      return {
        overview: {
          totalTemplates: 0,
          totalInstances: 0,
          activeInstances: 0,
          totalClients: 0,
          topProviders: [],
          policyTypeDistribution: []
        },
        systemMetrics: {
          totalRevenue: 0,
          totalCommission: 0,
          averageInstanceValue: 0,
          clientRetentionRate: 0,
          policyRenewalRate: 0,
          monthlyGrowthRate: 0,
          topPerformingTemplates: []
        },
        expiryTracking: {
          expiringThisWeek: 0,
          expiringThisMonth: 0,
          expiringNextMonth: 0,
          expiredLastMonth: 0,
          expiringInstances: []
        },
        providerPerformance: [],
        policyTypePerformance: []
      };
    }
  }
}