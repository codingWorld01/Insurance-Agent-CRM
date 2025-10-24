import { Request, Response } from 'express';
import { prisma } from '../services/database';
import { StatsService } from '../services/statsService';
import { PolicyTemplateStatsService } from '../services/policyTemplateStatsService';
import { ActivityService } from '../services/activityService';
import { DashboardStats, ChartData, ActivityLog, ApiResponse } from '../types';

/**
 * Get dashboard statistics including totals and percentage changes
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await StatsService.getEnhancedDashboardStats();

    const response: ApiResponse<DashboardStats & {
      policyTemplateStats?: any;
      expiryWarnings?: any;
    }> = {
      success: true,
      data: stats,
      statusCode: 200
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      statusCode: 500
    });
  }
};

/**
 * Get leads by status for chart visualization
 */
export const getLeadsChartData = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const chartData: ChartData[] = leadsByStatus.map(item => ({
      status: item.status,
      count: item._count.status
    }));

    // Ensure all statuses are represented (even with 0 count)
    const allStatuses = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
    const completeChartData: ChartData[] = allStatuses.map(status => {
      const existing = chartData.find(item => item.status === status);
      return existing || { status, count: 0 };
    });

    const response: ApiResponse<ChartData[]> = {
      success: true,
      data: completeChartData,
      statusCode: 200
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching leads chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads chart data',
      statusCode: 500
    });
  }
};

/**
 * Get recent activities for dashboard
 */
export const getRecentActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    const response: ApiResponse<ActivityLog[]> = {
      success: true,
      data: activities,
      statusCode: 200
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      statusCode: 500
    });
  }
};

/**
 * Get comprehensive policy template system statistics for dashboard insights
 */
export const getPolicyTemplateSystemStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const systemStats = await StatsService.getPolicyTemplateSystemStats();

    // Log access to policy template system stats
    await ActivityService.logPolicyTemplateSystemStatsAccessed();

    const response: ApiResponse<any> = {
      success: true,
      data: systemStats,
      statusCode: 200
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching policy template system stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy template system statistics',
      statusCode: 500
    });
  }
};