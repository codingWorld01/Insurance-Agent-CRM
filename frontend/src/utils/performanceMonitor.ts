// Performance monitoring utilities for policy template system

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     localStorage.getItem('performance_monitoring') === 'true';
  }

  /**
   * Start measuring performance for a specific operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End measuring performance for a specific operation
   */
  end(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`, metric.metadata);
    }

    // Store for analytics (in production, you might send this to a service)
    this.storeMetric(metric);

    return duration;
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Measure a synchronous function execution time
   */
  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  /**
   * Get metrics by name pattern
   */
  getMetricsByPattern(pattern: string): PerformanceMetric[] {
    const regex = new RegExp(pattern);
    return this.getMetrics().filter(m => regex.test(m.name));
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { count: number; avgDuration: number; totalDuration: number }> {
    const metrics = this.getMetrics();
    const summary: Record<string, { count: number; avgDuration: number; totalDuration: number }> = {};

    metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { count: 0, avgDuration: 0, totalDuration: 0 };
      }

      summary[metric.name].count++;
      summary[metric.name].totalDuration += metric.duration!;
      summary[metric.name].avgDuration = summary[metric.name].totalDuration / summary[metric.name].count;
    });

    return summary;
  }

  /**
   * Store metric for analytics
   */
  private storeMetric(metric: PerformanceMetric): void {
    // In a real application, you might send this to an analytics service
    // For now, we'll just store in localStorage for development
    if (this.isEnabled) {
      const stored = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
      stored.push({
        ...metric,
        timestamp: Date.now(),
      });

      // Keep only last 100 metrics to avoid storage bloat
      if (stored.length > 100) {
        stored.splice(0, stored.length - 100);
      }

      localStorage.setItem('performance_metrics', JSON.stringify(stored));
    }
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('performance_monitoring', enabled.toString());
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    start: performanceMonitor.start.bind(performanceMonitor),
    end: performanceMonitor.end.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureSync: performanceMonitor.measureSync.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
    clear: performanceMonitor.clear.bind(performanceMonitor),
  };
}

// Decorator for measuring component render time
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    performanceMonitor.start(`render_${componentName}`);
    
    const result = Component(props);
    
    // Use setTimeout to measure after render
    setTimeout(() => {
      performanceMonitor.end(`render_${componentName}`);
    }, 0);

    return result;
  };
}

// Utility functions for specific performance measurements

/**
 * Measure API call performance
 */
export async function measureApiCall<T>(
  name: string,
  apiCall: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return performanceMonitor.measure(`api_${name}`, apiCall, metadata);
}

/**
 * Measure database query performance (for backend)
 */
export async function measureDbQuery<T>(
  queryName: string,
  query: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return performanceMonitor.measure(`db_${queryName}`, query, metadata);
}

/**
 * Measure component render performance
 */
export function measureRender(componentName: string, renderFn: () => React.ReactElement): React.ReactElement {
  return performanceMonitor.measureSync(`render_${componentName}`, renderFn);
}

/**
 * Measure data processing performance
 */
export function measureDataProcessing<T>(
  operationName: string,
  processingFn: () => T,
  metadata?: Record<string, any>
): T {
  return performanceMonitor.measureSync(`data_${operationName}`, processingFn, metadata);
}

// Performance thresholds for alerting
export const PERFORMANCE_THRESHOLDS = {
  API_CALL: 2000, // 2 seconds
  DB_QUERY: 1000, // 1 second
  COMPONENT_RENDER: 100, // 100ms
  DATA_PROCESSING: 500, // 500ms
} as const;

/**
 * Check if performance metric exceeds threshold
 */
export function checkPerformanceThreshold(
  metricName: string,
  duration: number,
  threshold?: number
): boolean {
  const defaultThreshold = PERFORMANCE_THRESHOLDS.API_CALL;
  const actualThreshold = threshold || defaultThreshold;
  
  if (duration > actualThreshold) {
    console.warn(`Performance warning: ${metricName} took ${duration.toFixed(2)}ms (threshold: ${actualThreshold}ms)`);
    return false;
  }
  
  return true;
}

// Export types
export type { PerformanceMetric };