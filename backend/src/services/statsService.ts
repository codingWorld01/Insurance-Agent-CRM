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
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get current totals with error handling
      const [
        totalLeads,
        totalClients,
        activePoliciesData,
        currentMonthCommissionData,
        currentMonthPoliciesData
      ] = await Promise.all([
        // Total leads count
        prisma.lead.count().catch(() => 0),
        
        // Total clients count
        prisma.client.count().catch(() => 0),
        
        // Active policies count and total premium - with fallback
        this.getPolicyAggregateData({
          status: 'Active',
          startDate: { lte: now },
          expiryDate: { gt: now }
        }),
        
        // Commission from policies created/renewed this month - with fallback
        this.getPolicyAggregateData({
          OR: [
            { createdAt: { gte: currentMonth } },
            { 
              updatedAt: { gte: currentMonth },
              createdAt: { lt: currentMonth }
            }
          ]
        }),
        
        // Policies created this month for percentage calculation - with fallback
        this.getPolicyCount({
          createdAt: { gte: currentMonth }
        })
      ]);

      // Get previous month data for percentage calculations
      const [
        prevMonthLeads,
        prevMonthClients,
        prevMonthActivePolicies,
        prevMonthCommissionData,
        prevMonthPoliciesCount
      ] = await Promise.all([
        // Leads count at end of previous month
        prisma.lead.count({
          where: {
            createdAt: { lt: currentMonth }
          }
        }).catch(() => 0),
        
        // Clients count at end of previous month
        prisma.client.count({
          where: {
            createdAt: { lt: currentMonth }
          }
        }).catch(() => 0),
        
        // Active policies count at end of previous month
        this.getPolicyCount({
          status: 'Active',
          createdAt: { lt: currentMonth },
          startDate: { lte: previousMonthEnd },
          expiryDate: { gt: previousMonthEnd }
        }),
        
        // Commission from previous month
        this.getPolicyAggregateData({
          OR: [
            {
              createdAt: {
                gte: previousMonth,
                lt: currentMonth
              }
            },
            {
              updatedAt: {
                gte: previousMonth,
                lt: currentMonth
              },
              createdAt: { lt: previousMonth }
            }
          ]
        }),
        
        // Policies created in previous month
        this.getPolicyCount({
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          }
        })
      ]);

      // Calculate current values
      const activePolicies = activePoliciesData._count.id || 0;
      const commissionThisMonth = currentMonthCommissionData._sum.commissionAmount || 0;
      
      // Calculate changes from previous month
      const currentMonthLeads = totalLeads - prevMonthLeads;
      const currentMonthClients = totalClients - prevMonthClients;
      
      const stats: DashboardStats = {
        totalLeads,
        totalClients,
        activePolices: activePolicies,
        commissionThisMonth,
        leadsChange: this.calculatePercentageChange(currentMonthLeads, prevMonthLeads),
        clientsChange: this.calculatePercentageChange(currentMonthClients, prevMonthClients),
        policiesChange: this.calculatePercentageChange(currentMonthPoliciesData, prevMonthPoliciesCount),
        commissionChange: this.calculatePercentageChange(
          commissionThisMonth,
          prevMonthCommissionData._sum.commissionAmount || 0
        )
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
   * Helper method to safely get policy aggregate data
   */
  private static async getPolicyAggregateData(where: any) {
    try {
      // Check if Policy model exists in Prisma client
      if (prisma.policy) {
        return await prisma.policy.aggregate({
          where,
          _count: { id: true },
          _sum: { premiumAmount: true, commissionAmount: true }
        });
      }
    } catch (error) {
      console.warn('Policy model not available, using fallback data:', error);
    }
    
    // Fallback data
    return {
      _count: { id: 0 },
      _sum: { premiumAmount: 0, commissionAmount: 0 }
    };
  }

  /**
   * Helper method to safely get policy count
   */
  private static async getPolicyCount(where: any): Promise<number> {
    try {
      if (prisma.policy) {
        return await prisma.policy.count({ where });
      }
    } catch (error) {
      console.warn('Policy model not available, using fallback count:', error);
    }
    
    return 0;
  }

  /**
   * Calculate percentage change between current and previous values
   */
  private static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Get policy statistics for a specific client
   */
  static async getClientPolicyStats(clientId: string) {
    try {
      const now = new Date();
      
      const [policyStats, expiringPolicies, activePolicies] = await Promise.all([
        this.getPolicyAggregateData({ clientId }),
        this.getExpiringPolicies(clientId, now),
        this.getPolicyCount({
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
   * Helper method to get expiring policies
   */
  private static async getExpiringPolicies(clientId: string, now: Date) {
    try {
      if (prisma.policy) {
        return await prisma.policy.findMany({
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
            policyNumber: true,
            policyType: true,
            expiryDate: true
          }
        });
      }
    } catch (error) {
      console.warn('Policy model not available for expiring policies:', error);
    }
    
    return [];
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
        totalCommissionData,
        monthlyCommissionData,
        topProviders,
        policyTypeDistribution
      ] = await Promise.all([
        // Total policies count
        this.getPolicyCount({}),
        
        // Active policies count
        this.getPolicyCount({
          status: 'Active',
          startDate: { lte: now },
          expiryDate: { gt: now }
        }),
        
        // Expired policies count
        this.getPolicyCount({
          OR: [
            { status: 'Expired' },
            { expiryDate: { lte: now } }
          ]
        }),
        
        // Policies expiring in next 30 days
        this.getPolicyCount({
          status: 'Active',
          expiryDate: {
            gt: now,
            lte: thirtyDaysFromNow
          }
        }),
        
        // Total premium amount
        this.getPolicyAggregateData({}),
        
        // Total commission amount
        this.getPolicyAggregateData({}),
        
        // Commission this month
        this.getPolicyAggregateData({
          OR: [
            { createdAt: { gte: currentMonth } },
            { 
              updatedAt: { gte: currentMonth },
              createdAt: { lt: currentMonth }
            }
          ]
        }),
        
        // Top providers - fallback to empty array
        this.getTopProviders(),
        
        // Policy type distribution - fallback to empty array
        this.getPolicyTypeDistribution()
      ]);

      // Calculate average values
      const averagePremium = totalPolicies > 0 
        ? (totalPremiumData._sum.premiumAmount || 0) / totalPolicies 
        : 0;
      
      const averageCommission = totalPolicies > 0 
        ? (totalCommissionData._sum.commissionAmount || 0) / totalPolicies 
        : 0;

      return {
        totalPolicies,
        activePolicies,
        expiredPolicies,
        expiringPolicies,
        totalPremium: totalPremiumData._sum.premiumAmount || 0,
        totalCommission: totalCommissionData._sum.commissionAmount || 0,
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
   * Helper method to get top providers
   */
  private static async getTopProviders() {
    try {
      if (prisma.policy) {
        const providers = await prisma.policy.groupBy({
          by: ['provider'],
          _count: { id: true },
          _sum: { premiumAmount: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5
        });
        
        return providers.map(provider => ({
          provider: provider.provider,
          count: provider._count.id,
          totalPremium: provider._sum.premiumAmount || 0
        }));
      }
    } catch (error) {
      console.warn('Policy model not available for top providers:', error);
    }
    
    return [];
  }

  /**
   * Helper method to get policy type distribution
   */
  private static async getPolicyTypeDistribution() {
    try {
      if (prisma.policy) {
        const types = await prisma.policy.groupBy({
          by: ['policyType'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } }
        });
        
        return types.map(type => ({
          type: type.policyType,
          count: type._count.id
        }));
      }
    } catch (error) {
      console.warn('Policy model not available for policy type distribution:', error);
    }
    
    return [];
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