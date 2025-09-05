import Mixpanel from 'mixpanel';
import { v4 as uuidv4 } from 'uuid';
import { UAParser } from 'ua-parser-js';
import * as geoip from 'geoip-lite';
import { cacheService } from './cacheService';
import { performanceMonitoring } from './performanceMonitoringService';
import { logger } from '../utils/logger';

export interface UserSession {
  id: string;
  userId?: string;
  anonymousId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: PageView[];
  events: AnalyticsEvent[];
  device: DeviceInfo;
  location: LocationInfo;
  referrer?: string;
  utmParams?: UTMParams;
  isActive: boolean;
}

export interface PageView {
  id: string;
  sessionId: string;
  userId?: string;
  path: string;
  title?: string;
  timestamp: Date;
  duration?: number;
  referrer?: string;
  exitPage?: boolean;
  bounced?: boolean;
}

export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  userId?: string;
  eventName: string;
  category: 'user_action' | 'business_action' | 'system' | 'conversion' | 'error';
  properties: Record<string, any>;
  value?: number;
  timestamp: Date;
}

export interface DeviceInfo {
  userAgent: string;
  browser: {
    name?: string;
    version?: string;
  };
  os: {
    name?: string;
    version?: string;
  };
  device: {
    type?: string;
    vendor?: string;
    model?: string;
  };
  screen: {
    width?: number;
    height?: number;
    colorDepth?: number;
  };
  timezone?: string;
  language?: string;
}

export interface LocationInfo {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface UserBehaviorPattern {
  userId: string;
  patterns: {
    preferredTimeSlots: string[];
    favoriteServices: string[];
    averageBookingValue: number;
    bookingFrequency: 'weekly' | 'monthly' | 'quarterly' | 'rarely';
    preferredBusinessTypes: string[];
    priceRange: 'budget' | 'mid-range' | 'premium' | 'luxury';
    devicePreference: 'mobile' | 'desktop' | 'tablet';
    seasonalPreferences: Record<string, string[]>;
  };
  lastUpdated: Date;
}

export interface BusinessMetrics {
  businessId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  metrics: {
    totalViews: number;
    uniqueViews: number;
    bookingConversions: number;
    conversionRate: number;
    averageSessionDuration: number;
    bounceRate: number;
    topServices: Array<{ service: string; bookings: number; revenue: number }>;
    revenueMetrics: {
      totalRevenue: number;
      averageBookingValue: number;
      revenueGrowth: number;
    };
    userAcquisition: {
      newUsers: number;
      returningUsers: number;
      acquisitionChannels: Record<string, number>;
    };
    geographicData: Record<string, number>;
    deviceBreakdown: Record<string, number>;
  };
}

export interface FunnelAnalysis {
  funnelName: string;
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
    dropoffRate: number;
  }>;
  totalConversions: number;
  overallConversionRate: number;
  averageTimeToConvert: number;
}

export class AnalyticsService {
  private mixpanel?: Mixpanel.Mixpanel;
  private sessions = new Map<string, UserSession>();
  private pageViews: PageView[] = [];
  private events: AnalyticsEvent[] = [];
  private userBehaviors = new Map<string, UserBehaviorPattern>();
  private isMixpanelEnabled = false;

  constructor() {
    this.initializeMixpanel();
    this.startSessionCleanup();
  }

  private initializeMixpanel(): void {
    try {
      const mixpanelToken = process.env.MIXPANEL_PROJECT_TOKEN;
      
      if (mixpanelToken) {
        this.mixpanel = Mixpanel.init(mixpanelToken, {
          debug: process.env.NODE_ENV === 'development'
        });
        this.isMixpanelEnabled = true;
        logger.info('Analytics tracking enabled with Mixpanel');
      } else {
        logger.warn('Analytics not configured: Missing MIXPANEL_PROJECT_TOKEN');
      }
    } catch (error) {
      logger.error('Failed to initialize Mixpanel:', error);
    }
  }

