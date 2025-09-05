import { Request, Response, NextFunction } from 'express';
import { abTestService, ABTest } from '../services/abTestService';
import { performanceMonitoring } from '../services/performanceMonitoringService';

declare global {
  namespace Express {
    interface Request {
      abTests?: {
        getVariant: (testId: string) => Promise<string | null>;
        getVariantConfig: (testId: string) => Promise<Record<string, any> | null>;
        trackEvent: (testId: string, eventType: string, eventData?: Record<string, any>) => Promise<void>;
        isInTest: (testId: string) => Promise<boolean>;
        getAllAssignments: () => Promise<Array<{ testId: string; variantId: string }>>;
      };
    }
  }
}

interface ABTestMiddlewareOptions {
  userIdExtractor?: (req: Request) => string;
  contextExtractor?: (req: Request) => {
    userType?: string;
    country?: string;
    city?: string;
    deviceType?: string;
    platform?: string;
    customAttributes?: Record<string, any>;
  };
  enableAutoTracking?: boolean;
  trackPageViews?: boolean;
}

export const createABTestMiddleware = (options: ABTestMiddlewareOptions = {}) => {
  const {
    userIdExtractor = (req) => req.user?.id || req.sessionID || req.ip,
    contextExtractor = (req) => ({
      userType: req.user?.type || 'guest',
      country: req.headers['cf-ipcountry'] as string || req.get('X-Country'),
      deviceType: getDeviceType(req.get('User-Agent')),
      platform: 'web'
    }),
    enableAutoTracking = true,
    trackPageViews = true
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const userId = userIdExtractor(req);
    const context = contextExtractor(req);

    // Create A/B testing interface for the request
    req.abTests = {
      async getVariant(testId: string): Promise<string | null> {
        try {
          const assignment = await abTestService.assignUser(testId, userId, {
            ...context,
            sessionId: req.sessionID,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
          });
          return assignment?.variantId || null;
        } catch (error) {
          console.error('Error getting A/B test variant:', error);
          return null;
        }
      },

      async getVariantConfig(testId: string): Promise<Record<string, any> | null> {
        try {
          return await abTestService.getVariantConfig(testId, userId);
        } catch (error) {
          console.error('Error getting A/B test config:', error);
          return null;
        }
      },

      async trackEvent(testId: string, eventType: string, eventData?: Record<string, any>): Promise<void> {
        try {
          const assignment = await abTestService.getUserAssignment(testId, userId);
          if (assignment) {
            await abTestService.trackEvent(
              testId,
              assignment.variantId,
              userId,
              eventType,
              eventData,
              req.sessionID
            );
          }
        } catch (error) {
          console.error('Error tracking A/B test event:', error);
        }
      },

      async isInTest(testId: string): Promise<boolean> {
        try {
          const assignment = await abTestService.getUserAssignment(testId, userId);
          return assignment !== null;
        } catch (error) {
          console.error('Error checking A/B test assignment:', error);
          return false;
        }
      },

      async getAllAssignments(): Promise<Array<{ testId: string; variantId: string }>> {
        try {
          const assignments = await abTestService.getUserAssignments(userId);
          return assignments.map(a => ({ testId: a.testId, variantId: a.variantId }));
        } catch (error) {
          console.error('Error getting A/B test assignments:', error);
          return [];
        }
      }
    };

    // Auto-track page views if enabled
    if (enableAutoTracking && trackPageViews && req.method === 'GET') {
      try {
        const activeTests = abTestService.getActiveTests();
        for (const test of activeTests) {
          const assignment = await abTestService.getUserAssignment(test.id, userId);
          if (assignment) {
            await abTestService.trackEvent(
              test.id,
              assignment.variantId,
              userId,
              'page_view',
              {
                path: req.path,
                query: req.query,
                referrer: req.get('Referer')
              },
              req.sessionID
            );
          }
        }
      } catch (error) {
        console.error('Error auto-tracking page view:', error);
      }
    }

    // Track performance
    performanceMonitoring.trackCustomEvent('ab_test_middleware', {
      duration: Date.now() - startTime,
      userId: userId.slice(0, 8) // Partial hash for privacy
    });

    next();
  };
};

