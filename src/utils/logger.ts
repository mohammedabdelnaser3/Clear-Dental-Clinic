/**
 * Enhanced logging utilities with appropriate log levels
 * Provides structured logging for different environments
 */

export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  /**
   * Set the current log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get the current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LogLevel).find(key => LogLevel[key as keyof typeof LogLevel] === entry.level) || 'UNKNOWN';
    const context = entry.context ? JSON.stringify(entry.context) : '';
    
    return `[${timestamp}] ${levelName}: ${entry.message} ${context}`.trim();
  }

  /**
   * Output log entry to console
   */
  private outputLog(entry: LogEntry): void {
    const formattedMessage = this.formatLogEntry(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.error || '');
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.log(formattedMessage);
        break;
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      context: {
        ...context,
        timestamp: new Date().toISOString()
      }
    };

    if (error) {
      if (error instanceof Error) {
        logEntry.error = error;
        logEntry.stack = error.stack;
      } else {
        logEntry.context = { ...logEntry.context, errorData: error };
      }
    }

    this.outputLog(logEntry);

    // In production, you might want to send errors to a logging service
    if (!this.isDevelopment) {
      this.sendToLoggingService(logEntry);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const logEntry: LogEntry = {
      level: LogLevel.WARN,
      message,
      context: {
        ...context,
        timestamp: new Date().toISOString()
      }
    };

    this.outputLog(logEntry);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const logEntry: LogEntry = {
      level: LogLevel.INFO,
      message,
      context: {
        ...context,
        timestamp: new Date().toISOString()
      }
    };

    this.outputLog(logEntry);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const logEntry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      context: {
        ...context,
        timestamp: new Date().toISOString()
      }
    };

    this.outputLog(logEntry);
  }

  /**
   * Log API call information
   */
  apiCall(method: string, url: string, status?: number, duration?: number, context?: LogContext): void {
    const message = `API ${method.toUpperCase()} ${url}`;
    const apiContext = {
      ...context,
      method,
      url,
      status,
      duration,
      type: 'api_call'
    };

    if (status && status >= 400) {
      this.error(message, undefined, apiContext);
    } else {
      this.info(message, apiContext);
    }
  }

  /**
   * Log user action
   */
  userAction(action: string, userId?: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      userId,
      type: 'user_action',
      action
    });
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    const message = `Performance: ${operation} took ${duration}ms`;
    const perfContext = {
      ...context,
      operation,
      duration,
      type: 'performance'
    };

    if (duration > 1000) {
      this.warn(message, perfContext);
    } else {
      this.debug(message, perfContext);
    }
  }

  /**
   * Send logs to external logging service (placeholder)
   */
  private sendToLoggingService(entry: LogEntry): void {
    // In a real application, you would send logs to a service like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - CloudWatch
    // etc.
    
    // For now, we'll just store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      
      // Keep only last 100 log entries
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store log entry:', error);
    }
  }

  /**
   * Get stored logs (for debugging)
   */
  getStoredLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch (error) {
      console.error('Failed to retrieve stored logs:', error);
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  clearStoredLogs(): void {
    try {
      localStorage.removeItem('app_logs');
    } catch (error) {
      console.error('Failed to clear stored logs:', error);
    }
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Convenience functions for common logging patterns
export const logError = (message: string, error?: Error | any, context?: LogContext) => {
  logger.error(message, error, context);
};

export const logWarn = (message: string, context?: LogContext) => {
  logger.warn(message, context);
};

export const logInfo = (message: string, context?: LogContext) => {
  logger.info(message, context);
};

export const logDebug = (message: string, context?: LogContext) => {
  logger.debug(message, context);
};

export const logApiCall = (method: string, url: string, status?: number, duration?: number, context?: LogContext) => {
  logger.apiCall(method, url, status, duration, context);
};

export const logUserAction = (action: string, userId?: string, context?: LogContext) => {
  logger.userAction(action, userId, context);
};

export const logPerformance = (operation: string, duration: number, context?: LogContext) => {
  logger.performance(operation, duration, context);
};

// Export logger class for advanced usage
export { Logger };
export default logger;