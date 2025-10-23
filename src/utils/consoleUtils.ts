/**
 * Console utilities for better error handling and debugging
 */

// Store original console methods
const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log
};

// Known warnings to suppress in production
const SUPPRESS_WARNINGS = [
  'Warning: React does not recognize the',
  'Warning: Failed prop type',
  'Warning: componentWillReceiveProps has been renamed',
  'Warning: componentWillMount has been renamed',
  'Warning: componentWillUpdate has been renamed',
  'defaultProps will be removed',
  'findDOMNode is deprecated',
];

// Known errors to handle gracefully
const KNOWN_ERRORS = [
  'ChunkLoadError',
  'Loading chunk',
  'Loading CSS chunk',
  'ResizeObserver loop limit exceeded',
  'Non-Error promise rejection captured',
];

/**
 * Enhanced console error handler
 */
export const setupConsoleErrorHandling = () => {
  // Override console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Check if it's a known error that we can handle gracefully
    const isKnownError = KNOWN_ERRORS.some(knownError => 
      message.includes(knownError)
    );
    
    if (isKnownError) {
      // Handle known errors more gracefully
      if (message.includes('ChunkLoadError') || message.includes('Loading chunk')) {
        console.warn('🔄 Chunk loading failed, this usually resolves on page refresh');
        return;
      }
      
      if (message.includes('ResizeObserver loop limit exceeded')) {
        // This is a common browser warning that can be safely ignored
        return;
      }
    }
    
    // Log the error normally for other cases
    originalConsole.error(...args);
  };

  // Override console.warn
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // Suppress known React warnings in production
    if (import.meta.env.PROD) {
      const shouldSuppress = SUPPRESS_WARNINGS.some(warning => 
        message.includes(warning)
      );
      
      if (shouldSuppress) {
        return;
      }
    }
    
    // Log the warning normally
    originalConsole.warn(...args);
  };
};

/**
 * Safe console logger that handles errors gracefully
 */
export const safeConsole = {
  log: (...args: any[]) => {
    try {
      originalConsole.log(...args);
    } catch (_error) {
      // Fallback if console.log fails
    }
  },
  
  warn: (...args: any[]) => {
    try {
      originalConsole.warn(...args);
    } catch (_error) {
      // Fallback if console.warn fails
    }
  },
  
  error: (...args: any[]) => {
    try {
      originalConsole.error(...args);
    } catch (_error) {
      // Fallback if console.error fails
    }
  },
  
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) {
      try {
        originalConsole.log('🐛', ...args);
      } catch (_error) {
        // Fallback if console.log fails
      }
    }
  },
  
  api: (method: string, url: string, data?: any) => {
    if (import.meta.env.DEV) {
      try {
        originalConsole.log(`🔍 API ${method.toUpperCase()}:`, url, data ? { data } : '');
      } catch (_error) {
        // Fallback if console.log fails
      }
    }
  }
};

/**
 * Error reporter for production environments
 */
export const reportError = (error: Error, context?: string) => {
  // In development, log to console
  if (import.meta.env.DEV) {
    safeConsole.error(`Error in ${context || 'Unknown'}:`, error);
    return;
  }
  
  // In production, you could send to error reporting service
  // Example: Sentry, LogRocket, etc.
  try {
    // Replace with your error reporting service
    // Sentry.captureException(error, { tags: { context } });
    
    // For now, just log silently
    safeConsole.error('Production error:', error.message);
  } catch (_reportingError) {
    // Silently fail if error reporting fails
  }
};

/**
 * Debounced console logger to prevent spam
 */
const logCache = new Map<string, number>();

export const debouncedLog = (key: string, message: any, delay: number = 1000) => {
  const now = Date.now();
  const lastLog = logCache.get(key) || 0;
  
  if (now - lastLog > delay) {
    safeConsole.log(message);
    logCache.set(key, now);
  }
};

/**
 * Clean up console overrides (useful for testing)
 */
export const restoreConsole = () => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.log = originalConsole.log;
};

export default {
  setupConsoleErrorHandling,
  safeConsole,
  reportError,
  debouncedLog,
  restoreConsole
};
