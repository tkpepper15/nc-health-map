/**
 * Performance Monitoring Utilities
 * Provides tools for measuring and optimizing application performance
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageDuration: number;
    slowestOperation: string;
    fastestOperation: string;
  };
}

/**
 * Performance measurement class
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];

  /**
   * Start measuring performance for an operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  /**
   * End measurement for an operation
   */
  end(name: string): number | null {
    const metric = this.metrics.get(name);
    
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration
    };

    this.completedMetrics.push(completedMetric);
    this.metrics.delete(name);

    return duration;
  }

  /**
   * Measure an async function
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
   * Measure a synchronous function
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
   * Get performance report
   */
  getReport(): PerformanceReport {
    if (this.completedMetrics.length === 0) {
      return {
        metrics: [],
        summary: {
          totalMetrics: 0,
          averageDuration: 0,
          slowestOperation: '',
          fastestOperation: ''
        }
      };
    }

    const durations = this.completedMetrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!);

    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const averageDuration = totalDuration / durations.length;

    const slowest = this.completedMetrics.reduce((prev, current) => 
      (current.duration || 0) > (prev.duration || 0) ? current : prev
    );

    const fastest = this.completedMetrics.reduce((prev, current) => 
      (current.duration || Infinity) < (prev.duration || Infinity) ? current : prev
    );

    return {
      metrics: [...this.completedMetrics],
      summary: {
        totalMetrics: this.completedMetrics.length,
        averageDuration,
        slowestOperation: slowest.name,
        fastestOperation: fastest.name
      }
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.completedMetrics = [];
  }

  /**
   * Log performance report to console
   */
  logReport(): void {
    const report = this.getReport();
    
    if (report.metrics.length === 0) {
      console.log('No performance metrics recorded');
      return;
    }

    console.group('Performance Report');
    console.table(report.metrics.map(m => ({
      name: m.name,
      duration: `${m.duration?.toFixed(2)}ms`,
      metadata: m.metadata ? JSON.stringify(m.metadata) : '-'
    })));
    
    console.log(`Average duration: ${report.summary.averageDuration.toFixed(2)}ms`);
    console.log(`Slowest: ${report.summary.slowestOperation}`);
    console.log(`Fastest: ${report.summary.fastestOperation}`);
    console.groupEnd();
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoization for expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Performance-optimized array operations
 */
export const arrayUtils = {
  /**
   * Chunked processing for large arrays
   */
  processInChunks<T, R>(
    array: T[],
    processor: (chunk: T[]) => R[],
    chunkSize: number = 100
  ): R[] {
    const results: R[] = [];
    
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      const chunkResults = processor(chunk);
      results.push(...chunkResults);
    }
    
    return results;
  },

  /**
   * Binary search for sorted arrays
   */
  binarySearch<T>(
    sortedArray: T[],
    target: T,
    compareFunction?: (a: T, b: T) => number
  ): number {
    let left = 0;
    let right = sortedArray.length - 1;
    
    const compare = compareFunction || ((a, b) => a < b ? -1 : a > b ? 1 : 0);
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const comparison = compare(sortedArray[mid], target);
      
      if (comparison === 0) {
        return mid;
      } else if (comparison < 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return -1;
  }
};

/**
 * Web vitals measurement (if available)
 */
export function measureWebVitals() {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      console.log('LCP:', lastEntry.startTime);
      performanceMonitor.start('LCP');
      setTimeout(() => performanceMonitor.end('LCP'), lastEntry.startTime);
    });
    
    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('LCP measurement not supported');
    }
  }

  // First Input Delay (requires user interaction)
  const measureFID = () => {
    const startTime = performance.now();
    
    const handleFirstInput = () => {
      const duration = performance.now() - startTime;
      console.log('FID:', duration);
      
      document.removeEventListener('click', handleFirstInput);
      document.removeEventListener('keydown', handleFirstInput);
    };
    
    document.addEventListener('click', handleFirstInput, { once: true });
    document.addEventListener('keydown', handleFirstInput, { once: true });
  };

  // Wait for page to load before measuring FID
  if (document.readyState === 'complete') {
    measureFID();
  } else {
    window.addEventListener('load', measureFID);
  }
}

/**
 * Resource timing analysis
 */
export function analyzeResourceTiming(): void {
  if (typeof window === 'undefined' || !('performance' in window)) return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const analysis = resources.map(resource => ({
    name: resource.name,
    duration: resource.duration,
    size: resource.transferSize,
    type: resource.initiatorType,
    cached: resource.transferSize === 0
  }));

  console.table(analysis);
  
  const totalSize = analysis.reduce((sum, resource) => sum + (resource.size || 0), 0);
  const totalDuration = analysis.reduce((sum, resource) => sum + resource.duration, 0);
  
  console.log(`Total resource size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`Total load time: ${totalDuration.toFixed(2)}ms`);
}