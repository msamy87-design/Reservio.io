import webpush from 'web-push';
import { admin } from 'firebase-admin';
import { cacheService } from './cacheService';
import { performanceMonitoring } from './performanceMonitoringService';
import { logger } from '../utils/logger';

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  platform: 'web' | 'android' | 'ios';
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  actions?: NotificationAction[];
  data?: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface FCMToken {
  id: string;
  userId: string;
  token: string;
  platform: 'android' | 'ios';
  appVersion?: string;
  deviceId?: string;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'booking_confirmed' | 'booking_reminder' | 'booking_cancelled' | 'payment_received' | 'promotion' | 'custom';
  title: string;
  body: string;
  icon?: string;
  actions?: NotificationAction[];
  scheduling?: {
    delay?: number; // milliseconds
    timezone?: string;
  };
  targeting?: {
    userTypes?: string[];
    platforms?: string[];
    customConditions?: Record<string, any>;
  };
}

export interface NotificationHistory {
  id: string;
  userId: string;
  templateId?: string;
  payload: NotificationPayload;
  platform: 'web' | 'android' | 'ios';
  status: 'sent' | 'delivered' | 'clicked' | 'failed';
  error?: string;
  sentAt: Date;
  deliveredAt?: Date;
  clickedAt?: Date;
}

export class PushNotificationService {
  private subscriptions = new Map<string, PushSubscription[]>();
  private fcmTokens = new Map<string, FCMToken[]>();
  private templates = new Map<string, NotificationTemplate>();
  private history: NotificationHistory[] = [];
  private isWebPushConfigured = false;
  private isFCMConfigured = false;

  constructor() {
    this.initializeWebPush();
    this.initializeFCM();
    this.loadTemplates();
  }

