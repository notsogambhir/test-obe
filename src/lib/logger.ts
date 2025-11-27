// Logger utility for comprehensive error management and logging
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  stack?: string;
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxFileSize: number;
  maxFiles: number;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      enableRemote: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializeLogger();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeLogger(): void {
    // Set up periodic flush to file/remote
    if (this.config.enableFile || this.config.enableRemote) {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, 5000); // Flush every 5 seconds
    }

    // Log initialization
    this.info('Logger initialized', {
      context: 'system',
      metadata: {
        config: this.config,
        sessionId: this.sessionId,
      },
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    const timestamp = entry.timestamp;
    const level = levelNames[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    const userId = entry.userId ? `[User:${entry.userId}]` : '';
    const requestId = entry.requestId ? `[Req:${entry.requestId}]` : '';

    let logMessage = `${timestamp} ${level} ${context}${userId}${requestId} ${entry.message}`;

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      logMessage += `\nMetadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }

    if (entry.stack) {
      logMessage += `\nStack: ${entry.stack}`;
    }

    return logMessage;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    options: {
      context?: string;
      userId?: string;
      requestId?: string;
      stack?: string;
      metadata?: Record<string, any>;
    } = {}
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: options.context,
      userId: options.userId,
      sessionId: this.sessionId,
      requestId: options.requestId,
      stack: options.stack,
      metadata: options.metadata,
    };
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Add to buffer
    this.logBuffer.push(entry);

    // Console logging
    if (this.config.enableConsole) {
      const formattedLog = this.formatLogEntry(entry);
      
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(formattedLog);
          break;
        case LogLevel.WARN:
          console.warn(formattedLog);
          break;
        case LogLevel.INFO:
          console.info(formattedLog);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedLog);
          break;
      }
    }

    // Immediate flush for errors
    if (entry.level === LogLevel.ERROR) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      if (this.config.enableFile) {
        await this.flushToFile(logsToFlush);
      }

      if (this.config.enableRemote && this.config.remoteEndpoint) {
        await this.flushToRemote(logsToFlush);
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Re-add failed logs to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  private async flushToFile(logs: LogEntry[]): Promise<void> {
    // This would be implemented with a file system solution
    // For now, we'll store in localStorage for client-side
    if (typeof window !== 'undefined') {
      const existingLogs = localStorage.getItem('obe_logs') || '[]';
      const allLogs = JSON.parse(existingLogs);
      allLogs.push(...logs);
      
      // Keep only last 1000 logs to prevent storage overflow
      const trimmedLogs = allLogs.slice(-1000);
      localStorage.setItem('obe_logs', JSON.stringify(trimmedLogs));
    }
  }

  private async flushToRemote(logs: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) {
      return;
    }

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Remote logging failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Remote logging error:', error);
      throw error;
    }
  }

  // Public logging methods
  error(message: string, options?: {
    context?: string;
    userId?: string;
    requestId?: string;
    error?: Error;
    metadata?: Record<string, any>;
  }): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, {
      ...options,
      stack: options?.error?.stack,
    });
    this.log(entry);
  }

  warn(message: string, options?: {
    context?: string;
    userId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
  }): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, options);
    this.log(entry);
  }

  info(message: string, options?: {
    context?: string;
    userId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
  }): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, options);
    this.log(entry);
  }

  debug(message: string, options?: {
    context?: string;
    userId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
  }): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, options);
    this.log(entry);
  }

  // Specialized logging methods
  apiError(method: string, url: string, error: any, options?: {
    userId?: string;
    requestId?: string;
    statusCode?: number;
    requestBody?: any;
    responseBody?: any;
  }): void {
    this.error(`API Error: ${method} ${url}`, {
      context: 'api',
      ...options,
      error,
      metadata: {
        method,
        url,
        statusCode: options?.statusCode,
        requestBody: options?.requestBody,
        responseBody: options?.responseBody,
      },
    });
  }

  authError(action: string, error: any, options?: {
    userId?: string;
    email?: string;
    ip?: string;
  }): void {
    this.error(`Authentication Error: ${action}`, {
      context: 'auth',
      ...options,
      error,
      metadata: {
        action,
        email: options?.email,
        ip: options?.ip,
      },
    });
  }

  databaseError(operation: string, error: any, options?: {
    userId?: string;
    query?: string;
    table?: string;
  }): void {
    this.error(`Database Error: ${operation}`, {
      context: 'database',
      ...options,
      error,
      metadata: {
        operation,
        query: options?.query,
        table: options?.table,
      },
    });
  }

  userAction(action: string, options?: {
    userId?: string;
    metadata?: Record<string, any>;
  }): void {
    this.info(`User Action: ${action}`, {
      context: 'user_action',
      ...options,
      metadata: {
        action,
        ...options?.metadata,
      },
    });
  }

  performanceMetric(operation: string, duration: number, options?: {
    userId?: string;
    metadata?: Record<string, any>;
  }): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      context: 'performance',
      ...options,
      metadata: {
        operation,
        duration,
        ...options?.metadata,
      },
    });
  }

  // Utility methods
  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.info(`Log level changed to ${LogLevel[level]}`, {
      context: 'system',
    });
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getLogs(level?: LogLevel): LogEntry[] {
    let logs: LogEntry[] = [];
    
    if (typeof window !== 'undefined') {
      const storedLogs = localStorage.getItem('obe_logs') || '[]';
      logs = JSON.parse(storedLogs);
    }

    if (level !== undefined) {
      logs = logs.filter(log => log.level <= level);
    }

    return logs;
  }

  clearLogs(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('obe_logs');
    }
    this.logBuffer = [];
    this.info('Logs cleared', { context: 'system' });
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(); // Final flush
  }
}

// Create default logger instance
export const logger = new Logger({
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableRemote: false, // Can be enabled in production
});

// Export convenience functions
export const logError = (message: string, options?: Parameters<typeof logger.error>[1]) => 
  logger.error(message, options);

export const logWarn = (message: string, options?: Parameters<typeof logger.warn>[1]) => 
  logger.warn(message, options);

export const logInfo = (message: string, options?: Parameters<typeof logger.info>[1]) => 
  logger.info(message, options);

export const logDebug = (message: string, options?: Parameters<typeof logger.debug>[1]) => 
  logger.debug(message, options);

