import { PolicyTemplateService } from '../services/policyTemplateService';
import { PolicyInstanceService } from '../services/policyInstanceService';
import { cacheService } from '../services/cacheService';
import { prisma } from '../services/database';
import '../types/jest';

describe('Performance Optimizations', () => {
  beforeAll(async () => {
    // Clear cache before tests
    cacheService.flushAll();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Caching', () => {
    it('should cache policy template statistics', async () => {
      // First call should hit the database
      const start1 = Date.now();
      const stats1 = await PolicyTemplateService.getTemplatesWithFilters({}, { page: 1, limit: 10 });
      const duration1 = Date.now() - start1;

      // Second call should use cache (should be faster)
      const start2 = Date.now();
      const stats2 = await PolicyTemplateService.getTemplatesWithFilters({}, { page: 1, limit: 10 });
      const duration2 = Date.now() - start2;

      expect(stats1).toEqual(stats2);
      expect(duration2).toBeLessThan(duration1);
      console.log(`First call: ${duration1}ms, Second call (cached): ${duration2}ms`);
    });

    it('should cache search results', async () => {
      const searchQuery = 'test';
      
      // First search should hit the database
      const start1 = Date.now();
      const results1 = await PolicyTemplateService.searchTemplates(searchQuery);
      const duration1 = Date.now() - start1;

      // Second search should use cache
      const start2 = Date.now();
      const results2 = await PolicyTemplateService.searchTemplates(searchQuery);
      const duration2 = Date.now() - start2;

      expect(results1).toEqual(results2);
      expect(duration2).toBeLessThan(duration1);
      console.log(`First search: ${duration1}ms, Second search (cached): ${duration2}ms`);
    });

    it('should invalidate cache when creating templates', async () => {
      // Get initial stats
      const initialStats = await PolicyTemplateService.getTemplatesWithFilters({}, { page: 1, limit: 10 });
      
      // Create a new template
      const newTemplate = await PolicyTemplateService.createTemplate({
        policyNumber: `PERF-TEST-${Date.now()}`,
        policyType: 'Life',
        provider: 'Test Provider',
        description: 'Performance test template'
      });

      // Get stats again - should be different due to cache invalidation
      const updatedStats = await PolicyTemplateService.getTemplatesWithFilters({}, { page: 1, limit: 10 });
      
      expect(updatedStats.stats.totalTemplates).toBeGreaterThan(initialStats.stats.totalTemplates);

      // Clean up
      await PolicyTemplateService.deleteTemplate(newTemplate.id);
    });
  });

  describe('Database Indexes', () => {
    it('should perform fast queries on indexed fields', async () => {
      const start = Date.now();
      
      // This query should use the provider index
      const templates = await PolicyTemplateService.getTemplatesWithFilters(
        { providers: ['Test Provider'] },
        { page: 1, limit: 10 }
      );
      
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      console.log(`Provider filter query: ${duration}ms`);
    });

    it('should perform fast sorting on indexed fields', async () => {
      const start = Date.now();
      
      // This query should use the createdAt index for sorting
      const templates = await PolicyTemplateService.getTemplatesWithFilters(
        {},
        { page: 1, limit: 10, sortField: 'createdAt', sortDirection: 'desc' }
      );
      
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      console.log(`CreatedAt sort query: ${duration}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with cache operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many cache operations
      for (let i = 0; i < 1000; i++) {
        cacheService.set(`test-key-${i}`, { data: `test-data-${i}` });
        cacheService.get(`test-key-${i}`);
      }
      
      // Clear cache
      cacheService.flushAll();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Cache Statistics', () => {
    it('should provide cache performance metrics', () => {
      // Clear cache and perform operations
      cacheService.flushAll();
      
      // Set some values
      cacheService.set('test1', 'value1');
      cacheService.set('test2', 'value2');
      
      // Get values (hits)
      cacheService.get('test1');
      cacheService.get('test2');
      
      // Try to get non-existent value (miss)
      cacheService.get('test3');
      
      const stats = cacheService.getStats();
      
      expect(stats.keys).toBe(2);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      
      console.log('Cache stats:', stats);
    });
  });
});