import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService';
import { logger } from '../utils/logger';

// Extend Request interface to include analytics methods
declare global {
  namespace Express {
    interface Request {
      analytics: {
        trackEvent: (eventName: string, properties?: Record<string, any>) => Promise<void>;
        trackPageView: (path: string, properties?: Record<string, any>) => Promise<void>;
        trackConversion: (conversionType: string, value?: number, properties?: Record<string, any>) => Promise<void>;
        trackUserAction: (action: string, target: string, properties?: Record<string, any>) => Promise<void>;
        session: any;
      };
    }
  }
}

// Analytics middleware
export const analyticsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Create or retrieve session
    const session = await analyticsService.createSession({
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip,
      userId: (req as any).user?.id,
      referrer: req.get('Referer'),
      sessionId: req.cookies?.sessionId
    });

    // Set session cookie if new
    if (!req.cookies?.sessionId) {
      res.cookie('sessionId', session.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    // Add analytics methods to request object
    req.analytics = {
      session,
      
      // Track custom events
      trackEvent: async (eventName: string, properties: Record<string, any> = {}) => {
        try {
          await analyticsService.trackEvent({
            userId: (req as any).user?.id,
            sessionId: session.sessionId,
            eventName,
            properties: {
              ...properties,
              path: req.path,
              method: req.method,
              userAgent: req.get('User-Agent'),
              ipAddress: req.ip,
              referrer: req.get('Referer')
            },
            metadata: {
              endpoint: req.originalUrl,
              userType: (req as any).user?.role,
              platform: session.platform,
              browser: session.browser,
              country: session.country
            }
          });
        } catch (error) {
          logger.error('Failed to track event:', error);
        }
      },

      // Track page views
      trackPageView: async (path: string, properties: Record<string, any> = {}) => {
        try {
          await analyticsService.trackPageView({
            userId: (req as any).user?.id,
            sessionId: session.sessionId,
            path,
            title: properties.title || '',
            referrer: req.get('Referer'),
            properties: {
              ...properties,
              method: req.method,
              userAgent: req.get('User-Agent'),
              loadTime: properties.loadTime
            },
            metadata: {
              platform: session.platform,
              browser: session.browser,
              screenResolution: properties.screenResolution,
              country: session.country
            }
          });
        } catch (error) {
          logger.error('Failed to track page view:', error);
        }
      },

      // Track conversions
      trackConversion: async (conversionType: string, value: number = 0, properties: Record<string, any> = {}) => {
        try {
          await analyticsService.trackEvent({
            userId: (req as any).user?.id,
            sessionId: session.sessionId,
            eventName: 'conversion',
            properties: {
              conversionType,
              value,
              currency: properties.currency || 'USD',
              ...properties,
              path: req.path,
              method: req.method
            },
            metadata: {
              endpoint: req.originalUrl,
              userType: (req as any).user?.role,
              platform: session.platform,
              browser: session.browser,
              country: session.country
            }
          });
        } catch (error) {
          logger.error('Failed to track conversion:', error);
        }
      },

      // Track user actions
      trackUserAction: async (action: string, target: string, properties: Record<string, any> = {}) => {
        try {
          await analyticsService.trackEvent({
            userId: (req as any).user?.id,
            sessionId: session.sessionId,
            eventName: 'user_action',
            properties: {
              action,
              target,
              ...properties,
              path: req.path,
              method: req.method
            },
            metadata: {
              endpoint: req.originalUrl,
              userType: (req as any).user?.role,
              platform: session.platform,
              browser: session.browser,
              country: session.country
            }
          });
        } catch (error) {
          logger.error('Failed to track user action:', error);
        }
      }
    };

    // Automatically track page views for GET requests
    if (req.method === 'GET' && !req.path.includes('/api/')) {
      await req.analytics.trackPageView(req.path, {
        title: `${req.path} - Reservio`
      });
    }

    next();
  } catch (error) {
    logger.error('Analytics middleware error:', error);
    // Don't block the request if analytics fails
    req.analytics = {
      session: null,
      trackEvent: async () => {},
      trackPageView: async () => {},
      trackConversion: async () => {},
      trackUserAction: async () => {}
    };
    next();
  }
};

