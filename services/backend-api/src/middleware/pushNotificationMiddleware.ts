import { Request, Response, NextFunction } from 'express';
import { pushNotificationService } from '../services/pushNotificationService';
import { performanceMonitoring } from '../services/performanceMonitoringService';

declare global {
  namespace Express {
    interface Request {
      pushNotifications?: {
        sendNotification: (payload: any, options?: any) => Promise<any>;
        sendBookingConfirmation: (bookingData: any) => Promise<void>;
        sendBookingReminder: (bookingData: any) => Promise<void>;
        subscribe: (subscription: any) => Promise<any>;
        unsubscribe: (subscriptionId?: string) => Promise<void>;
        addFCMToken: (tokenData: any) => Promise<any>;
      };
    }
  }
}

export const pushNotificationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const userId = req.user?.id;

  if (!userId) {
    // Skip if no authenticated user
    return next();
  }

  req.pushNotifications = {
    async sendNotification(payload: any, options: any = {}) {
      try {
        return await pushNotificationService.sendNotification(userId, payload, options);
      } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
      }
    },

    async sendBookingConfirmation(bookingData: any) {
      try {
        await pushNotificationService.sendBookingConfirmation(userId, bookingData);
      } catch (error) {
        console.error('Error sending booking confirmation:', error);
      }
    },

    async sendBookingReminder(bookingData: any) {
      try {
        await pushNotificationService.sendBookingReminder(userId, bookingData);
      } catch (error) {
        console.error('Error sending booking reminder:', error);
      }
    },

    async subscribe(subscription: any) {
      try {
        return await pushNotificationService.subscribeUser(userId, {
          ...subscription,
          userAgent: req.get('User-Agent')
        });
      } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        throw error;
      }
    },

    async unsubscribe(subscriptionId?: string) {
      try {
        await pushNotificationService.unsubscribeUser(userId, subscriptionId);
      } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        throw error;
      }
    },

    async addFCMToken(tokenData: any) {
      try {
        return await pushNotificationService.addFCMToken(userId, tokenData);
      } catch (error) {
        console.error('Error adding FCM token:', error);
        throw error;
      }
    }
  };

  // Track performance
  performanceMonitoring.trackCustomEvent('push_notification_middleware', {
    duration: Date.now() - startTime,
    userId: userId.slice(0, 8) // Partial hash for privacy
  });

  next();
};

// API routes for push notifications
export const createPushNotificationRoutes = (app: any) => {
  const router = app.Router();

  // Subscribe to web push notifications
  router.post('/subscribe', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const subscription = await pushNotificationService.subscribeUser(req.user.id, {
        ...req.body,
        platform: 'web',
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        subscription: {
          id: subscription.id,
          createdAt: subscription.createdAt
        }
      });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to subscribe' 
      });
    }
  });

  // Unsubscribe from notifications
  router.delete('/subscribe/:subscriptionId?', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      await pushNotificationService.unsubscribeUser(req.user.id, req.params.subscriptionId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to unsubscribe' 
      });
    }
  });

  // Add FCM token (mobile apps)
  router.post('/fcm-token', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = await pushNotificationService.addFCMToken(req.user.id, req.body);
      res.json({
        success: true,
        token: {
          id: token.id,
          createdAt: token.createdAt
        }
      });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to add FCM token' 
      });
    }
  });

  // Send custom notification (admin only)
  router.post('/send', async (req: Request, res: Response) => {
    try {
      // Check admin permissions (implement based on your auth system)
      if (!req.user?.role || !['admin', 'business_owner'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { userIds, payload, options } = req.body;
      const result = await pushNotificationService.sendNotification(userIds, payload, options);
      
      res.json({
        success: true,
        result: {
          sent: result.success,
          failed: result.failed,
          total: userIds.length
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to send notification' 
      });
    }
  });

  // Send booking confirmation
  router.post('/booking/confirmed', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      await pushNotificationService.sendBookingConfirmation(req.user.id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to send confirmation' 
      });
    }
  });

  // Send booking reminder
  router.post('/booking/reminder', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      await pushNotificationService.sendBookingReminder(req.user.id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to send reminder' 
      });
    }
  });

  // Get notification templates
  router.get('/templates', async (req: Request, res: Response) => {
    try {
      const templates = Array.from((pushNotificationService as any).templates.values());
      res.json({ templates });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get templates' 
      });
    }
  });

  // Create notification template (admin only)
  router.post('/templates', async (req: Request, res: Response) => {
    try {
      if (!req.user?.role || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const template = await pushNotificationService.createTemplate(req.body);
      res.json({ template });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to create template' 
      });
    }
  });

  // Get notification history
  router.get('/history', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const history = await pushNotificationService.getNotificationHistory(req.user.id, limit);
      
      res.json({ history });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get history' 
      });
    }
  });

  // Get notification stats (admin only)
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      if (!req.user?.role || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const stats = await pushNotificationService.getNotificationStats();
      const config = pushNotificationService.isConfigured();
      
      res.json({ 
        stats,
        configuration: config
      });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get stats' 
      });
    }
  });

  // VAPID public key endpoint (for web push registration)
  router.get('/vapid-public-key', (req: Request, res: Response) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(404).json({ error: 'VAPID public key not configured' });
    }
    res.json({ publicKey });
  });

  // Webhook for notification delivery reports
  router.post('/delivery-report', async (req: Request, res: Response) => {
    try {
      // Handle delivery reports from push notification services
      const { notificationId, status, timestamp } = req.body;
      
      // Update notification status in history
      const history = (pushNotificationService as any).history;
      const notification = history.find((h: any) => h.id === notificationId);
      
      if (notification) {
        notification.status = status;
        if (status === 'delivered') {
          notification.deliveredAt = new Date(timestamp);
        } else if (status === 'clicked') {
          notification.clickedAt = new Date(timestamp);
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to process delivery report' 
      });
    }
  });

  return router;
};

// Booking integration middleware
export const enhanceBookingWithNotifications = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function(body: any) {
      // Auto-send notifications for booking events
      if (req.method === 'POST' && req.path.includes('/bookings') && body.booking) {
        // Booking created - send confirmation
        if (req.pushNotifications) {
          req.pushNotifications.sendBookingConfirmation({
            id: body.booking.id,
            serviceName: body.booking.service?.name || 'Service',
            businessName: body.booking.business?.name || 'Business',
            dateTime: new Date(body.booking.scheduledFor),
            duration: body.booking.duration || 60,
            price: body.booking.price || 0
          }).catch(console.error);
        }
      }

      return originalJson.call(this, body);
    };

    next();
  };
};