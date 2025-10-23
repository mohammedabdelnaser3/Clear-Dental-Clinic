import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';

/**
 * Hook for monitoring component performance
 * @param componentName - Name of the component to monitor
 * @returns Object with performance utilities
 */
export const usePerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const measureEnd = useRef<(() => void) | null>(null);

  // Start measuring on every render
  useEffect(() => {
    renderStartTime.current = performance.now();
    measureEnd.current = performanceMonitor.startComponentMeasure(componentName);

    return () => {
      if (measureEnd.current) {
        measureEnd.current();
      }
    };
  });

  // Measure async operations
  const measureAsync = useCallback(
    async <T>(operationName: string, operation: () => Promise<T>) => {
      return performanceMonitor.measureAsync(`${componentName}.${operationName}`, operation);
    },
    [componentName]
  );

  // Mark performance milestones
  const mark = useCallback((milestone: string) => {
    performance.mark(`${componentName}.${milestone}`);
  }, [componentName]);

  return {
    measureAsync,
    mark,
    getMetrics: () => performanceMonitor.getMetrics(),
    getComponentMetrics: () => performanceMonitor.getComponentMetrics()
  };
};

/**
 * Hook for monitoring network performance
 * @returns Object with network performance utilities
 */
export const useNetworkPerformance = () => {
  const measureRequest = useCallback(
    async <T>(url: string, requestFn: () => Promise<T>) => {
      const startTime = performance.now();
      
      try {
        const result = await requestFn();
        const duration = performance.now() - startTime;
        
        // Log slow requests in development
        if (import.meta.env.DEV && duration > 1000) {
          console.warn(`Slow request to ${url}: ${duration.toFixed(2)}ms`);
        }
        
        return { result, duration };
      } catch (error) {
        const duration = performance.now() - startTime;
        console.error(`Request to ${url} failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
      }
    },
    []
  );

  return { measureRequest };
};

/**
 * Hook for monitoring image loading performance
 * @returns Object with image performance utilities
 */
export const useImagePerformance = () => {
  const measureImageLoad = useCallback((src: string) => {
    const startTime = performance.now();
    
    return {
      onLoad: () => {
        const duration = performance.now() - startTime;
        if (import.meta.env.DEV) {
          console.log(`Image loaded: ${src} (${duration.toFixed(2)}ms)`);
        }
      },
      onError: () => {
        const duration = performance.now() - startTime;
        console.warn(`Image failed to load: ${src} (${duration.toFixed(2)}ms)`);
      }
    };
  }, []);

  return { measureImageLoad };
};

export default usePerformance;