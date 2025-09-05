// Frontend logging utility for structured logging
// Provides consistent logging across the frontend application

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userAgent?: string;
  url?: string;
}

class FrontendLogger {
  private isDevelopment = import.meta.env.DEV;
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatMessage(level, message, data);

    // In development, use console methods for better dev experience
    if (this.isDevelopment) {
      const consoleMethod = console[level] || console.log;
      consoleMethod(`[${level.toUpperCase()}] ${message}`, data || '');
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logEntry));
    }

    // In production, also send critical errors to monitoring service
    if (level === 'error' && !this.isDevelopment) {
      this.sendToMonitoring(logEntry);
    }
  }

  private async sendToMonitoring(logEntry: LogEntry): Promise<void> {
    try {
      // This would integrate with your monitoring service (e.g., Sentry, LogRocket)
      // For now, just store in localStorage for debugging
      const logs = JSON.parse(localStorage.getItem('app_errors') || '[]');
      logs.push(logEntry);
      // Keep only last 50 errors
      if (logs.length > 50) logs.shift();
      localStorage.setItem('app_errors', JSON.stringify(logs));
    } catch (error) {
      // Fallback to console if monitoring fails
      console.error('Failed to send log to monitoring:', error);
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  // Utility method for timing operations
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`Timer [${label}]: ${duration.toFixed(2)}ms`);
    };
  }
}

// Export singleton instance
export const logger = new FrontendLogger();
export default logger;