  private initializeWebPush(): void {
    try {
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@reservio.com';

      if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        this.isWebPushConfigured = true;
        logger.info('Web Push notifications configured');
      } else {
        logger.warn('Web Push not configured: Missing VAPID keys');
      }
    } catch (error) {
      logger.error('Failed to configure Web Push:', error);
    }
  }

  private initializeFCM(): void {
    try {
      const serviceAccountPath = process.env.FCM_SERVICE_ACCOUNT_PATH;
      const serviceAccountKey = process.env.FCM_SERVICE_ACCOUNT_KEY;

      if (serviceAccountPath || serviceAccountKey) {
        const credential = serviceAccountKey 
          ? admin.credential.cert(JSON.parse(serviceAccountKey))
          : admin.credential.cert(serviceAccountPath!);

        admin.initializeApp({
          credential,
          projectId: process.env.FCM_PROJECT_ID
        });

        this.isFCMConfigured = true;
        logger.info('Firebase Cloud Messaging configured');
      } else {
        logger.warn('FCM not configured: Missing service account credentials');
      }
    } catch (error) {
      logger.error('Failed to configure FCM:', error);
    }
  }

  // Subscription Management
  async subscribeUser(userId: string, subscription: Partial<PushSubscription>): Promise<PushSubscription> {
    const newSubscription: PushSubscription = {
      id: this.generateId(),
      userId,
      endpoint: subscription.endpoint!,
      keys: subscription.keys!,
      userAgent: subscription.userAgent,
      platform: subscription.platform || 'web',
      createdAt: new Date(),
      lastUsed: new Date(),
      isActive: true
    };

    const userSubscriptions = this.subscriptions.get(userId) || [];
    
    // Remove existing subscription with same endpoint
    const filteredSubscriptions = userSubscriptions.filter(s => s.endpoint !== subscription.endpoint);
    filteredSubscriptions.push(newSubscription);
    
    this.subscriptions.set(userId, filteredSubscriptions);

    // Cache subscription
    await cacheService.set(`push:subscription:${newSubscription.id}`, newSubscription, {
      ttl: 86400 * 30, // 30 days
      tags: ['push_notifications', `user:${userId}`]
    });

    performanceMonitoring.trackCustomEvent('push_subscription_created', {
      userId: this.hashUserId(userId),
      platform: newSubscription.platform
    });

    return newSubscription;
  }

  async unsubscribeUser(userId: string, subscriptionId?: string): Promise<void> {
    const userSubscriptions = this.subscriptions.get(userId) || [];
    
    if (subscriptionId) {
      // Remove specific subscription
      const filtered = userSubscriptions.filter(s => s.id !== subscriptionId);
      this.subscriptions.set(userId, filtered);
      await cacheService.delete(`push:subscription:${subscriptionId}`);
    } else {
      // Remove all subscriptions for user
      userSubscriptions.forEach(async (sub) => {
        await cacheService.delete(`push:subscription:${sub.id}`);
      });
      this.subscriptions.delete(userId);
    }

    performanceMonitoring.trackCustomEvent('push_subscription_removed', {
      userId: this.hashUserId(userId),
      subscriptionId
    });
  }

  async addFCMToken(userId: string, token: Partial<FCMToken>): Promise<FCMToken> {
    const newToken: FCMToken = {
      id: this.generateId(),
      userId,
      token: token.token!,
      platform: token.platform!,
      appVersion: token.appVersion,
      deviceId: token.deviceId,
      createdAt: new Date(),
      lastUsed: new Date(),
      isActive: true
    };

    const userTokens = this.fcmTokens.get(userId) || [];
    
    // Remove existing token if exists
    const filteredTokens = userTokens.filter(t => t.token !== token.token);
    filteredTokens.push(newToken);
    
    this.fcmTokens.set(userId, filteredTokens);

    // Cache token
    await cacheService.set(`push:fcm_token:${newToken.id}`, newToken, {
      ttl: 86400 * 30, // 30 days
      tags: ['push_notifications', `user:${userId}`]
    });

    return newToken;
  }

  // Template Management
  async createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: this.generateId()
    };

    this.templates.set(newTemplate.id, newTemplate);
    
    await cacheService.set(`push:template:${newTemplate.id}`, newTemplate, {
      ttl: 86400 * 7, // 1 week
      tags: ['push_templates']
    });

    return newTemplate;
  }

  getTemplate(templateId: string): NotificationTemplate | null {
    return this.templates.get(templateId) || null;
  }

  // Notification Sending
  async sendNotification(
    userId: string | string[],
    payload: NotificationPayload,
    options: {
      templateId?: string;
      platforms?: ('web' | 'android' | 'ios')[];
      scheduling?: { delay?: number; timezone?: string };
    } = {}
  ): Promise<{ success: number; failed: number; results: any[] }> {
    const userIds = Array.isArray(userId) ? userId : [userId];
    const platforms = options.platforms || ['web', 'android', 'ios'];
    
    let success = 0;
    let failed = 0;
    const results: any[] = [];

    for (const uid of userIds) {
      // Web Push Notifications
      if (platforms.includes('web') && this.isWebPushConfigured) {
        const webResult = await this.sendWebPushNotification(uid, payload, options);
        results.push(...webResult.results);
        success += webResult.success;
        failed += webResult.failed;
      }

      // Mobile Push Notifications (FCM)
      if ((platforms.includes('android') || platforms.includes('ios')) && this.isFCMConfigured) {
        const fcmResult = await this.sendFCMNotification(uid, payload, platforms, options);
        results.push(...fcmResult.results);
        success += fcmResult.success;
        failed += fcmResult.failed;
      }
    }

    performanceMonitoring.trackCustomEvent('push_notification_batch_sent', {
      userCount: userIds.length,
      success,
      failed,
      platforms: platforms.join(',')
    });

    return { success, failed, results };
  }

  private async sendWebPushNotification(
    userId: string,
    payload: NotificationPayload,
    options: any
  ): Promise<{ success: number; failed: number; results: any[] }> {
    const subscriptions = this.subscriptions.get(userId) || [];
    const webSubscriptions = subscriptions.filter(s => s.platform === 'web' && s.isActive);

    if (webSubscriptions.length === 0) {
      return { success: 0, failed: 0, results: [] };
    }

    let success = 0;
    let failed = 0;
    const results: any[] = [];

    for (const subscription of webSubscriptions) {
      try {
        const webpushPayload = {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/badge-72x72.png',
          image: payload.image,
          data: {
            url: payload.url,
            ...payload.data
          },
          actions: payload.actions,
          tag: payload.tag,
          requireInteraction: payload.requireInteraction,
          silent: payload.silent
        };

        const result = await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          },
          JSON.stringify(webpushPayload),
          {
            vapidDetails: {
              subject: process.env.VAPID_SUBJECT || 'mailto:admin@reservio.com',
              publicKey: process.env.VAPID_PUBLIC_KEY!,
              privateKey: process.env.VAPID_PRIVATE_KEY!
            },
            TTL: 24 * 60 * 60, // 24 hours
            urgency: 'normal'
          }
        );

        success++;
        results.push({ platform: 'web', subscriptionId: subscription.id, success: true });

        // Update last used
        subscription.lastUsed = new Date();

        // Record history
        await this.recordNotificationHistory({
          userId,
          templateId: options.templateId,
          payload,
          platform: 'web',
          status: 'sent'
        });

      } catch (error: any) {
        failed++;
        results.push({ 
          platform: 'web', 
          subscriptionId: subscription.id, 
          success: false, 
          error: error.message 
        });

        // Handle expired/invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          subscription.isActive = false;
        }

        await this.recordNotificationHistory({
          userId,
          templateId: options.templateId,
          payload,
          platform: 'web',
          status: 'failed',
          error: error.message
        });

        logger.error('Web push notification failed:', {
          userId: this.hashUserId(userId),
          error: error.message,
          statusCode: error.statusCode
        });
      }
    }

    return { success, failed, results };
  }

  private async sendFCMNotification(
    userId: string,
    payload: NotificationPayload,
    platforms: ('android' | 'ios')[],
    options: any
  ): Promise<{ success: number; failed: number; results: any[] }> {
    const tokens = this.fcmTokens.get(userId) || [];
    const targetTokens = tokens.filter(t => 
      platforms.includes(t.platform) && t.isActive
    );

    if (targetTokens.length === 0) {
      return { success: 0, failed: 0, results: [] };
    }

    let success = 0;
    let failed = 0;
    const results: any[] = [];

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.image
        },
        data: {
          url: payload.url || '',
          ...payload.data
        },
        tokens: targetTokens.map(t => t.token)
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      response.responses.forEach((res, index) => {
        const token = targetTokens[index];
        if (res.success) {
          success++;
          results.push({ 
            platform: token.platform, 
            tokenId: token.id, 
            success: true 
          });
          
          // Update last used
          token.lastUsed = new Date();
        } else {
          failed++;
          results.push({ 
            platform: token.platform, 
            tokenId: token.id, 
            success: false, 
            error: res.error?.message 
          });

          // Handle invalid tokens
          if (res.error?.code === 'messaging/registration-token-not-registered') {
            token.isActive = false;
          }
        }
      });

      // Record history for each platform
      for (const platform of ['android', 'ios'] as const) {
        if (platforms.includes(platform)) {
          await this.recordNotificationHistory({
            userId,
            templateId: options.templateId,
            payload,
            platform,
            status: success > 0 ? 'sent' : 'failed'
          });
        }
      }

    } catch (error: any) {
      failed = targetTokens.length;
      results.push({ 
        platform: 'fcm', 
        success: false, 
        error: error.message 
      });

      logger.error('FCM notification failed:', {
        userId: this.hashUserId(userId),
        error: error.message
      });
    }

    return { success, failed, results };
  }

  // Booking-specific notification helpers
  async sendBookingConfirmation(
    userId: string,
    bookingData: {
      id: string;
      serviceName: string;
      businessName: string;
      dateTime: Date;
      duration: number;
      price: number;
    }
  ): Promise<void> {
    const template = this.getTemplate('booking_confirmed') || {
      title: 'Booking Confirmed! 🎉',
      body: `Your appointment for {{serviceName}} at {{businessName}} is confirmed for {{dateTime}}`,
      icon: '/icons/booking-confirmed.png',
      actions: [
        { action: 'view', title: 'View Details', icon: '/icons/view.png' },
        { action: 'calendar', title: 'Add to Calendar', icon: '/icons/calendar.png' }
      ]
    };

    const payload: NotificationPayload = {
      title: template.title,
      body: this.interpolateTemplate(template.body, {
        serviceName: bookingData.serviceName,
        businessName: bookingData.businessName,
        dateTime: this.formatDateTime(bookingData.dateTime),
        duration: `${bookingData.duration} min`,
        price: `$${bookingData.price}`
      }),
      icon: template.icon,
      url: `/bookings/${bookingData.id}`,
      actions: template.actions,
      data: { bookingId: bookingData.id, type: 'booking_confirmed' },
      tag: `booking-${bookingData.id}`
    };

    await this.sendNotification(userId, payload, { templateId: 'booking_confirmed' });
  }

  async sendBookingReminder(
    userId: string,
    bookingData: {
      id: string;
      serviceName: string;
      businessName: string;
      dateTime: Date;
    }
  ): Promise<void> {
    const template = this.getTemplate('booking_reminder') || {
      title: 'Upcoming Appointment Reminder ⏰',
      body: `Your appointment for {{serviceName}} at {{businessName}} is tomorrow at {{time}}`,
      icon: '/icons/reminder.png',
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'reschedule', title: 'Reschedule' }
      ]
    };

    const payload: NotificationPayload = {
      title: template.title,
      body: this.interpolateTemplate(template.body, {
        serviceName: bookingData.serviceName,
        businessName: bookingData.businessName,
        time: this.formatTime(bookingData.dateTime)
      }),
      icon: template.icon,
      url: `/bookings/${bookingData.id}`,
      actions: template.actions,
      data: { bookingId: bookingData.id, type: 'booking_reminder' },
      tag: `reminder-${bookingData.id}`,
      requireInteraction: true
    };

    await this.sendNotification(userId, payload, { templateId: 'booking_reminder' });
  }

  // Analytics and History
  private async recordNotificationHistory(
    data: Omit<NotificationHistory, 'id' | 'sentAt'>
  ): Promise<void> {
    const record: NotificationHistory = {
      ...data,
      id: this.generateId(),
      sentAt: new Date()
    };

    this.history.push(record);

    // Cache recent history
    await cacheService.set(`push:history:${record.id}`, record, {
      ttl: 86400 * 7, // 1 week
      tags: ['push_history', `user:${data.userId}`]
    });
  }

  async getNotificationHistory(
    userId: string,
    limit: number = 50
  ): Promise<NotificationHistory[]> {
    return this.history
      .filter(h => h.userId === userId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, limit);
  }

  async getNotificationStats(): Promise<{
    totalSubscriptions: number;
    totalTokens: number;
    totalSent: number;
    totalDelivered: number;
    totalClicked: number;
    totalFailed: number;
    platformBreakdown: Record<string, number>;
  }> {
    const totalSubscriptions = Array.from(this.subscriptions.values())
      .flat()
      .filter(s => s.isActive).length;

    const totalTokens = Array.from(this.fcmTokens.values())
      .flat()
      .filter(t => t.isActive).length;

    const totalSent = this.history.filter(h => h.status === 'sent').length;
    const totalDelivered = this.history.filter(h => h.status === 'delivered').length;
    const totalClicked = this.history.filter(h => h.status === 'clicked').length;
    const totalFailed = this.history.filter(h => h.status === 'failed').length;

    const platformBreakdown = this.history.reduce((acc, h) => {
      acc[h.platform] = (acc[h.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSubscriptions,
      totalTokens,
      totalSent,
      totalDelivered,
      totalClicked,
      totalFailed,
      platformBreakdown
    };
  }

  // Utility Methods
  private interpolateTemplate(template: string, data: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match);
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private hashUserId(userId: string): string {
    // Simple hash for privacy in logs
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private async loadTemplates(): Promise<void> {
    // Load default templates
    const defaultTemplates: Omit<NotificationTemplate, 'id'>[] = [
      {
        name: 'Booking Confirmed',
        type: 'booking_confirmed',
        title: 'Booking Confirmed! 🎉',
        body: 'Your appointment for {{serviceName}} at {{businessName}} is confirmed for {{dateTime}}',
        icon: '/icons/booking-confirmed.png',
        actions: [
          { action: 'view', title: 'View Details', icon: '/icons/view.png' },
          { action: 'calendar', title: 'Add to Calendar', icon: '/icons/calendar.png' }
        ]
      },
      {
        name: 'Booking Reminder',
        type: 'booking_reminder',
        title: 'Upcoming Appointment Reminder ⏰',
        body: 'Your appointment for {{serviceName}} at {{businessName}} is tomorrow at {{time}}',
        icon: '/icons/reminder.png',
        actions: [
          { action: 'view', title: 'View Details' },
          { action: 'reschedule', title: 'Reschedule' }
        ]
      },
      {
        name: 'Booking Cancelled',
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        body: 'Your appointment for {{serviceName}} has been cancelled. We apologize for any inconvenience.',
        icon: '/icons/booking-cancelled.png'
      },
      {
        name: 'Payment Received',
        type: 'payment_received',
        title: 'Payment Received ✅',
        body: 'We have received your payment of ${{amount}} for {{serviceName}}',
        icon: '/icons/payment-received.png'
      }
    ];

    for (const template of defaultTemplates) {
      await this.createTemplate(template);
    }
  }

  // Service status
  isConfigured(): { web: boolean; fcm: boolean } {
    return {
      web: this.isWebPushConfigured,
      fcm: this.isFCMConfigured
    };
  }
}

export const pushNotificationService = new PushNotificationService();