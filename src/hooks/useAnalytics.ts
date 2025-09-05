import { useState, useEffect, useContext, createContext, ReactNode, useCallback } from 'react';
import axios from 'axios';

// Types
interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
}

interface PageView {
  path: string;
  title?: string;
  properties?: Record<string, any>;
}

interface Conversion {
  conversionType: string;
  value?: number;
  properties?: Record<string, any>;
}

interface UserAction {
  action: string;
  target: string;
  properties?: Record<string, any>;
}

interface AnalyticsConfig {
  apiBaseUrl: string;
  enableAutoTracking: boolean;
  enableConsoleLogging: boolean;
  userId?: string;
}

interface AnalyticsContextType {
  config: AnalyticsConfig;
  isConfigured: boolean;
  trackEvent: (eventName: string, properties?: Record<string, any>) => Promise<void>;
  trackPageView: (path: string, title?: string, properties?: Record<string, any>) => Promise<void>;
  trackConversion: (conversionType: string, value?: number, properties?: Record<string, any>) => Promise<void>;
  trackUserAction: (action: string, target: string, properties?: Record<string, any>) => Promise<void>;
  identify: (userId: string, userProperties?: Record<string, any>) => void;
  reset: () => void;
}

// Create Analytics Context
const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

// Analytics Provider Component
interface AnalyticsProviderProps {
  children: ReactNode;
  apiBaseUrl?: string;
  enableAutoTracking?: boolean;
  enableConsoleLogging?: boolean;
  userId?: string;
}

