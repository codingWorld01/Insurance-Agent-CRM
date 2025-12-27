import { PolicyTemplateStatsService } from '../services/policyTemplateStatsService';
import { ExpiryTrackingService } from '../services/expiryTrackingService';
import { prisma } from '../services/database';
import '../types/jest';

describe('Policy Template Statistics Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database connection is established
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('PolicyTemplateStatsService', () => {
    test('should calculate policy template stats without errors', async () => {
      const stats = await PolicyTemplateStatsService.calculatePolicyTemplateStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalTemplates).toBe('number');
      expect(typeof stats.totalInstances).toBe('number');
      expect(typeof stats.activeInstances).toBe('number');
      expect(typeof stats.totalClients).toBe('number');
      expect(Array.isArray(stats.topProviders)).toBe(true);
      expect(Array.isArray(stats.policyTypeDistribution)).toBe(true);
    });

    test('should get system level metrics without errors', async () => {
      const metrics = await PolicyTemplateStatsService.getSystemLevelMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalRevenue).toBe('number');
      expect(typeof metrics.totalCommission).toBe('number');
      expect(typeof metrics.averageInstanceValue).toBe('number');
      expect(typeof metrics.clientRetentionRate).toBe('number');
      expect(typeof metrics.policyRenewalRate).toBe('number');
      expect(typeof metrics.monthlyGrowthRate).toBe('number');
      expect(Array.isArray(metrics.topPerformingTemplates)).toBe(true);
    });

    test('should get provider performance metrics without errors', async () => {
      const metrics = await PolicyTemplateStatsService.getProviderPerformanceMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
      
      if (metrics.length > 0) {
        const metric = metrics[0];
        expect(typeof metric.provider).toBe('string');
        expect(typeof metric.templateCount).toBe('number');
        expect(typeof metric.instanceCount).toBe('number');
        expect(typeof metric.totalRevenue).toBe('number');
        expect(typeof metric.averageInstanceValue).toBe('number');
        expect(typeof metric.activeInstancesRatio).toBe('number');
        expect(typeof metric.expiryRate).toBe('number');
      }
    });

    test('should get policy type performance metrics without errors', async () => {
      const metrics = await PolicyTemplateStatsService.getPolicyTypePerformanceMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
      
      if (metrics.length > 0) {
        const metric = metrics[0];
        expect(typeof metric.policyType).toBe('string');
        expect(typeof metric.templateCount).toBe('number');
        expect(typeof metric.instanceCount).toBe('number');
        expect(typeof metric.totalRevenue).toBe('number');
        expect(typeof metric.averageInstanceValue).toBe('number');
        expect(typeof metric.popularityRank).toBe('number');
        expect(typeof metric.growthRate).toBe('number');
      }
    });
  });

  describe('ExpiryTrackingService', () => {
    test('should get expiry tracking stats without errors', async () => {
      const stats = await PolicyTemplateStatsService.getExpiryTrackingStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.expiringThisWeek).toBe('number');
      expect(typeof stats.expiringThisMonth).toBe('number');
      expect(typeof stats.expiringNextMonth).toBe('number');
      expect(typeof stats.expiredLastMonth).toBe('number');
      expect(Array.isArray(stats.expiringInstances)).toBe(true);
    });

    test('should get expiring policies by level without errors', async () => {
      const result = await ExpiryTrackingService.getExpiringPoliciesByLevel();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.critical)).toBe(true);
      expect(Array.isArray(result.warning)).toBe(true);
      expect(Array.isArray(result.info)).toBe(true);
      expect(typeof result.counts.critical).toBe('number');
      expect(typeof result.counts.warning).toBe('number');
      expect(typeof result.counts.info).toBe('number');
      expect(typeof result.counts.total).toBe('number');
    });

    test('should get expiry summary without errors', async () => {
      const summary = await ExpiryTrackingService.getExpirySummary();
      
      expect(summary).toBeDefined();
      expect(typeof summary.expiringThisWeek).toBe('number');
      expect(typeof summary.expiringThisMonth).toBe('number');
      expect(typeof summary.expiringNextThreeMonths).toBe('number');
      expect(typeof summary.totalActiveInstances).toBe('number');
      expect(typeof summary.expiryRateThisWeek).toBe('number');
      expect(typeof summary.expiryRateThisMonth).toBe('number');
      expect(summary.revenueAtRisk).toBeDefined();
      expect(typeof summary.revenueAtRisk.premium).toBe('number');
      expect(typeof summary.revenueAtRisk.commission).toBe('number');
      expect(typeof summary.revenueAtRisk.total).toBe('number');
    });

    test('should update expired policy statuses without errors', async () => {
      const result = await ExpiryTrackingService.updateExpiredPolicyStatuses();
      
      expect(result).toBeDefined();
      expect(typeof result.updatedCount).toBe('number');
      expect(Array.isArray(result.updatedPolicies)).toBe(true);
    });
  });
});