  // Session Management
  async createSession(request: {
    userAgent?: string;
    ip: string;
    referrer?: string;
    utmParams?: UTMParams;
    userId?: string;
  }): Promise<UserSession> {
    const sessionId = uuidv4();
    const anonymousId = uuidv4();
    
    const deviceInfo = this.parseDeviceInfo(request.userAgent || '');
    const locationInfo = this.parseLocationInfo(request.ip);

    const session: UserSession = {
      id: sessionId,
      userId: request.userId,
      anonymousId,
      startTime: new Date(),
      pageViews: [],
      events: [],
      device: deviceInfo,
      location: locationInfo,
      referrer: request.referrer,
      utmParams: request.utmParams,
      isActive: true
    };

    this.sessions.set(sessionId, session);

    // Cache session for quick access
    await cacheService.set(`analytics:session:${sessionId}`, session, {
      ttl: 3600 * 24, // 24 hours
      tags: ['analytics', 'sessions']
    });

    // Track session start
    await this.trackEvent({
      sessionId,
      userId: request.userId,
      eventName: 'session_start',
      category: 'system',
      properties: {
        referrer: request.referrer,
        utm_source: request.utmParams?.source,
        utm_medium: request.utmParams?.medium,
        utm_campaign: request.utmParams?.campaign,
        device_type: deviceInfo.device.type,
        browser: deviceInfo.browser.name,
        os: deviceInfo.os.name,
        country: locationInfo.country,
        city: locationInfo.city
      }
    });

    performanceMonitoring.trackCustomEvent('analytics_session_created', {
      sessionId: sessionId.slice(0, 8),
      userId: request.userId?.slice(0, 8)
    });

    return session;
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const endTime = new Date();
    const duration = endTime.getTime() - session.startTime.getTime();

    session.endTime = endTime;
    session.duration = duration;
    session.isActive = false;

    // Update last page view as exit page
    if (session.pageViews.length > 0) {
      const lastPageView = session.pageViews[session.pageViews.length - 1];
      lastPageView.exitPage = true;
      lastPageView.duration = endTime.getTime() - lastPageView.timestamp.getTime();
    }

    // Track session end
    await this.trackEvent({
      sessionId,
      userId: session.userId,
      eventName: 'session_end',
      category: 'system',
      properties: {
        duration,
        page_views: session.pageViews.length,
        events: session.events.length,
        bounced: session.pageViews.length === 1
      }
    });

    // Update cache
    await cacheService.set(`analytics:session:${sessionId}`, session, {
      ttl: 3600 * 24 * 7, // Keep for 7 days
      tags: ['analytics', 'sessions', 'completed']
    });
  }

