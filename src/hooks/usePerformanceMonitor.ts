import { useEffect, useRef } from 'react';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const usePerformanceMonitor = (componentName: string) => {
  const startTimeRef = useRef<number>(performance.now());
  const renderTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Mark render complete
    renderTimeRef.current = performance.now();
    
    // Log performance metrics
    const loadTime = renderTimeRef.current - startTimeRef.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} Performance:`, {
        loadTime: `${loadTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    }

    // Report to performance monitoring service (if available)
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: componentName,
        value: Math.round(loadTime)
      });
    }
  }, [componentName]);

  const measureInteraction = (interactionName: string) => {
    const interactionTime = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} - ${interactionName}:`, {
        time: `${(interactionTime - startTimeRef.current).toFixed(2)}ms`
      });
    }
  };

  return { measureInteraction };
};

// Core Web Vitals monitoring
export const useCoreWebVitals = () => {
  useEffect(() => {
    // Largest Contentful Paint (LCP)
    const observeLCP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (process.env.NODE_ENV === 'development') {
            console.log('LCP:', lastEntry.startTime);
          }
          
          // Report to analytics
          if (window.gtag) {
            window.gtag('event', 'web_vital', {
              name: 'LCP',
              value: Math.round(lastEntry.startTime),
              event_category: 'Web Vitals'
            });
          }
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      }
    };

    // First Input Delay (FID)
    const observeFID = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fidEntry = entry as any; // Type assertion for FID entry
            if (process.env.NODE_ENV === 'development') {
              console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
            }
            
            // Report to analytics
            if (window.gtag) {
              window.gtag('event', 'web_vital', {
                name: 'FID',
                value: Math.round(fidEntry.processingStart - fidEntry.startTime),
                event_category: 'Web Vitals'
              });
            }
          });
        });
        
        observer.observe({ entryTypes: ['first-input'] });
      }
    };

    // Cumulative Layout Shift (CLS)
    const observeCLS = () => {
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const clsEntry = entry as any; // Type assertion for CLS entry
            if (!clsEntry.hadRecentInput) {
              clsValue += clsEntry.value;
            }
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log('CLS:', clsValue);
          }
          
          // Report to analytics
          if (window.gtag) {
            window.gtag('event', 'web_vital', {
              name: 'CLS',
              value: Math.round(clsValue * 1000),
              event_category: 'Web Vitals'
            });
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
      }
    };

    observeLCP();
    observeFID();
    observeCLS();
  }, []);
};

// Resource loading monitoring
export const useResourceMonitor = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Monitor slow resources
          if (resourceEntry.duration > 1000) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Slow resource detected:', {
                name: resourceEntry.name,
                duration: `${resourceEntry.duration.toFixed(2)}ms`,
                size: resourceEntry.transferSize
              });
            }
          }
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
    
    return () => observer.disconnect();
  }, []);
};