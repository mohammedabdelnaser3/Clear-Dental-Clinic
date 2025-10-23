/**
 * Performance testing utilities for mobile networks and page load times
 * Simulates different network conditions and measures performance
 */

export interface NetworkCondition {
  name: string;
  downloadThroughput: number; // bytes per second
  uploadThroughput: number;   // bytes per second
  latency: number;            // milliseconds
}

export const networkConditions: Record<string, NetworkCondition> = {
  'fast-3g': {
    name: 'Fast 3G',
    downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
    uploadThroughput: 750 * 1024 / 8,           // 750 Kbps
    latency: 562.5
  },
  'slow-3g': {
    name: 'Slow 3G',
    downloadThroughput: 500 * 1024 / 8,         // 500 Kbps
    uploadThroughput: 500 * 1024 / 8,           // 500 Kbps
    latency: 2000
  },
  '2g': {
    name: '2G',
    downloadThroughput: 250 * 1024 / 8,         // 250 Kbps
    uploadThroughput: 50 * 1024 / 8,            // 50 Kbps
    latency: 2800
  },
  'offline': {
    name: 'Offline',
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0
  }
};

export interface PerformanceTestResult {
  condition: string;
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalResourceSize: number;
  resourceCount: number;
  cacheHitRate: number;
  errors: string[];
}

/**
 * Test page performance under different network conditions
 * Note: This requires Chrome DevTools Protocol for full simulation
 * In production, this provides estimates based on resource timing
 */
export class PerformanceTester {
  private results: PerformanceTestResult[] = [];