  // Event Tracking
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date()
    };

    this.events.push(analyticsEvent);

    // Add to session
    const session = this.sessions.get(event.sessionId);
    if (session) {
      session.events.push(analyticsEvent);
    }

    // Send to Mixpanel
    if (this.isMixpanelEnabled && this.mixpanel) {
      const mixpanelProperties = {
        distinct_id: event.userId || session?.anonymousId,
        session_id: event.sessionId,
        category: event.category,
        value: event.value,
        ...event.properties,
        timestamp: analyticsEvent.timestamp,
        // Add session context
        ...(session && {
          device_type: session.device.device.type,
          browser: session.device.browser.name,
          os: session.device.os.name,
          country: session.location.country,
          city: session.location.city,
          referrer: session.referrer,
          utm_source: session.utmParams?.source,
          utm_medium: session.utmParams?.medium,
          utm_campaign: session.utmParams?.campaign
        })
      };

      try {
        this.mixpanel.track(event.eventName, mixpanelProperties);
      } catch (error) {
        logger.error('Failed to send event to Mixpanel:', error);
      }
    }

    // Cache recent events
    await cacheService.set(`analytics:event:${analyticsEvent.id}`, analyticsEvent, {
      ttl: 3600 * 24, // 24 hours
      tags: ['analytics', 'events', event.category]
    });

    performanceMonitoring.trackCustomEvent('analytics_event_tracked', {
      eventName: event.eventName,
      category: event.category
    });
  }

  async trackPageView(pageView: Omit<PageView, 'id' | 'timestamp'>): Promise<void> {
    const analyticsPageView: PageView = {
      ...pageView,
      id: uuidv4(),
      timestamp: new Date()
    };

    this.pageViews.push(analyticsPageView);

    // Add to session
    const session = this.sessions.get(pageView.sessionId);
    if (session) {
      // End duration of previous page view
      if (session.pageViews.length > 0) {
        const prevPageView = session.pageViews[session.pageViews.length - 1];
        prevPageView.duration = analyticsPageView.timestamp.getTime() - prevPageView.timestamp.getTime();
      }

      session.pageViews.push(analyticsPageView);
    }

    // Track as event
    await this.trackEvent({
      sessionId: pageView.sessionId,
      userId: pageView.userId,
      eventName: 'page_view',
      category: 'user_action',
      properties: {
        path: pageView.path,
        title: pageView.title,
        referrer: pageView.referrer
      }
    });

    // Send page view to Mixpanel
    if (this.isMixpanelEnabled && this.mixpanel) {
      try {
        this.mixpanel.track('Page View', {
          distinct_id: pageView.userId || session?.anonymousId,
          session_id: pageView.sessionId,
          path: pageView.path,
          title: pageView.title,
          referrer: pageView.referrer,
          timestamp: analyticsPageView.timestamp
        });
      } catch (error) {
        logger.error('Failed to send page view to Mixpanel:', error);
      }
    }
  }

  // Business-Specific Tracking
  async trackBookingFunnel(step: 'view_business' | 'view_services' | 'select_time' | 'enter_details' | 'payment' | 'confirmed', data: {
    sessionId: string;
    userId?: string;
    businessId: string;
    serviceId?: string;
    value?: number;
    properties?: Record<string, any>;
  }): Promise<void> {
    await this.trackEvent({
      sessionId: data.sessionId,
      userId: data.userId,
      eventName: `booking_funnel_${step}`,
      category: 'conversion',
      value: data.value,
      properties: {
        business_id: data.businessId,
        service_id: data.serviceId,
        funnel_step: step,
        ...data.properties
      }
    });
  }

  async trackSearchBehavior(data: {
    sessionId: string;
    userId?: string;
    query: string;
    filters: Record<string, any>;
    resultsCount: number;
    clickedResult?: string;
    clickPosition?: number;
  }): Promise<void> {
    await this.trackEvent({
      sessionId: data.sessionId,
      userId: data.userId,
      eventName: 'search_performed',
      category: 'user_action',
      properties: {
        query: data.query,
        filters: data.filters,
        results_count: data.resultsCount,
        clicked_result: data.clickedResult,
        click_position: data.clickPosition
      }
    });
  }

  async trackBusinessInteraction(data: {
    sessionId: string;
    userId?: string;
    businessId: string;
    action: 'view_profile' | 'view_photos' | 'view_reviews' | 'click_phone' | 'click_directions' | 'share' | 'favorite';
    properties?: Record<string, any>;
  }): Promise<void> {
    await this.trackEvent({
      sessionId: data.sessionId,
      userId: data.userId,
      eventName: `business_${data.action}`,
      category: 'user_action',
      properties: {
        business_id: data.businessId,
        action: data.action,
        ...data.properties
      }
    });
  }

  // User Behavior Analysis
  async analyzeUserBehavior(userId: string): Promise<UserBehaviorPattern> {
    const existingPattern = this.userBehaviors.get(userId);
    
    // Check cache first
    const cachedPattern = await cacheService.get<UserBehaviorPattern>(`analytics:behavior:${userId}`);
    if (cachedPattern && (!existingPattern || cachedPattern.lastUpdated > existingPattern.lastUpdated)) {
      this.userBehaviors.set(userId, cachedPattern);
      return cachedPattern;
    }

    // Analyze user's events and sessions
    const userEvents = this.events.filter(e => e.userId === userId);
    const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);

    // Analyze booking patterns
    const bookingEvents = userEvents.filter(e => e.eventName.includes('booking'));
    const preferredTimeSlots = this.analyzeTimePreferences(bookingEvents);
    const favoriteServices = this.analyzeServicePreferences(userEvents);
    const averageBookingValue = this.calculateAverageBookingValue(userEvents);
    const bookingFrequency = this.analyzeBookingFrequency(bookingEvents);
    const preferredBusinessTypes = this.analyzeBusinessTypePreferences(userEvents);
    const priceRange = this.analyzePriceRangePreference(userEvents);
    const devicePreference = this.analyzeDevicePreference(userSessions);
    const seasonalPreferences = this.analyzeSeasonalPreferences(bookingEvents);

    const pattern: UserBehaviorPattern = {
      userId,
      patterns: {
        preferredTimeSlots,
        favoriteServices,
        averageBookingValue,
        bookingFrequency,
        preferredBusinessTypes,
        priceRange,
        devicePreference,
        seasonalPreferences
      },
      lastUpdated: new Date()
    };

    this.userBehaviors.set(userId, pattern);

    // Cache the pattern
    await cacheService.set(`analytics:behavior:${userId}`, pattern, {
      ttl: 3600 * 24 * 7, // 1 week
      tags: ['analytics', 'user_behavior', `user:${userId}`]
    });

    return pattern;
  }

  // Business Analytics
  async generateBusinessMetrics(businessId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<BusinessMetrics> {
    const now = new Date();
    const startDate = this.getStartDateForPeriod(now, period);
    
    // Filter events for this business and time period
    const businessEvents = this.events.filter(e => 
      e.properties.business_id === businessId &&
      e.timestamp >= startDate &&
      e.timestamp <= now
    );

    const businessSessions = Array.from(this.sessions.values()).filter(s =>
      s.events.some(e => e.properties.business_id === businessId) &&
      s.startTime >= startDate &&
      s.startTime <= now
    );

    // Calculate metrics
    const totalViews = businessEvents.filter(e => e.eventName === 'business_view_profile').length;
    const uniqueViews = new Set(businessEvents.filter(e => e.eventName === 'business_view_profile').map(e => e.userId || e.sessionId)).size;
    const bookingConversions = businessEvents.filter(e => e.eventName === 'booking_funnel_confirmed').length;
    const conversionRate = totalViews > 0 ? (bookingConversions / totalViews) * 100 : 0;

    const averageSessionDuration = businessSessions.length > 0 
      ? businessSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / businessSessions.length
      : 0;

    const bouncedSessions = businessSessions.filter(s => s.pageViews.length === 1).length;
    const bounceRate = businessSessions.length > 0 ? (bouncedSessions / businessSessions.length) * 100 : 0;

    const topServices = this.analyzeTopServices(businessEvents);
    const revenueMetrics = this.calculateRevenueMetrics(businessEvents);
    const userAcquisition = this.analyzeUserAcquisition(businessSessions);
    const geographicData = this.analyzeGeographicData(businessSessions);
    const deviceBreakdown = this.analyzeDeviceBreakdown(businessSessions);

    const metrics: BusinessMetrics = {
      businessId,
      period,
      startDate,
      endDate: now,
      metrics: {
        totalViews,
        uniqueViews,
        bookingConversions,
        conversionRate,
        averageSessionDuration,
        bounceRate,
        topServices,
        revenueMetrics,
        userAcquisition,
        geographicData,
        deviceBreakdown
      }
    };

    // Cache metrics
    await cacheService.set(`analytics:business_metrics:${businessId}:${period}`, metrics, {
      ttl: period === 'daily' ? 3600 * 6 : 3600 * 24, // 6 hours for daily, 24 hours for others
      tags: ['analytics', 'business_metrics', `business:${businessId}`]
    });

    return metrics;
  }

  // Funnel Analysis
  async analyzeFunnel(funnelName: string, steps: string[], timeframe: { start: Date; end: Date }): Promise<FunnelAnalysis> {
    const relevantEvents = this.events.filter(e => 
      steps.includes(e.eventName) &&
      e.timestamp >= timeframe.start &&
      e.timestamp <= timeframe.end
    );

    const funnelSteps = steps.map((stepName, index) => {
      const stepEvents = relevantEvents.filter(e => e.eventName === stepName);
      const uniqueUsers = new Set(stepEvents.map(e => e.userId || e.sessionId)).size;
      
      const previousStepUsers = index === 0 ? uniqueUsers : 
        new Set(relevantEvents.filter(e => steps[index - 1] === e.eventName).map(e => e.userId || e.sessionId)).size;
      
      const conversionRate = previousStepUsers > 0 ? (uniqueUsers / previousStepUsers) * 100 : 100;
      const dropoffRate = 100 - conversionRate;

      return {
        name: stepName,
        users: uniqueUsers,
        conversionRate,
        dropoffRate
      };
    });

    const totalConversions = funnelSteps[funnelSteps.length - 1]?.users || 0;
    const initialUsers = funnelSteps[0]?.users || 0;
    const overallConversionRate = initialUsers > 0 ? (totalConversions / initialUsers) * 100 : 0;

    // Calculate average time to convert
    const conversionEvents = relevantEvents.filter(e => e.eventName === steps[steps.length - 1]);
    const averageTimeToConvert = this.calculateAverageConversionTime(conversionEvents, steps[0]);

    return {
      funnelName,
      steps: funnelSteps,
      totalConversions,
      overallConversionRate,
      averageTimeToConvert
    };
  }

  // User Identification and Profile Enhancement
  async identifyUser(anonymousId: string, userId: string, properties?: Record<string, any>): Promise<void> {
    // Update existing sessions
    const sessionsToUpdate = Array.from(this.sessions.values()).filter(s => s.anonymousId === anonymousId);
    sessionsToUpdate.forEach(session => {
      session.userId = userId;
    });

    // Send identification to Mixpanel
    if (this.isMixpanelEnabled && this.mixpanel) {
      try {
        this.mixpanel.alias(userId, anonymousId);
        if (properties) {
          this.mixpanel.people.set(userId, properties);
        }
      } catch (error) {
        logger.error('Failed to identify user in Mixpanel:', error);
      }
    }

    await this.trackEvent({
      sessionId: sessionsToUpdate[0]?.id || uuidv4(),
      userId,
      eventName: 'user_identified',
      category: 'system',
      properties: properties || {}
    });
  }

  async updateUserProfile(userId: string, properties: Record<string, any>): Promise<void> {
    // Send profile update to Mixpanel
    if (this.isMixpanelEnabled && this.mixpanel) {
      try {
        this.mixpanel.people.set(userId, properties);
      } catch (error) {
        logger.error('Failed to update user profile in Mixpanel:', error);
      }
    }

    await this.trackEvent({
      sessionId: uuidv4(),
      userId,
      eventName: 'user_profile_updated',
      category: 'user_action',
      properties
    });
  }

  // Analytics Dashboard Data
  async getDashboardData(businessId?: string): Promise<{
    overview: {
      totalSessions: number;
      totalUsers: number;
      totalPageViews: number;
      totalEvents: number;
      averageSessionDuration: number;
      bounceRate: number;
    };
    realTimeData: {
      activeSessions: number;
      recentEvents: AnalyticsEvent[];
    };
    topPages: Array<{ path: string; views: number; uniqueViews: number }>;
    topEvents: Array<{ eventName: string; count: number }>;
    userAcquisition: Record<string, number>;
    deviceStats: Record<string, number>;
    geographicStats: Record<string, number>;
  }> {
    const filteredSessions = businessId 
      ? Array.from(this.sessions.values()).filter(s => s.events.some(e => e.properties.business_id === businessId))
      : Array.from(this.sessions.values());

    const filteredEvents = businessId
      ? this.events.filter(e => e.properties.business_id === businessId)
      : this.events;

    const filteredPageViews = businessId
      ? this.pageViews.filter(pv => {
          const session = this.sessions.get(pv.sessionId);
          return session?.events.some(e => e.properties.business_id === businessId);
        })
      : this.pageViews;

    // Overview metrics
    const totalSessions = filteredSessions.length;
    const totalUsers = new Set(filteredSessions.map(s => s.userId).filter(Boolean)).size;
    const totalPageViews = filteredPageViews.length;
    const totalEvents = filteredEvents.length;
    
    const sessionsWithDuration = filteredSessions.filter(s => s.duration);
    const averageSessionDuration = sessionsWithDuration.length > 0
      ? sessionsWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionsWithDuration.length
      : 0;

    const bouncedSessions = filteredSessions.filter(s => s.pageViews.length === 1);
    const bounceRate = totalSessions > 0 ? (bouncedSessions.length / totalSessions) * 100 : 0;

    // Real-time data
    const activeSessions = filteredSessions.filter(s => s.isActive).length;
    const recentEvents = filteredEvents.slice(-10).reverse();

    // Top pages
    const pageViewCounts = new Map<string, { views: number; uniqueUsers: Set<string> }>();
    filteredPageViews.forEach(pv => {
      const existing = pageViewCounts.get(pv.path) || { views: 0, uniqueUsers: new Set() };
      existing.views++;
      if (pv.userId) existing.uniqueUsers.add(pv.userId);
      pageViewCounts.set(pv.path, existing);
    });

    const topPages = Array.from(pageViewCounts.entries())
      .map(([path, data]) => ({ path, views: data.views, uniqueViews: data.uniqueUsers.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top events
    const eventCounts = new Map<string, number>();
    filteredEvents.forEach(e => {
      eventCounts.set(e.eventName, (eventCounts.get(e.eventName) || 0) + 1);
    });

    const topEvents = Array.from(eventCounts.entries())
      .map(([eventName, count]) => ({ eventName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // User acquisition
    const acquisitionChannels = new Map<string, number>();
    filteredSessions.forEach(s => {
      const channel = s.utmParams?.source || s.referrer || 'direct';
      acquisitionChannels.set(channel, (acquisitionChannels.get(channel) || 0) + 1);
    });
    const userAcquisition = Object.fromEntries(acquisitionChannels);

    // Device stats
    const deviceTypes = new Map<string, number>();
    filteredSessions.forEach(s => {
      const deviceType = s.device.device.type || 'unknown';
      deviceTypes.set(deviceType, (deviceTypes.get(deviceType) || 0) + 1);
    });
    const deviceStats = Object.fromEntries(deviceTypes);

    // Geographic stats
    const countries = new Map<string, number>();
    filteredSessions.forEach(s => {
      const country = s.location.country || 'unknown';
      countries.set(country, (countries.get(country) || 0) + 1);
    });
    const geographicStats = Object.fromEntries(countries);

    return {
      overview: {
        totalSessions,
        totalUsers,
        totalPageViews,
        totalEvents,
        averageSessionDuration,
        bounceRate
      },
      realTimeData: {
        activeSessions,
        recentEvents
      },
      topPages,
      topEvents,
      userAcquisition,
      deviceStats,
      geographicStats
    };
  }

  // Utility Methods
  private parseDeviceInfo(userAgent: string): DeviceInfo {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      userAgent,
      browser: {
        name: result.browser.name,
        version: result.browser.version
      },
      os: {
        name: result.os.name,
        version: result.os.version
      },
      device: {
        type: result.device.type,
        vendor: result.device.vendor,
        model: result.device.model
      },
      screen: {}, // Will be populated from client-side
      timezone: undefined, // Will be populated from client-side
      language: undefined // Will be populated from client-side
    };
  }

  private parseLocationInfo(ip: string): LocationInfo {
    const geo = geoip.lookup(ip);
    
    return {
      ip,
      country: geo?.country,
      region: geo?.region,
      city: geo?.city,
      latitude: geo?.ll?.[0],
      longitude: geo?.ll?.[1],
      timezone: geo?.timezone
    };
  }

  private analyzeTimePreferences(events: AnalyticsEvent[]): string[] {
    const timeSlots = new Map<string, number>();
    
    events.forEach(event => {
      if (event.properties.scheduled_time) {
        const time = new Date(event.properties.scheduled_time);
        const hour = time.getHours();
        const timeSlot = this.getTimeSlot(hour);
        timeSlots.set(timeSlot, (timeSlots.get(timeSlot) || 0) + 1);
      }
    });

    return Array.from(timeSlots.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slot]) => slot);
  }

  private analyzeServicePreferences(events: AnalyticsEvent[]): string[] {
    const services = new Map<string, number>();
    
    events.forEach(event => {
      if (event.properties.service_name) {
        const service = event.properties.service_name;
        services.set(service, (services.get(service) || 0) + 1);
      }
    });

    return Array.from(services.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([service]) => service);
  }

  private calculateAverageBookingValue(events: AnalyticsEvent[]): number {
    const bookingValues = events
      .filter(e => e.eventName === 'booking_funnel_confirmed' && e.value)
      .map(e => e.value!);

    return bookingValues.length > 0
      ? bookingValues.reduce((sum, val) => sum + val, 0) / bookingValues.length
      : 0;
  }

  private analyzeBookingFrequency(events: AnalyticsEvent[]): 'weekly' | 'monthly' | 'quarterly' | 'rarely' {
    const bookings = events.filter(e => e.eventName === 'booking_funnel_confirmed');
    if (bookings.length < 2) return 'rarely';

    const sortedBookings = bookings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const intervals = [];

    for (let i = 1; i < sortedBookings.length; i++) {
      const interval = sortedBookings[i].timestamp.getTime() - sortedBookings[i - 1].timestamp.getTime();
      intervals.push(interval);
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const days = averageInterval / (1000 * 60 * 60 * 24);

    if (days <= 14) return 'weekly';
    if (days <= 45) return 'monthly';
    if (days <= 120) return 'quarterly';
    return 'rarely';
  }

  private analyzeBusinessTypePreferences(events: AnalyticsEvent[]): string[] {
    const businessTypes = new Map<string, number>();
    
    events.forEach(event => {
      if (event.properties.business_type) {
        const type = event.properties.business_type;
        businessTypes.set(type, (businessTypes.get(type) || 0) + 1);
      }
    });

    return Array.from(businessTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  }

  private analyzePriceRangePreference(events: AnalyticsEvent[]): 'budget' | 'mid-range' | 'premium' | 'luxury' {
    const bookingValues = events
      .filter(e => e.eventName === 'booking_funnel_confirmed' && e.value)
      .map(e => e.value!);

    if (bookingValues.length === 0) return 'mid-range';

    const averageValue = bookingValues.reduce((sum, val) => sum + val, 0) / bookingValues.length;

    if (averageValue <= 30) return 'budget';
    if (averageValue <= 75) return 'mid-range';
    if (averageValue <= 150) return 'premium';
    return 'luxury';
  }

  private analyzeDevicePreference(sessions: UserSession[]): 'mobile' | 'desktop' | 'tablet' {
    const deviceCounts = new Map<string, number>();
    
    sessions.forEach(session => {
      const deviceType = session.device.device.type || 'desktop';
      deviceCounts.set(deviceType, (deviceCounts.get(deviceType) || 0) + 1);
    });

    const sortedDevices = Array.from(deviceCounts.entries()).sort((a, b) => b[1] - a[1]);
    return sortedDevices[0]?.[0] as 'mobile' | 'desktop' | 'tablet' || 'desktop';
  }

  private analyzeSeasonalPreferences(events: AnalyticsEvent[]): Record<string, string[]> {
    const seasonal = { spring: [], summer: [], fall: [], winter: [] } as Record<string, string[]>;
    
    events.forEach(event => {
      if (event.properties.scheduled_time && event.properties.service_name) {
        const date = new Date(event.properties.scheduled_time);
        const month = date.getMonth();
        const season = this.getSeason(month);
        if (!seasonal[season].includes(event.properties.service_name)) {
          seasonal[season].push(event.properties.service_name);
        }
      }
    });

    return seasonal;
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private getSeason(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private getStartDateForPeriod(endDate: Date, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date {
    const startDate = new Date(endDate);
    
    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    return startDate;
  }

  private analyzeTopServices(events: AnalyticsEvent[]): Array<{ service: string; bookings: number; revenue: number }> {
    const services = new Map<string, { bookings: number; revenue: number }>();
    
    events.forEach(event => {
      if (event.eventName === 'booking_funnel_confirmed' && event.properties.service_name) {
        const service = event.properties.service_name;
        const existing = services.get(service) || { bookings: 0, revenue: 0 };
        existing.bookings++;
        existing.revenue += event.value || 0;
        services.set(service, existing);
      }
    });

    return Array.from(services.entries())
      .map(([service, data]) => ({ service, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private calculateRevenueMetrics(events: AnalyticsEvent[]): {
    totalRevenue: number;
    averageBookingValue: number;
    revenueGrowth: number;
  } {
    const bookingEvents = events.filter(e => e.eventName === 'booking_funnel_confirmed');
    const totalRevenue = bookingEvents.reduce((sum, e) => sum + (e.value || 0), 0);
    const averageBookingValue = bookingEvents.length > 0 ? totalRevenue / bookingEvents.length : 0;
    
    // Calculate growth (simplified - would need historical data)
    const revenueGrowth = 0; // Placeholder

    return {
      totalRevenue,
      averageBookingValue,
      revenueGrowth
    };
  }

  private analyzeUserAcquisition(sessions: UserSession[]): {
    newUsers: number;
    returningUsers: number;
    acquisitionChannels: Record<string, number>;
  } {
    const userIds = new Set<string>();
    const channels = new Map<string, number>();
    
    sessions.forEach(session => {
      if (session.userId) {
        userIds.add(session.userId);
      }
      
      const channel = session.utmParams?.source || session.referrer || 'direct';
      channels.set(channel, (channels.get(channel) || 0) + 1);
    });

    return {
      newUsers: userIds.size, // Simplified
      returningUsers: sessions.length - userIds.size, // Simplified
      acquisitionChannels: Object.fromEntries(channels)
    };
  }

  private analyzeGeographicData(sessions: UserSession[]): Record<string, number> {
    const countries = new Map<string, number>();
    
    sessions.forEach(session => {
      const country = session.location.country || 'Unknown';
      countries.set(country, (countries.get(country) || 0) + 1);
    });

    return Object.fromEntries(countries);
  }

  private analyzeDeviceBreakdown(sessions: UserSession[]): Record<string, number> {
    const devices = new Map<string, number>();
    
    sessions.forEach(session => {
      const device = session.device.device.type || 'desktop';
      devices.set(device, (devices.get(device) || 0) + 1);
    });

    return Object.fromEntries(devices);
  }

  private calculateAverageConversionTime(conversionEvents: AnalyticsEvent[], startEventName: string): number {
    const conversionTimes: number[] = [];
    
    conversionEvents.forEach(conversionEvent => {
      const sessionEvents = this.events.filter(e => 
        e.sessionId === conversionEvent.sessionId && 
        e.timestamp <= conversionEvent.timestamp
      ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      const startEvent = sessionEvents.find(e => e.eventName === startEventName);
      if (startEvent) {
        const timeDiff = conversionEvent.timestamp.getTime() - startEvent.timestamp.getTime();
        conversionTimes.push(timeDiff);
      }
    });

    return conversionTimes.length > 0
      ? conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length
      : 0;
  }

  private startSessionCleanup(): void {
    // Clean up inactive sessions every hour
    setInterval(() => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.isActive && now - session.startTime.getTime() > oneHour) {
          this.endSession(sessionId);
        }
      }
    }, 30 * 60 * 1000); // Check every 30 minutes
  }

  // Public getters for analytics data
  getAnalyticsSummary(): {
    totalSessions: number;
    totalUsers: number;
    totalEvents: number;
    isConfigured: boolean;
  } {
    return {
      totalSessions: this.sessions.size,
      totalUsers: new Set(Array.from(this.sessions.values()).map(s => s.userId).filter(Boolean)).size,
      totalEvents: this.events.length,
      isConfigured: this.isMixpanelEnabled
    };
  }
}

export const analyticsService = new AnalyticsService();