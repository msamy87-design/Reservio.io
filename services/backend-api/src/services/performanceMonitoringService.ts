import newrelic from 'newrelic';
import { logger } from '../utils/logger';

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private isEnabled: boolean = false;

  private constructor() {
    this.isEnabled = process.env.NEW_RELIC_LICENSE_KEY ? true : false;
    
    if (!this.isEnabled) {
      logger.warn('Performance monitoring disabled: NEW_RELIC_LICENSE_KEY not provided');
    } else {
      logger.info('Performance monitoring enabled with New Relic');
    }
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Record custom metric
   */
  public recordMetric(name: string, value: number): void {
    if (!this.isEnabled) return;

    try {
      newrelic.recordMetric(name, value);
      logger.debug(`Custom metric recorded: ${name} = ${value}`);
    } catch (error) {
      logger.error('Failed to record custom metric:', error);
    }
  }

  /**
   * Record custom event
   */
  public recordEvent(eventType: string, attributes: Record<string, any>): void {
    if (!this.isEnabled) return;

    try {
      newrelic.recordCustomEvent(eventType, attributes);
      logger.debug(`Custom event recorded: ${eventType}`, attributes);
    } catch (error) {
      logger.error('Failed to record custom event:', error);
    }
  }

  /**
   * Set user context for current transaction
   */
  public setUser(userId: string, userType: 'customer' | 'business' | 'admin'): void {
    if (!this.isEnabled) return;

    try {
      newrelic.setUserId(userId);
      newrelic.addCustomAttributes({
        'user.id': userId,
        'user.type': userType
      });
    } catch (error) {
      logger.error('Failed to set user context:', error);
    }
  }

  /**
   * Track business metrics
   */
  public trackBusinessMetric(businessId: string, metric: string, value: number): void {
    if (!this.isEnabled) return;

    this.recordEvent('BusinessMetric', {
      businessId,
      metric,
      value,
      timestamp: new Date().toISOString()
    });

    this.recordMetric(`Custom/Business/${metric}`, value);
  }

  /**
   * Track booking events
   */
  public trackBookingEvent(event: 'created' | 'confirmed' | 'cancelled' | 'completed', bookingData: {
    bookingId: string;
    businessId: string;
    customerId: string;
    serviceId: string;
    price: number;
    duration: number;
  }): void {
    if (!this.isEnabled) return;

    this.recordEvent('BookingEvent', {
      event,
      ...bookingData,
      timestamp: new Date().toISOString()
    });

    // Increment booking counters
    this.recordMetric(`Custom/Bookings/${event}`, 1);
    
    if (event === 'created') {
      this.recordMetric('Custom/Revenue/BookingValue', bookingData.price);
      this.recordMetric('Custom/Services/AverageDuration', bookingData.duration);
    }
  }

  /**
   * Track authentication events
   */
  public trackAuthEvent(event: 'login' | 'signup' | 'logout' | 'password_reset', userType: 'customer' | 'business' | 'admin', success: boolean, userId?: string): void {
    if (!this.isEnabled) return;

    this.recordEvent('AuthEvent', {
      event,
      userType,
      success,
      userId,
      timestamp: new Date().toISOString()
    });

    this.recordMetric(`Custom/Auth/${event}/${success ? 'success' : 'failure'}`, 1);
  }

  /**
   * Track custom events (generic)
   */
  public trackCustomEvent(eventType: string, eventData: Record<string, any> = {}): void {
    if (!this.isEnabled) return;

    this.recordEvent('CustomEvent', {
      eventType,
      ...eventData,
      timestamp: new Date().toISOString()
    });

    this.recordMetric(`Custom/Events/${eventType}`, 1);
  }

  /**
   * Track API performance
   */
  public trackAPIPerformance(endpoint: string, method: string, statusCode: number, responseTime: number): void {
    if (!this.isEnabled) return;

    this.recordEvent('APIPerformance', {
      endpoint,
      method,
      statusCode,
      responseTime,
      timestamp: new Date().toISOString()
    });

    this.recordMetric(`Custom/API/ResponseTime/${endpoint}`, responseTime);
    this.recordMetric(`Custom/API/Requests/${statusCode >= 200 && statusCode < 300 ? 'success' : 'error'}`, 1);
  }

  /**
   * Track database performance
   */
  public trackDatabaseQuery(operation: string, collection: string, duration: number, success: boolean): void {
    if (!this.isEnabled) return;

    this.recordEvent('DatabaseQuery', {
      operation,
      collection,
      duration,
      success,
      timestamp: new Date().toISOString()
    });

    this.recordMetric(`Custom/Database/${operation}/${collection}`, duration);
    this.recordMetric(`Custom/Database/Queries/${success ? 'success' : 'error'}`, 1);
  }

  /**
   * Track search performance
   */
  public trackSearchPerformance(query: string, results: number, duration: number): void {
    if (!this.isEnabled) return;

    this.recordEvent('SearchPerformance', {
      query: query.length > 100 ? query.substring(0, 100) + '...' : query,
      resultCount: results,
      duration,
      timestamp: new Date().toISOString()
    });

    this.recordMetric('Custom/Search/Duration', duration);
    this.recordMetric('Custom/Search/Results', results);
  }

  /**
   * Track cache performance
   */
  public trackCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, duration?: number): void {
    if (!this.isEnabled) return;

    const eventData: any = {
      operation,
      key: key.length > 50 ? key.substring(0, 50) + '...' : key,
      timestamp: new Date().toISOString()
    };

    if (duration !== undefined) {
      eventData.duration = duration;
    }

    this.recordEvent('CacheOperation', eventData);
    this.recordMetric(`Custom/Cache/${operation}`, 1);

    if (duration !== undefined) {
      this.recordMetric('Custom/Cache/Duration', duration);
    }
  }

  /**
   * Track error events
   */
  public trackError(error: Error, context: {
    userId?: string;
    endpoint?: string;
    userType?: string;
    additionalData?: Record<string, any>;
  }): void {
    if (!this.isEnabled) return;

    // Record to New Relic
    newrelic.noticeError(error, context.additionalData);

    // Record custom event
    this.recordEvent('ApplicationError', {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context,
      timestamp: new Date().toISOString()
    });

    this.recordMetric('Custom/Errors/Total', 1);
  }

  /**
   * Start custom timing
   */
  public startTiming(name: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(`Custom/Timing/${name}`, duration);
      
      logger.debug(`Custom timing recorded: ${name} = ${duration}ms`);
    };
  }

  /**
   * Create middleware for Express to automatically track requests
   */
  public createMiddleware() {
    return (req: any, res: any, next: any) => {
      if (!this.isEnabled) {
        return next();
      }

      const startTime = Date.now();
      
      // Add custom attributes to New Relic
      newrelic.addCustomAttributes({
        'request.path': req.path,
        'request.method': req.method,
        'request.userAgent': req.get('User-Agent') || 'unknown'
      });

      // Track user if authenticated
      if (req.user) {
        this.setUser(req.user.id, req.user.role || 'unknown');
      }

      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = function(this: any, ...args: any[]) {
        const responseTime = Date.now() - startTime;
        
        // Track API performance
        PerformanceMonitoringService.getInstance().trackAPIPerformance(
          req.route?.path || req.path,
          req.method,
          res.statusCode,
          responseTime
        );

        // Call original end method
        originalEnd.apply(this, args);
      };

      next();
    };
  }

  /**
   * Create database middleware for Mongoose
   */
  public createDatabaseMiddleware() {
    return {
      pre: (operation: string) => (next: any) => {
        const startTime = Date.now();
        
        // Store start time on the query/document
        (this as any).__performanceStartTime = startTime;
        (this as any).__performanceOperation = operation;
        
        next();
      },
      
      post: (next: any) => {
        const duration = Date.now() - ((this as any).__performanceStartTime || 0);
        const operation = (this as any).__performanceOperation || 'unknown';
        const collection = (this as any).collection?.name || 'unknown';
        
        PerformanceMonitoringService.getInstance().trackDatabaseQuery(
          operation,
          collection,
          duration,
          true
        );
        
        if (next) next();
      },
      
      error: (error: Error, next: any) => {
        const duration = Date.now() - ((this as any).__performanceStartTime || 0);
        const operation = (this as any).__performanceOperation || 'unknown';
        const collection = (this as any).collection?.name || 'unknown';
        
        PerformanceMonitoringService.getInstance().trackDatabaseQuery(
          operation,
          collection,
          duration,
          false
        );
        
        if (next) next(error);
      }
    };
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    enabled: boolean;
    appName: string;
    environment: string;
  } {
    return {
      enabled: this.isEnabled,
      appName: 'Reservio Backend API',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

// Export singleton instance
export const performanceMonitoring = PerformanceMonitoringService.getInstance();