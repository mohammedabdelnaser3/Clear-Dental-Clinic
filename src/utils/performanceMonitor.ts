/**
 * Performance monitoring utilities
 * Tracks page load times, component render times, and network performance
 */

export interface PerformanceMetrics {
  pageLoadTime?: number;
  domContentLoaded?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  networkSpeed?: 'slow' | 'medium' | 'fast';
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface ComponentMetrics {
  name: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private componentMetrics = new Map<string, ComponentMetrics>();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.measurePageLoad();
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // Observe paint metrics
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Observe layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.metrics.cumulativeLayoutShift = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  /**
   * Measure page load performance
   */
  private measurePageLoad(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (navigation) {
          this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
          this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        }

        // Estimate network speed
        this.estimateNetworkSpeed();

        // Measure memory usage
        this.measureMemoryUsage();
      }, 0);
    });
  }

  /**
   * Estimate network speed based on resource loading times
   */
  private estimateNetworkSpeed(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    if (resources.length === 0) return;

    const totalTime = resources.reduce((sum, resource) => {
      return sum + (resource.responseEnd - resource.fetchStart);
    }, 0);

    const averageTime = totalTime / resources.length;

    if (averageTime < 100) {
      this.metrics.networkSpeed = 'fast';
    } else if (averageTime < 300) {
      this.metrics.networkSpeed = 'medium';
    } else {
      this.metrics.networkSpeed = 'slow';
    }
  }

  /**
   * Measure memory usage if available
   */
  private measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
      };
    }
  }

  /**
   * Start measuring component performance
   * @param componentName - Name of the component
   * @returns Function to end measurement
   */
  startComponentMeasure(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      const existing = this.componentMetrics.get(componentName);
      if (existing) {
        existing.renderTime = renderTime;
        existing.updateCount++;
      } else {
        this.componentMetrics.set(componentName, {
          name: componentName,
          renderTime,
          mountTime: renderTime,
          updateCount: 1
        });
      }
    };
  }

  /**
   * Measure async operation performance
   * @param operationName - Name of the operation
   * @param operation - Async operation to measure
   * @returns Promise with operation result and timing
   */
  async measureAsync<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;

      console.log(`${operationName} completed in ${duration.toFixed(2)}ms`);

      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Get current performance metrics
   * @returns Current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get component performance metrics
   * @returns Map of component metrics
   */
  getComponentMetrics(): Map<string, ComponentMetrics> {
    return new Map(this.componentMetrics);
  }

  /**
   * Get performance score (0-100)
   * @returns Performance score based on Core Web Vitals
   */
  getPerformanceScore(): number {
    let score = 100;

    // Largest Contentful Paint (25% weight)
    if (this.metrics.largestContentfulPaint) {
      if (this.metrics.largestContentfulPaint > 4000) score -= 25;
      else if (this.metrics.largestContentfulPaint > 2500) score -= 15;
      else if (this.metrics.largestContentfulPaint > 1500) score -= 5;
    }

    // First Input Delay (25% weight)
    if (this.metrics.firstInputDelay) {
      if (this.metrics.firstInputDelay > 300) score -= 25;
      else if (this.metrics.firstInputDelay > 100) score -= 15;
      else if (this.metrics.firstInputDelay > 50) score -= 5;
    }

    // Cumulative Layout Shift (25% weight)
    if (this.metrics.cumulativeLayoutShift) {
      if (this.metrics.cumulativeLayoutShift > 0.25) score -= 25;
      else if (this.metrics.cumulativeLayoutShift > 0.1) score -= 15;
      else if (this.metrics.cumulativeLayoutShift > 0.05) score -= 5;
    }

    // Page Load Time (25% weight)
    if (this.metrics.pageLoadTime) {
      if (this.metrics.pageLoadTime > 5000) score -= 25;
      else if (this.metrics.pageLoadTime > 3000) score -= 15;
      else if (this.metrics.pageLoadTime > 2000) score -= 5;
    }

    return Math.max(0, score);
  }

  /**
   * Log performance report to console
   */
  logReport(): void {
    console.group('🚀 Performance Report');

    console.log('📊 Core Web Vitals:');
    console.log(`  LCP: ${this.metrics.largestContentfulPaint?.toFixed(2) || 'N/A'}ms`);
    console.log(`  FID: ${this.metrics.firstInputDelay?.toFixed(2) || 'N/A'}ms`);
    console.log(`  CLS: ${this.metrics.cumulativeLayoutShift?.toFixed(3) || 'N/A'}`);

    console.log('⏱️ Load Times:');
    console.log(`  Page Load: ${this.metrics.pageLoadTime?.toFixed(2) || 'N/A'}ms`);
    console.log(`  DOM Ready: ${this.metrics.domContentLoaded?.toFixed(2) || 'N/A'}ms`);
    console.log(`  FCP: ${this.metrics.firstContentfulPaint?.toFixed(2) || 'N/A'}ms`);

    console.log('🌐 Network:');
    console.log(`  Speed: ${this.metrics.networkSpeed || 'Unknown'}`);

    if (this.metrics.memoryUsage) {
      console.log('💾 Memory:');
      console.log(`  Used: ${(this.metrics.memoryUsage.used / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Total: ${(this.metrics.memoryUsage.total / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Usage: ${this.metrics.memoryUsage.percentage}%`);
    }

    console.log(`🎯 Performance Score: ${this.getPerformanceScore()}/100`);

    if (this.componentMetrics.size > 0) {
      console.log('⚛️ Component Performance:');
      this.componentMetrics.forEach((metrics, name) => {
        console.log(`  ${name}: ${metrics.renderTime.toFixed(2)}ms (${metrics.updateCount} renders)`);
      });
    }

    console.groupEnd();
  }

  /**
   * Clean up observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-log report in development mode
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.logReport();
    }, 2000);
  });
}

export default performanceMonitor;
export { performanceMonitor };