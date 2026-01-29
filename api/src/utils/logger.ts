/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Log context
 */
export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

/**
 * Logger utility for Cloudflare Workers
 */
export class Logger {
  private level: LogLevel;
  private context: LogContext;

  constructor(level: LogLevel = LogLevel.INFO, context?: LogContext) {
    this.level = level;
    this.context = context || {};
  }

  /**
   * Set logger context
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Format log message
   */
  private format(
    level: LogLevel,
    message: string,
    data?: any
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr =
      Object.keys(this.context).length > 0
        ? ` ${JSON.stringify(this.context)}`
        : '';

    let logLine = `[${timestamp}] ${level} ${message}${contextStr}`;

    if (data) {
      logLine += ` ${JSON.stringify(data)}`;
    }

    return logLine;
  }

  /**
   * Debug log
   */
  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.format(LogLevel.DEBUG, message, data));
    }
  }

  /**
   * Info log
   */
  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.format(LogLevel.INFO, message, data));
    }
  }

  /**
   * Warn log
   */
  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.format(LogLevel.WARN, message, data));
    }
  }

  /**
   * Error log
   */
  error(message: string, error?: Error | any, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      let errorStr = '';
      if (error instanceof Error) {
        errorStr = ` ${error.message} ${error.stack || ''}`;
      } else if (error) {
        errorStr = ` ${JSON.stringify(error)}`;
      }

      console.error(this.format(LogLevel.ERROR, message + errorStr, data));
    }
  }

  /**
   * Check if should log at given level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(this.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger(this.level, { ...this.context, ...context });
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger;

/**
 * Initialize logger
 */
export function initializeLogger(
  level: LogLevel = LogLevel.INFO,
  context?: LogContext
): Logger {
  globalLogger = new Logger(level, context);
  return globalLogger;
}

/**
 * Get logger instance
 */
export function getLogger(context?: LogContext): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(LogLevel.INFO, context);
  }
  if (context) {
    return globalLogger.child(context);
  }
  return globalLogger;
}

/**
 * Convenience functions
 */
export const log = {
  debug: (message: string, data?: any) => getLogger().debug(message, data),
  info: (message: string, data?: any) => getLogger().info(message, data),
  warn: (message: string, data?: any) => getLogger().warn(message, data),
  error: (message: string, error?: Error | any, data?: any) =>
    getLogger().error(message, error, data),
};