// Specific middleware for different routes
export const abTestMiddleware = createABTestMiddleware();

// API endpoints for A/B test management
export const createABTestRoutes = (app: any) => {
  const router = app.Router();

  // Create test
  router.post('/tests', async (req: Request, res: Response) => {
    try {
      const test = await abTestService.createTest(req.body);
      res.json(test);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to create test' 
      });
    }
  });

  // Get all tests
  router.get('/tests', async (req: Request, res: Response) => {
    try {
      const tests = abTestService.getAllTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get tests' 
      });
    }
  });

  // Get specific test
  router.get('/tests/:testId', async (req: Request, res: Response) => {
    try {
      const test = abTestService.getTest(req.params.testId);
      if (!test) {
        return res.status(404).json({ error: 'Test not found' });
      }
      res.json(test);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get test' 
      });
    }
  });

  // Update test
  router.put('/tests/:testId', async (req: Request, res: Response) => {
    try {
      const test = await abTestService.updateTest(req.params.testId, req.body);
      res.json(test);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to update test' 
      });
    }
  });

  // Delete test
  router.delete('/tests/:testId', async (req: Request, res: Response) => {
    try {
      await abTestService.deleteTest(req.params.testId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to delete test' 
      });
    }
  });

  // Get test results
  router.get('/tests/:testId/results', async (req: Request, res: Response) => {
    try {
      const results = await abTestService.getTestResults(req.params.testId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get test results' 
      });
    }
  });

  // Track event
  router.post('/tests/:testId/events', async (req: Request, res: Response) => {
    try {
      const { eventType, eventData } = req.body;
      if (req.abTests) {
        await req.abTests.trackEvent(req.params.testId, eventType, eventData);
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to track event' 
      });
    }
  });

  // Get user's test assignments
  router.get('/my/tests', async (req: Request, res: Response) => {
    try {
      if (!req.abTests) {
        return res.status(500).json({ error: 'A/B testing not initialized' });
      }
      
      const assignments = await req.abTests.getAllAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get assignments' 
      });
    }
  });

  // Get test summary/dashboard
  router.get('/dashboard', async (req: Request, res: Response) => {
    try {
      const summary = await abTestService.getTestSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get dashboard data' 
      });
    }
  });

  return router;
};

// Response enhancer to include A/B test info
export const enhanceResponseWithABTests = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function(body: any) {
      // Add A/B test info to responses if requested
      if (req.query.include_ab_tests && req.abTests) {
        req.abTests.getAllAssignments().then(assignments => {
          const enhancedBody = {
            ...body,
            _abTests: assignments
          };
          return originalJson.call(this, enhancedBody);
        }).catch(() => {
          return originalJson.call(this, body);
        });
      } else {
        return originalJson.call(this, body);
      }
    };

    next();
  };
};

// Helper functions
function getDeviceType(userAgent?: string): 'desktop' | 'mobile' | 'tablet' {
  if (!userAgent) return 'desktop';
  
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

// React integration helpers (for server-side rendering)
export const getServerSideABTestProps = async (
  testIds: string[],
  userId: string,
  context: any = {}
): Promise<Record<string, any>> => {
  const props: Record<string, any> = {};
  
  for (const testId of testIds) {
    try {
      const assignment = await abTestService.assignUser(testId, userId, context);
      if (assignment) {
        const config = await abTestService.getVariantConfig(testId, userId);
        props[testId] = {
          variantId: assignment.variantId,
          config: config || {}
        };
      }
    } catch (error) {
      console.error(`Error getting server-side props for test ${testId}:`, error);
    }
  }
  
  return props;
};