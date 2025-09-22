// Simple logger utility for the application
// In production, consider using a more robust logging library like Winston

interface LogLevel {
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
  DEBUG: 'debug';
}

const LOG_LEVEL: LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug'
};

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (meta && typeof meta === 'object') {
      return `${baseMessage} ${JSON.stringify(meta)}`;
    }
    
    return baseMessage;
  }

  /**
   * Log info message
   */
  info(message: string, meta?: any): void {
    const formattedMessage = this.formatMessage(LOG_LEVEL.INFO, message, meta);
    console.log(formattedMessage);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: any): void {
    const formattedMessage = this.formatMessage(LOG_LEVEL.WARN, message, meta);
    console.warn(formattedMessage);
  }

  /**
   * Log error message
   */
  error(message: string, error?: any): void {
    const formattedMessage = this.formatMessage(LOG_LEVEL.ERROR, message);
    console.error(formattedMessage);
    
    if (error) {
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined
        });
      } else {
        console.error('Error details:', error);
      }
    }
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage(LOG_LEVEL.DEBUG, message, meta);
      console.debug(formattedMessage);
    }
  }

  /**
   * Log HTTP request details
   */
  request(method: string, url: string, statusCode: number, responseTime?: number): void {
    const message = `${method} ${url} ${statusCode}${responseTime ? ` - ${responseTime}ms` : ''}`;
    this.info(message);
  }

  /**
   * Log database operations
   */
  database(operation: string, collection?: string, duration?: number): void {
    const message = `DB ${operation}${collection ? ` on ${collection}` : ''}${duration ? ` - ${duration}ms` : ''}`;
    this.debug(message);
  }

  /**
   * Log authentication events
   */
  auth(event: string, userId?: string, email?: string): void {
    const message = `Auth: ${event}${userId ? ` - User: ${userId}` : ''}${email ? ` - Email: ${email}` : ''}`;
    this.info(message);
  }

  /**
   * Log appointment events
   */
  appointment(event: string, appointmentId: string, patientId?: string): void {
    const message = `Appointment: ${event} - ID: ${appointmentId}${patientId ? ` - Patient: ${patientId}` : ''}`;
    this.info(message);
  }

  /**
   * Log notification events
   */
  notification(event: string, type: string, userId?: string): void {
    const message = `Notification: ${event} - Type: ${type}${userId ? ` - User: ${userId}` : ''}`;
    this.info(message);
  }

  /**
   * Log system events
   */
  system(event: string, details?: any): void {
    const message = `System: ${event}`;
    this.info(message, details);
  }
}

// Create and export a singleton instance
const logger = new Logger();

export default logger;

// Also export the logger class for custom instances if needed
export { Logger };