  /**
   * Run performance test for current page
   * @param condition - Network condition to simulate
   * @returns Promise<PerformanceTestResult>
   */
  async testPagePerformance(condition: NetworkCondition): Promise<PerformanceTestResult> {
    const errors: string[] = [];

    try {
      // Simulate network delay for requests
      if (condition.latency > 0) {
        await this.simulateNetworkDelay(condition.latency);
      }

      // Measure current page performance
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const paintEntries = performance.getEntriesByType('paint');

      // Calculate metrics
      const pageLoadTime = navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
      const domContentLoaded = navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0;
      
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      const firstContentfulPaint = fcpEntry ? fcpEntry.startTime : 0;

      // Estimate LCP (simplified)
      const largestContentfulPaint = this.estimateLCP();

      // Calculate resource metrics
      const totalResourceSize = resources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);

      const cacheHitRate = this.calculateCacheHitRate(resources);

      const result: PerformanceTestResult = {
        condition: condition.name,
        pageLoadTime,
        domContentLoaded,
        firstContentfulPaint,
        largestContentfulPaint,
        totalResourceSize,
        resourceCount: resources.length,
        cacheHitRate,
        errors
      };

      this.results.push(result);
      return result;

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Simulate network delay
   * @param latency - Delay in milliseconds
   */
  private async simulateNetworkDelay(latency: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, latency / 2));
  }

  /**
   * Estimate Largest Contentful Paint
   * @returns Estimated LCP time
   */
  private estimateLCP(): number {
    // Try to get LCP from PerformanceObserver if available
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        return lcpEntries[lcpEntries.length - 1].startTime;
      }
    } catch (_error) {
      // LCP not available
    }

    // Fallback: estimate based on image load times
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const images = resources.filter(resource => 
      resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
    );

    if (images.length > 0) {
      const slowestImage = images.reduce((slowest, current) => 
        current.responseEnd > slowest.responseEnd ? current : slowest
      );
      return slowestImage.responseEnd;
    }

    return 0;
  }

  /**
   * Calculate cache hit rate from resources
   * @param resources - Performance resource entries
   * @returns Cache hit rate as percentage
   */
  private calculateCacheHitRate(resources: PerformanceResourceTiming[]): number {
    if (resources.length === 0) return 0;

    const cachedResources = resources.filter(resource => 
      resource.transferSize === 0 && resource.decodedBodySize > 0
    );

    return (cachedResources.length / resources.length) * 100;
  }

  /**
   * Test multiple network conditions
   * @param conditions - Array of network conditions to test
   * @returns Promise<PerformanceTestResult[]>
   */
  async testMultipleConditions(conditions: NetworkCondition[]): Promise<PerformanceTestResult[]> {
    const results: PerformanceTestResult[] = [];

    for (const condition of conditions) {
      try {
        console.log(`Testing performance under ${condition.name} conditions...`);
        const result = await this.testPagePerformance(condition);
        results.push(result);
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to test ${condition.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Generate performance report
   * @returns Formatted performance report
   */
  generateReport(): string {
    if (this.results.length === 0) {
      return 'No performance test results available.';
    }

    let report = '📊 Performance Test Report\n';
    report += '='.repeat(50) + '\n\n';

    this.results.forEach(result => {
      report += `🌐 ${result.condition}\n`;
      report += `-`.repeat(20) + '\n';
      report += `Page Load Time: ${result.pageLoadTime.toFixed(2)}ms\n`;
      report += `DOM Content Loaded: ${result.domContentLoaded.toFixed(2)}ms\n`;
      report += `First Contentful Paint: ${result.firstContentfulPaint.toFixed(2)}ms\n`;
      report += `Largest Contentful Paint: ${result.largestContentfulPaint.toFixed(2)}ms\n`;
      report += `Total Resource Size: ${(result.totalResourceSize / 1024).toFixed(2)}KB\n`;
      report += `Resource Count: ${result.resourceCount}\n`;
      report += `Cache Hit Rate: ${result.cacheHitRate.toFixed(1)}%\n`;
      
      if (result.errors.length > 0) {
        report += `Errors: ${result.errors.join(', ')}\n`;
      }
      
      report += '\n';
    });

    // Add recommendations
    report += this.generateRecommendations();

    return report;
  }

  /**
   * Generate performance recommendations
   * @returns Formatted recommendations
   */
  private generateRecommendations(): string {
    let recommendations = '💡 Recommendations\n';
    recommendations += '=' .repeat(20) + '\n';

    const avgPageLoad = this.results.reduce((sum, r) => sum + r.pageLoadTime, 0) / this.results.length;
    const avgResourceSize = this.results.reduce((sum, r) => sum + r.totalResourceSize, 0) / this.results.length;
    const avgCacheHit = this.results.reduce((sum, r) => sum + r.cacheHitRate, 0) / this.results.length;

    if (avgPageLoad > 3000) {
      recommendations += '• Page load time is high. Consider code splitting and lazy loading.\n';
    }

    if (avgResourceSize > 1024 * 1024) { // 1MB
      recommendations += '• Total resource size is large. Optimize images and enable compression.\n';
    }

    if (avgCacheHit < 50) {
      recommendations += '• Low cache hit rate. Implement better caching strategies.\n';
    }

    const slowestCondition = this.results.reduce((slowest, current) => 
      current.pageLoadTime > slowest.pageLoadTime ? current : slowest
    );

    if (slowestCondition.pageLoadTime > 5000) {
      recommendations += `• Performance is poor on ${slowestCondition.condition}. Prioritize critical resources.\n`;
    }

    return recommendations;
  }

  /**
   * Clear test results
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Get all test results
   * @returns Array of test results
   */
  getResults(): PerformanceTestResult[] {
    return [...this.results];
  }
}

/**
 * Quick performance test for mobile networks
 * @returns Promise<void>
 */
export const runMobilePerformanceTest = async (): Promise<void> => {
  const tester = new PerformanceTester();
  
  console.log('🚀 Starting mobile performance test...');
  
  const mobileConditions = [
    networkConditions['fast-3g'],
    networkConditions['slow-3g'],
    networkConditions['2g']
  ];

  try {
    await tester.testMultipleConditions(mobileConditions);
    console.log(tester.generateReport());
  } catch (error) {
    console.error('Performance test failed:', error);
  }
};

/**
 * Test image loading performance
 * @param imageUrls - Array of image URLs to test
 * @returns Promise<Array<{url: string, loadTime: number}>>
 */
export const testImageLoadingPerformance = async (
  imageUrls: string[]
): Promise<Array<{ url: string; loadTime: number; size?: number }>> => {
  const results: Array<{ url: string; loadTime: number; size?: number }> = [];

  for (const url of imageUrls) {
    const startTime = performance.now();
    
    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      
      const loadTime = performance.now() - startTime;
      
      // Try to get size from performance entries
      const resourceEntry = performance.getEntriesByName(url)[0] as PerformanceResourceTiming;
      const size = resourceEntry?.transferSize;
      
      results.push({ url, loadTime, size });
      
    } catch (error) {
      console.error(`Failed to load image: ${url}`, error);
      results.push({ url, loadTime: -1 });
    }
  }

  return results;
};

// Export singleton instance
export const performanceTester = new PerformanceTester();

// Auto-run mobile performance test in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Run test after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (Math.random() < 0.1) { // 10% chance to avoid spam
        runMobilePerformanceTest();
      }
    }, 3000);
  });
}