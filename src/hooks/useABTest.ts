import { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';

export interface ABTestAssignment {
  testId: string;
  variantId: string;
  config?: Record<string, any>;
}

export interface ABTestContextValue {
  assignments: ABTestAssignment[];
  getVariant: (testId: string, defaultVariant?: string) => string | null;
  getVariantConfig: (testId: string) => Record<string, any> | null;
  trackEvent: (testId: string, eventType: string, eventData?: Record<string, any>) => void;
  isInTest: (testId: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

const ABTestContext = createContext<ABTestContextValue | null>(null);

// Provider component
export interface ABTestProviderProps {
  children: ReactNode;
  apiBaseUrl?: string;
  userId?: string;
  enableAutoTracking?: boolean;
}

export const ABTestProvider: React.FC<ABTestProviderProps> = ({
  children,
  apiBaseUrl = '/api/ab',
  userId,
  enableAutoTracking = true
}) => {
  const [assignments, setAssignments] = useState<ABTestAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's test assignments
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${apiBaseUrl}/my/tests`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load A/B tests: ${response.statusText}`);
        }

        const data = await response.json();
        setAssignments(data);
      } catch (err) {
        console.error('Error loading A/B test assignments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load A/B tests');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignments();
  }, [apiBaseUrl, userId]);

  // Track page views automatically
  useEffect(() => {
    if (!enableAutoTracking || assignments.length === 0) return;

    const trackPageView = async () => {
      for (const assignment of assignments) {
        try {
          await fetch(`${apiBaseUrl}/tests/${assignment.testId}/events`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              eventType: 'page_view',
              eventData: {
                path: window.location.pathname,
                search: window.location.search,
                referrer: document.referrer
              }
            })
          });
        } catch (err) {
          console.error('Error tracking page view:', err);
        }
      }
    };

    trackPageView();
  }, [assignments, apiBaseUrl, enableAutoTracking]);

  const getVariant = useCallback((testId: string, defaultVariant?: string): string | null => {
    const assignment = assignments.find(a => a.testId === testId);
    return assignment?.variantId || defaultVariant || null;
  }, [assignments]);

  const getVariantConfig = useCallback((testId: string): Record<string, any> | null => {
    const assignment = assignments.find(a => a.testId === testId);
    return assignment?.config || null;
  }, [assignments]);

  const trackEvent = useCallback(async (
    testId: string,
    eventType: string,
    eventData?: Record<string, any>
  ) => {
    try {
      await fetch(`${apiBaseUrl}/tests/${testId}/events`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType,
          eventData
        })
      });
    } catch (err) {
      console.error('Error tracking A/B test event:', err);
    }
  }, [apiBaseUrl]);

  const isInTest = useCallback((testId: string): boolean => {
    return assignments.some(a => a.testId === testId);
  }, [assignments]);

  const contextValue: ABTestContextValue = {
    assignments,
    getVariant,
    getVariantConfig,
    trackEvent,
    isInTest,
    isLoading,
    error
  };

  return (
    <ABTestContext.Provider value={contextValue}>
      {children}
    </ABTestContext.Provider>
  );
};

// Main hook
export const useABTest = (testId?: string) => {
  const context = useContext(ABTestContext);
  
  if (!context) {
    throw new Error('useABTest must be used within an ABTestProvider');
  }

  if (!testId) {
    return context;
  }

  const variant = context.getVariant(testId);
  const config = context.getVariantConfig(testId);
  const isInTest = context.isInTest(testId);

  const trackEvent = useCallback((eventType: string, eventData?: Record<string, any>) => {
    context.trackEvent(testId, eventType, eventData);
  }, [context, testId]);

  return {
    variant,
    config,
    isInTest,
    trackEvent,
    isLoading: context.isLoading,
    error: context.error
  };
};

// Specific hooks for common use cases
export const useABTestVariant = (testId: string, defaultVariant?: string) => {
  const { variant, isLoading } = useABTest(testId);
  return isLoading ? defaultVariant : (variant || defaultVariant);
};

export const useABTestConfig = (testId: string) => {
  const { config, isLoading } = useABTest(testId);
  return isLoading ? {} : (config || {});
};

// Component wrapper hook
export const useABTestComponent = <T extends Record<string, any>>(
  testId: string,
  variants: Record<string, T>,
  defaultVariant?: string
) => {
  const { variant, trackEvent, isLoading } = useABTest(testId);
  
  const currentVariant = variant || defaultVariant || Object.keys(variants)[0];
  const variantConfig = variants[currentVariant] || variants[Object.keys(variants)[0]];

  const trackClick = useCallback(() => {
    trackEvent('click', { variant: currentVariant });
  }, [trackEvent, currentVariant]);

  const trackConversion = useCallback((conversionData?: Record<string, any>) => {
    trackEvent('conversion', { variant: currentVariant, ...conversionData });
  }, [trackEvent, currentVariant]);

  const trackCustomEvent = useCallback((eventType: string, eventData?: Record<string, any>) => {
    trackEvent(eventType, { variant: currentVariant, ...eventData });
  }, [trackEvent, currentVariant]);

  return {
    variant: currentVariant,
    config: variantConfig,
    trackClick,
    trackConversion,
    trackCustomEvent,
    isLoading
  };
};

// Performance tracking hook
export const useABTestPerformance = (testId: string) => {
  const { trackEvent } = useABTest(testId);

  const trackTiming = useCallback((timingName: string, duration: number) => {
    trackEvent('timing', {
      timingName,
      duration,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    trackEvent('error', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  const withTiming = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    timingName: string
  ): T => {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const start = performance.now();
      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result.finally(() => {
          trackTiming(timingName, performance.now() - start);
        }) as ReturnType<T>;
      } else {
        trackTiming(timingName, performance.now() - start);
        return result;
      }
    }) as T;
  }, [trackTiming]);

  return {
    trackTiming,
    trackError,
    withTiming
  };
};

// Utility functions
export const createABTestUrl = (baseUrl: string, testId: string, params?: Record<string, any>) => {
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('ab_test', testId);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  
  return url.toString();
};

export const parseABTestParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const abTestParams: Record<string, string> = {};
  
  for (const [key, value] of params.entries()) {
    if (key.startsWith('ab_')) {
      abTestParams[key] = value;
    }
  }
  
  return abTestParams;
};