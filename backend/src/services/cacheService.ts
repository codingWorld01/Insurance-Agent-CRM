import NodeCache from 'node-cache';

// Cache configuration
const CACHE_TTL = {
  POLICY_TEMPLATE_STATS: 300, // 5 minutes
  POLICY_TEMPLATE_FILTERS: 600, // 10 minutes
  POLICY_TEMPLATE_SEARCH: 180, // 3 minutes
  DASHBOARD_STATS: 300, // 5 minutes
  POLICY_DETAIL_STATS: 180, // 3 minutes
  EXPIRY_TRACKING: 120, // 2 minutes
} as const;

// Cache keys
const CACHE_KEYS = {
  POLICY_TEMPLATE_STATS: 'policy_template_stats',
  POLICY_TEMPLATE_FILTERS: 'policy_template_filters',
  POLICY_TEMPLATE_SEARCH: (query: string, excludeClientId?: string) => 
    `policy_template_search:${query}:${excludeClientId || 'none'}`,
  DASHBOARD_STATS: 'dashboard_stats',
  POLICY_DETAIL_STATS: (templateId: string) => `policy_detail_stats:${templateId}`,
  EXPIRY_TRACKING: 'expiry_tracking',
  POLICY_TEMPLATES_LIST: (filters: string, sort: string, page: number, limit: number) =>
    `policy_templates_list:${filters}:${sort}:${page}:${limit}`,
} as const;

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // Default TTL of 5 minutes
      checkperiod: 60, // Check for expired keys every minute
      useClones: false, // Don't clone objects for better performance
      deleteOnExpire: true,
      maxKeys: 1000, // Limit cache size
    });

    // Log cache statistics periodically
    setInterval(() => {
      const stats = this.cache.getStats();
      if (stats.keys > 0) {
        console.log('Cache stats:', {
          keys: stats.keys,
          hits: stats.hits,
          misses: stats.misses,
          hitRate: stats.hits / (stats.hits + stats.misses)
        });
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Delete specific key from cache
   */
  del(key: string | string[]): number {
    return this.cache.del(key);
  }

  /**
   * Delete keys matching pattern
   */
  delPattern(pattern: string): number {
    const keys = this.cache.keys().filter(key => key.includes(pattern));
    return this.cache.del(keys);
  }

  /**
   * Clear all cache
   */
  flushAll(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  // Policy Template specific cache methods

  /**
   * Cache policy template statistics
   */
  setPolicyTemplateStats(stats: any): boolean {
    return this.set(CACHE_KEYS.POLICY_TEMPLATE_STATS, stats, CACHE_TTL.POLICY_TEMPLATE_STATS);
  }

  /**
   * Get cached policy template statistics
   */
  getPolicyTemplateStats(): any | undefined {
    return this.get(CACHE_KEYS.POLICY_TEMPLATE_STATS);
  }

  /**
   * Cache policy template filters
   */
  setPolicyTemplateFilters(filters: any): boolean {
    return this.set(CACHE_KEYS.POLICY_TEMPLATE_FILTERS, filters, CACHE_TTL.POLICY_TEMPLATE_FILTERS);
  }

  /**
   * Get cached policy template filters
   */
  getPolicyTemplateFilters(): any | undefined {
    return this.get(CACHE_KEYS.POLICY_TEMPLATE_FILTERS);
  }

  /**
   * Cache policy template search results
   */
  setPolicyTemplateSearch(query: string, results: any, excludeClientId?: string): boolean {
    const key = CACHE_KEYS.POLICY_TEMPLATE_SEARCH(query, excludeClientId);
    return this.set(key, results, CACHE_TTL.POLICY_TEMPLATE_SEARCH);
  }

  /**
   * Get cached policy template search results
   */
  getPolicyTemplateSearch(query: string, excludeClientId?: string): any | undefined {
    const key = CACHE_KEYS.POLICY_TEMPLATE_SEARCH(query, excludeClientId);
    return this.get(key);
  }

  /**
   * Cache dashboard statistics
   */
  setDashboardStats(stats: any): boolean {
    return this.set(CACHE_KEYS.DASHBOARD_STATS, stats, CACHE_TTL.DASHBOARD_STATS);
  }

  /**
   * Get cached dashboard statistics
   */
  getDashboardStats(): any | undefined {
    return this.get(CACHE_KEYS.DASHBOARD_STATS);
  }

  /**
   * Cache policy detail statistics
   */
  setPolicyDetailStats(templateId: string, stats: any): boolean {
    const key = CACHE_KEYS.POLICY_DETAIL_STATS(templateId);
    return this.set(key, stats, CACHE_TTL.POLICY_DETAIL_STATS);
  }

  /**
   * Get cached policy detail statistics
   */
  getPolicyDetailStats(templateId: string): any | undefined {
    const key = CACHE_KEYS.POLICY_DETAIL_STATS(templateId);
    return this.get(key);
  }

  /**
   * Cache policy templates list
   */
  setPolicyTemplatesList(filters: string, sort: string, page: number, limit: number, data: any): boolean {
    const key = CACHE_KEYS.POLICY_TEMPLATES_LIST(filters, sort, page, limit);
    return this.set(key, data, CACHE_TTL.POLICY_TEMPLATE_STATS);
  }

  /**
   * Get cached policy templates list
   */
  getPolicyTemplatesList(filters: string, sort: string, page: number, limit: number): any | undefined {
    const key = CACHE_KEYS.POLICY_TEMPLATES_LIST(filters, sort, page, limit);
    return this.get(key);
  }

  /**
   * Invalidate policy template related caches
   */
  invalidatePolicyTemplateCache(): void {
    // Clear all policy template related caches
    this.del(CACHE_KEYS.POLICY_TEMPLATE_STATS);
    this.del(CACHE_KEYS.POLICY_TEMPLATE_FILTERS);
    this.del(CACHE_KEYS.DASHBOARD_STATS);
    
    // Clear search results
    this.delPattern('policy_template_search:');
    
    // Clear detail stats
    this.delPattern('policy_detail_stats:');
    
    // Clear list caches
    this.delPattern('policy_templates_list:');
  }

  /**
   * Invalidate specific policy template detail cache
   */
  invalidatePolicyDetailCache(templateId: string): void {
    const key = CACHE_KEYS.POLICY_DETAIL_STATS(templateId);
    this.del(key);
    
    // Also invalidate general stats
    this.del(CACHE_KEYS.POLICY_TEMPLATE_STATS);
    this.del(CACHE_KEYS.DASHBOARD_STATS);
  }

  /**
   * Invalidate dashboard related caches
   */
  invalidateDashboardCache(): void {
    this.del(CACHE_KEYS.DASHBOARD_STATS);
    this.del(CACHE_KEYS.POLICY_TEMPLATE_STATS);
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export { CACHE_TTL, CACHE_KEYS };