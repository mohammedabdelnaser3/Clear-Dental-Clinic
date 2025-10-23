declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    } else if (import.meta && import.meta.env && import.meta.env.DEV) {
      console.log('[analytics]', eventName, params);
    }
  } catch (error) {
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      console.warn('[analytics] trackEvent error:', error);
    }
  }
}

export function trackTiming(name: string, value: number, category?: string) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'timing_complete', {
        name,
        value,
        event_category: category,
      });
    } else if (import.meta && import.meta.env && import.meta.env.DEV) {
      console.log('[timing]', { name, value, category });
    }
  } catch (error) {
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      console.warn('[analytics] trackTiming error:', error);
    }
  }
}