// Create analytics routes
export const createAnalyticsRoutes = (express: any) => {
  const router = express.Router();

  // Track custom events endpoint
  router.post('/track', async (req: Request, res: Response) => {
    try {
      const { eventName, properties = {} } = req.body;
      
      if (!eventName) {
        return res.status(400).json({ error: 'Event name is required' });
      }

      await req.analytics.trackEvent(eventName, properties);
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to track custom event:', error);
      res.status(500).json({ error: 'Failed to track event' });
    }
  });

  // Track page view endpoint
  router.post('/pageview', async (req: Request, res: Response) => {
    try {
      const { path, title, properties = {} } = req.body;
      
      if (!path) {
        return res.status(400).json({ error: 'Path is required' });
      }

      await req.analytics.trackPageView(path, { title, ...properties });
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to track page view:', error);
      res.status(500).json({ error: 'Failed to track page view' });
    }
  });

  // Track conversion endpoint
  router.post('/conversion', async (req: Request, res: Response) => {
    try {
      const { conversionType, value, properties = {} } = req.body;
      
      if (!conversionType) {
        return res.status(400).json({ error: 'Conversion type is required' });
      }

      await req.analytics.trackConversion(conversionType, value, properties);
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to track conversion:', error);
      res.status(500).json({ error: 'Failed to track conversion' });
    }
  });

  // Get user behavior analysis
  router.get('/user-behavior/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Check if user has permission to view this data
      if ((req as any).user?.id !== userId && (req as any).user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const behaviorPattern = await analyticsService.analyzeUserBehavior(userId);
      res.json(behaviorPattern);
    } catch (error) {
      logger.error('Failed to get user behavior analysis:', error);
      res.status(500).json({ error: 'Failed to analyze user behavior' });
    }
  });

  // Get business metrics (admin only)
  router.get('/business-metrics/:businessId', async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const { period = '30d' } = req.query;
      
      // Check if user has permission
      if ((req as any).user?.role !== 'admin' && (req as any).user?.businessId !== businessId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const metrics = await analyticsService.generateBusinessMetrics(businessId, period as string);
      res.json(metrics);
    } catch (error) {
      logger.error('Failed to get business metrics:', error);
      res.status(500).json({ error: 'Failed to get business metrics' });
    }
  });

  // Get funnel analysis (admin only)
  router.post('/funnel-analysis', async (req: Request, res: Response) => {
    try {
      // Check admin permission
      if ((req as any).user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { funnelName, steps, timeframe } = req.body;
      
      if (!funnelName || !steps || !Array.isArray(steps)) {
        return res.status(400).json({ error: 'Funnel name and steps array are required' });
      }

      const funnelAnalysis = await analyticsService.analyzeFunnel(funnelName, steps, timeframe || {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      res.json(funnelAnalysis);
    } catch (error) {
      logger.error('Failed to analyze funnel:', error);
      res.status(500).json({ error: 'Failed to analyze funnel' });
    }
  });

  // Get real-time analytics dashboard data (admin only)
  router.get('/dashboard', async (req: Request, res: Response) => {
    try {
      // Check admin permission
      if ((req as any).user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const dashboardData = await analyticsService.getRealTimeDashboardData();
      res.json(dashboardData);
    } catch (error) {
      logger.error('Failed to get dashboard data:', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
    }
  });

  // Get analytics configuration
  router.get('/config', (req: Request, res: Response) => {
    const config = analyticsService.isConfigured();
    res.json({
      configured: config.mixpanel && config.database,
      features: config
    });
  });

  // Health check endpoint
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const stats = await analyticsService.getStats();
      res.json({
        status: 'ok',
        stats,
        configuration: analyticsService.isConfigured()
      });
    } catch (error) {
      logger.error('Analytics health check failed:', error);
      res.status(500).json({ error: 'Analytics service unavailable' });
    }
  });

  return router;
};

// Booking-specific analytics tracking middleware
export const trackBookingAnalytics = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const originalJson = res.json;
      
      res.json = function(body: any) {
        // Track successful booking actions
        if (res.statusCode < 400) {
          req.analytics?.trackEvent('booking_action', {
            action,
            bookingId: body.booking?.id || body.id,
            businessId: body.booking?.businessId || body.businessId,
            serviceId: body.booking?.serviceId || body.serviceId,
            success: true
          });
        }
        
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      logger.error('Booking analytics tracking error:', error);
      next();
    }
  };
};

// Payment-specific analytics tracking middleware
export const trackPaymentAnalytics = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const originalJson = res.json;
      
      res.json = function(body: any) {
        // Track payment events
        if (res.statusCode < 400) {
          req.analytics?.trackConversion('payment', body.amount || 0, {
            action,
            paymentMethod: body.paymentMethod,
            bookingId: body.bookingId,
            businessId: body.businessId,
            currency: body.currency || 'USD'
          });
        }
        
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      logger.error('Payment analytics tracking error:', error);
      next();
    }
  };
};

// User registration analytics tracking
export const trackRegistrationAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // Track successful user registrations
      if (res.statusCode < 400 && body.user) {
        req.analytics?.trackConversion('user_registration', 1, {
          userType: body.user.role,
          registrationMethod: req.body.registrationMethod || 'email',
          referrer: req.get('Referer')
        });
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  } catch (error) {
    logger.error('Registration analytics tracking error:', error);
    next();
  }
};