export const AnalyticsProvider = ({
  children,
  apiBaseUrl = '/api/analytics',
  enableAutoTracking = true,
  enableConsoleLogging = false,
  userId
}: AnalyticsProviderProps) => {
  const [config, setConfig] = useState<AnalyticsConfig>({
    apiBaseUrl,
    enableAutoTracking,
    enableConsoleLogging,
    userId
  });
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  // Check if analytics service is configured
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/config`);
        setIsConfigured(response.data.configured);
        
        if (enableConsoleLogging) {
          console.log('[Analytics] Configuration:', response.data);
        }
      } catch (error) {
        console.error('[Analytics] Failed to check configuration:', error);
        setIsConfigured(false);
      }
    };

    checkConfiguration();
  }, [apiBaseUrl, enableConsoleLogging]);

  // Track events
  const trackEvent = useCallback(async (eventName: string, properties: Record<string, any> = {}) => {
    try {
      if (!isConfigured) {
        if (enableConsoleLogging) {
          console.log('[Analytics] Service not configured, skipping event:', eventName);
        }
        return;
      }

      // Add common properties
      const enhancedProperties = {
        ...properties,
        timestamp: Date.now(),
        url: window.location.href,
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      await axios.post(`${config.apiBaseUrl}/track`, {
        eventName,
        properties: enhancedProperties
      });

      if (config.enableConsoleLogging) {
        console.log('[Analytics] Event tracked:', eventName, enhancedProperties);
      }
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  }, [config, isConfigured, enableConsoleLogging]);

  // Track page views
  const trackPageView = useCallback(async (path: string, title?: string, properties: Record<string, any> = {}) => {
    try {
      if (!isConfigured) {
        if (enableConsoleLogging) {
          console.log('[Analytics] Service not configured, skipping page view:', path);
        }
        return;
      }

      const enhancedProperties = {
        ...properties,
        timestamp: Date.now(),
        referrer: document.referrer,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      await axios.post(`${config.apiBaseUrl}/pageview`, {
        path,
        title: title || document.title,
        properties: enhancedProperties
      });

      if (config.enableConsoleLogging) {
        console.log('[Analytics] Page view tracked:', path, title);
      }
    } catch (error) {
      console.error('[Analytics] Failed to track page view:', error);
    }
  }, [config, isConfigured, enableConsoleLogging]);

  // Track conversions
  const trackConversion = useCallback(async (conversionType: string, value: number = 0, properties: Record<string, any> = {}) => {
    try {
      if (!isConfigured) {
        if (enableConsoleLogging) {
          console.log('[Analytics] Service not configured, skipping conversion:', conversionType);
        }
        return;
      }

      const enhancedProperties = {
        ...properties,
        timestamp: Date.now(),
        url: window.location.href,
        path: window.location.pathname
      };

      await axios.post(`${config.apiBaseUrl}/conversion`, {
        conversionType,
        value,
        properties: enhancedProperties
      });

      if (config.enableConsoleLogging) {
        console.log('[Analytics] Conversion tracked:', conversionType, value);
      }
    } catch (error) {
      console.error('[Analytics] Failed to track conversion:', error);
    }
  }, [config, isConfigured, enableConsoleLogging]);

  // Track user actions
  const trackUserAction = useCallback(async (action: string, target: string, properties: Record<string, any> = {}) => {
    try {
      if (!isConfigured) {
        if (enableConsoleLogging) {
          console.log('[Analytics] Service not configured, skipping user action:', action);
        }
        return;
      }

      const enhancedProperties = {
        ...properties,
        timestamp: Date.now(),
        url: window.location.href,
        path: window.location.pathname
      };

      await trackEvent('user_action', {
        action,
        target,
        ...enhancedProperties
      });

      if (config.enableConsoleLogging) {
        console.log('[Analytics] User action tracked:', action, target);
      }
    } catch (error) {
      console.error('[Analytics] Failed to track user action:', error);
    }
  }, [trackEvent, isConfigured, enableConsoleLogging]);

  // Identify user
  const identify = useCallback((userId: string, userProperties: Record<string, any> = {}) => {
    setConfig(prev => ({ ...prev, userId }));
    
    // Track user identification
    trackEvent('user_identified', {
      userId,
      ...userProperties
    });

    if (config.enableConsoleLogging) {
      console.log('[Analytics] User identified:', userId, userProperties);
    }
  }, [trackEvent, config.enableConsoleLogging]);

  // Reset analytics state
  const reset = useCallback(() => {
    setConfig(prev => ({ ...prev, userId: undefined }));
    
    if (config.enableConsoleLogging) {
      console.log('[Analytics] Analytics state reset');
    }
  }, [config.enableConsoleLogging]);

  const value: AnalyticsContextType = {
    config,
    isConfigured,
    trackEvent,
    trackPageView,
    trackConversion,
    trackUserAction,
    identify,
    reset
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Main analytics hook
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  return context;
};

// Hook for tracking page views automatically
export const usePageTracking = (path?: string, title?: string, properties?: Record<string, any>) => {
  const { trackPageView, config } = useAnalytics();
  
  useEffect(() => {
    if (config.enableAutoTracking) {
      const currentPath = path || window.location.pathname;
      const currentTitle = title || document.title;
      
      trackPageView(currentPath, currentTitle, properties);
    }
  }, [path, title, properties, trackPageView, config.enableAutoTracking]);
};

// Hook for tracking form interactions
export const useFormTracking = (formName: string) => {
  const { trackEvent, trackUserAction } = useAnalytics();
  
  const trackFormStart = useCallback(() => {
    trackEvent('form_started', { formName });
  }, [trackEvent, formName]);
  
  const trackFormFieldInteraction = useCallback((fieldName: string, fieldType: string) => {
    trackUserAction('form_field_interaction', fieldName, { formName, fieldType });
  }, [trackUserAction, formName]);
  
  const trackFormSubmit = useCallback(() => {
    trackEvent('form_submitted', { formName });
  }, [trackEvent, formName]);
  
  const trackFormError = useCallback((errorMessage: string, fieldName?: string) => {
    trackEvent('form_error', { 
      formName, 
      errorMessage, 
      fieldName 
    });
  }, [trackEvent, formName]);
  
  const trackFormComplete = useCallback(() => {
    trackEvent('form_completed', { formName });
  }, [trackEvent, formName]);
  
  return {
    trackFormStart,
    trackFormFieldInteraction,
    trackFormSubmit,
    trackFormError,
    trackFormComplete
  };
};

// Hook for tracking button clicks and interactions
export const useInteractionTracking = () => {
  const { trackUserAction } = useAnalytics();
  
  const trackClick = useCallback((elementName: string, elementType: string = 'button', properties?: Record<string, any>) => {
    trackUserAction('click', elementName, { elementType, ...properties });
  }, [trackUserAction]);
  
  const trackHover = useCallback((elementName: string, duration?: number) => {
    trackUserAction('hover', elementName, { duration });
  }, [trackUserAction]);
  
  const trackScroll = useCallback((scrollDepth: number, maxScroll: number) => {
    trackUserAction('scroll', 'page', { scrollDepth, maxScroll });
  }, [trackUserAction]);
  
  return {
    trackClick,
    trackHover,
    trackScroll
  };
};

// Hook for e-commerce tracking
export const useEcommerceTracking = () => {
  const { trackEvent, trackConversion } = useAnalytics();
  
  const trackPurchase = useCallback((orderId: string, items: any[], totalValue: number, properties?: Record<string, any>) => {
    trackConversion('purchase', totalValue, {
      orderId,
      items,
      itemCount: items.length,
      ...properties
    });
  }, [trackConversion]);
  
  const trackAddToCart = useCallback((item: any, properties?: Record<string, any>) => {
    trackEvent('add_to_cart', {
      itemId: item.id,
      itemName: item.name,
      itemPrice: item.price,
      itemCategory: item.category,
      ...properties
    });
  }, [trackEvent]);
  
  const trackRemoveFromCart = useCallback((item: any, properties?: Record<string, any>) => {
    trackEvent('remove_from_cart', {
      itemId: item.id,
      itemName: item.name,
      itemPrice: item.price,
      ...properties
    });
  }, [trackEvent]);
  
  const trackViewItem = useCallback((item: any, properties?: Record<string, any>) => {
    trackEvent('view_item', {
      itemId: item.id,
      itemName: item.name,
      itemPrice: item.price,
      itemCategory: item.category,
      ...properties
    });
  }, [trackEvent]);
  
  const trackSearchEvent = useCallback((searchTerm: string, resultsCount: number, properties?: Record<string, any>) => {
    trackEvent('search', {
      searchTerm,
      resultsCount,
      ...properties
    });
  }, [trackEvent]);
  
  return {
    trackPurchase,
    trackAddToCart,
    trackRemoveFromCart,
    trackViewItem,
    trackSearchEvent
  };
};

// Hook for booking-specific analytics
export const useBookingTracking = () => {
  const { trackEvent, trackConversion } = useAnalytics();
  
  const trackBookingStart = useCallback((serviceId: string, businessId: string, properties?: Record<string, any>) => {
    trackEvent('booking_started', {
      serviceId,
      businessId,
      ...properties
    });
  }, [trackEvent]);
  
  const trackBookingComplete = useCallback((bookingId: string, serviceId: string, businessId: string, value: number, properties?: Record<string, any>) => {
    trackConversion('booking_completed', value, {
      bookingId,
      serviceId,
      businessId,
      ...properties
    });
  }, [trackConversion]);
  
  const trackBookingCancellation = useCallback((bookingId: string, reason?: string, properties?: Record<string, any>) => {
    trackEvent('booking_cancelled', {
      bookingId,
      reason,
      ...properties
    });
  }, [trackEvent]);
  
  const trackServiceView = useCallback((serviceId: string, businessId: string, properties?: Record<string, any>) => {
    trackEvent('service_viewed', {
      serviceId,
      businessId,
      ...properties
    });
  }, [trackEvent]);
  
  const trackBusinessView = useCallback((businessId: string, properties?: Record<string, any>) => {
    trackEvent('business_viewed', {
      businessId,
      ...properties
    });
  }, [trackEvent]);
  
  return {
    trackBookingStart,
    trackBookingComplete,
    trackBookingCancellation,
    trackServiceView,
    trackBusinessView
  };
};

// Hook for performance monitoring
export const usePerformanceTracking = () => {
  const { trackEvent } = useAnalytics();
  
  const trackPageLoad = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        trackEvent('page_load_performance', {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstContentfulPaint: navigation.responseEnd - navigation.requestStart,
          path: window.location.pathname
        });
      }
    }
  }, [trackEvent]);
  
  const trackError = useCallback((error: Error, errorInfo?: any) => {
    trackEvent('javascript_error', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorInfo,
      path: window.location.pathname
    });
  }, [trackEvent]);
  
  useEffect(() => {
    // Track page load performance when component mounts
    const timer = setTimeout(trackPageLoad, 0);
    
    // Track JavaScript errors
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('error', handleError);
    };
  }, [trackPageLoad, trackError]);
  
  return {
    trackPageLoad,
    trackError
  };
};