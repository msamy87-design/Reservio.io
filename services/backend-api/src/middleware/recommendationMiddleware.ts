import { Request, Response, NextFunction } from 'express';
import { recommendationEngine } from '../services/recommendationEngine';
import { logger } from '../utils/logger';

// Extend Request interface to include recommendation methods
declare global {
  namespace Express {
    interface Request {
      recommendations: {
        getPersonalizedRecommendations: (options?: any) => Promise<any[]>;
        analyzeSearchIntent: (query: string) => Promise<any>;
        trackInteraction: (serviceId: string, interactionType: string) => Promise<void>;
        generateBusinessInsights: (businessId: string) => Promise<any>;
        buildUserProfile: () => Promise<any>;
      };
    }
  }
}

// Recommendation middleware
export const recommendationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add recommendation methods to request object
    req.recommendations = {
      // Get personalized recommendations for current user
      getPersonalizedRecommendations: async (options: any = {}) => {
        try {
          const userId = (req as any).user?.id;
          if (!userId) {
            logger.warn('No user ID found for personalized recommendations');
            return [];
          }

          return await recommendationEngine.getRecommendations(userId, {
            limit: options.limit || 10,
            categories: options.categories,
            location: options.location,
            priceRange: options.priceRange,
            timeSlot: options.timeSlot
          });
        } catch (error) {
          logger.error('Failed to get personalized recommendations:', error);
          return [];
        }
      },

      // Analyze search query intent
      analyzeSearchIntent: async (query: string) => {
        try {
          return await recommendationEngine.analyzeSearchIntent(query);
        } catch (error) {
          logger.error('Failed to analyze search intent:', error);
          return { intent: 'unknown', entities: [], confidence: 0 };
        }
      },

      // Track user interaction with services
      trackInteraction: async (serviceId: string, interactionType: string) => {
        try {
          const userId = (req as any).user?.id;
          if (!userId) return;

          // Log interaction for learning
          logger.info('User interaction tracked:', {
            userId,
            serviceId,
            interactionType,
            timestamp: new Date(),
            sessionId: req.sessionID,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
          });

          // In production, this would update the recommendation model
        } catch (error) {
          logger.error('Failed to track interaction:', error);
        }
      },

      // Generate business intelligence insights
      generateBusinessInsights: async (businessId: string) => {
        try {
          // Check if user has permission for this business
          const userBusinessId = (req as any).user?.businessId;
          const userRole = (req as any).user?.role;
          
          if (userRole !== 'admin' && userBusinessId !== businessId) {
            throw new Error('Unauthorized access to business insights');
          }

          return await recommendationEngine.generateBusinessIntelligence(businessId);
        } catch (error) {
          logger.error('Failed to generate business insights:', error);
          throw error;
        }
      },

      // Build or update user profile
      buildUserProfile: async () => {
        try {
          const userId = (req as any).user?.id;
          if (!userId) {
            throw new Error('User ID required for profile building');
          }

          return await recommendationEngine.buildUserProfile(userId);
        } catch (error) {
          logger.error('Failed to build user profile:', error);
          throw error;
        }
      }
    };

    next();
  } catch (error) {
    logger.error('Recommendation middleware error:', error);
    // Don't block the request if recommendations fail
    req.recommendations = {
      getPersonalizedRecommendations: async () => [],
      analyzeSearchIntent: async () => ({ intent: 'unknown', entities: [], confidence: 0 }),
      trackInteraction: async () => {},
      generateBusinessInsights: async () => { throw new Error('Recommendations unavailable'); },
      buildUserProfile: async () => { throw new Error('Recommendations unavailable'); }
    };
    next();
  }
};

// Create recommendation routes
export const createRecommendationRoutes = (express: any) => {
  const router = express.Router();

  // Get personalized recommendations
  router.get('/personalized', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const options = {
        limit: parseInt(req.query.limit as string) || 10,
        categories: req.query.categories ? (req.query.categories as string).split(',') : undefined,
        location: req.query.location ? JSON.parse(req.query.location as string) : undefined,
        priceRange: req.query.priceRange ? JSON.parse(req.query.priceRange as string) : undefined,
        timeSlot: req.query.timeSlot as string
      };

      const recommendations = await req.recommendations.getPersonalizedRecommendations(options);
      res.json({ recommendations, count: recommendations.length });
    } catch (error) {
      logger.error('Failed to get personalized recommendations:', error);
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  });

  // Analyze search intent
  router.post('/search-intent', async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const intent = await req.recommendations.analyzeSearchIntent(query);
      res.json(intent);
    } catch (error) {
      logger.error('Failed to analyze search intent:', error);
      res.status(500).json({ error: 'Failed to analyze search intent' });
    }
  });

  // Track user interaction
  router.post('/interactions', async (req: Request, res: Response) => {
    try {
      const { serviceId, interactionType } = req.body;
      
      if (!serviceId || !interactionType) {
        return res.status(400).json({ error: 'Service ID and interaction type are required' });
      }

      await req.recommendations.trackInteraction(serviceId, interactionType);
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to track interaction:', error);
      res.status(500).json({ error: 'Failed to track interaction' });
    }
  });

  // Get business intelligence insights (business owners and admins only)
  router.get('/business-insights/:businessId', async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const insights = await req.recommendations.generateBusinessInsights(businessId);
      res.json(insights);
    } catch (error) {
      logger.error('Failed to get business insights:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to get business insights' });
    }
  });

  // Build or update user profile
  router.post('/profile/build', async (req: Request, res: Response) => {
    try {
      const profile = await req.recommendations.buildUserProfile();
      res.json(profile);
    } catch (error) {
      logger.error('Failed to build user profile:', error);
      res.status(500).json({ error: 'Failed to build user profile' });
    }
  });

  // Get trending services
  router.get('/trending', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const location = req.query.location ? JSON.parse(req.query.location as string) : undefined;
      const limit = parseInt(req.query.limit as string) || 10;

      // Get trending services based on recent booking patterns
      const trendingServices = await getTrendingServices({ category, location, limit });
      res.json({ services: trendingServices, count: trendingServices.length });
    } catch (error) {
      logger.error('Failed to get trending services:', error);
      res.status(500).json({ error: 'Failed to get trending services' });
    }
  });

  // Get similar services
  router.get('/similar/:serviceId', async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      const similarServices = await getSimilarServices(serviceId, limit);
      res.json({ services: similarServices, count: similarServices.length });
    } catch (error) {
      logger.error('Failed to get similar services:', error);
      res.status(500).json({ error: 'Failed to get similar services' });
    }
  });

  // Smart search with recommendations
  router.post('/smart-search', async (req: Request, res: Response) => {
    try {
      const { query, filters = {}, location, limit = 20 } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Analyze search intent
      const intent = await req.recommendations.analyzeSearchIntent(query);
      
      // Get personalized recommendations if user is authenticated
      const userId = (req as any).user?.id;
      let recommendations = [];
      
      if (userId) {
        recommendations = await req.recommendations.getPersonalizedRecommendations({
          limit: Math.floor(limit * 0.3), // 30% personalized
          categories: intent.category ? [intent.category] : undefined,
          location,
          ...filters
        });
      }

      // Get general search results
      const searchResults = await performSmartSearch(query, intent, {
        ...filters,
        location,
        limit: limit - recommendations.length
      });

      res.json({
        query,
        intent,
        results: [...recommendations, ...searchResults],
        count: recommendations.length + searchResults.length,
        personalized: recommendations.length,
        general: searchResults.length
      });
    } catch (error) {
      logger.error('Failed to perform smart search:', error);
      res.status(500).json({ error: 'Failed to perform smart search' });
    }
  });

  // Get recommendation engine configuration and stats
  router.get('/config', async (req: Request, res: Response) => {
    try {
      const config = recommendationEngine.isConfigured();
      const stats = await recommendationEngine.getStats();
      
      res.json({
        configured: config.nlp && config.database,
        features: config,
        stats
      });
    } catch (error) {
      logger.error('Failed to get recommendation config:', error);
      res.status(500).json({ error: 'Failed to get configuration' });
    }
  });

  // Health check for recommendation engine
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const config = recommendationEngine.isConfigured();
      const stats = await recommendationEngine.getStats();
      
      res.json({
        status: 'ok',
        configuration: config,
        statistics: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Recommendation health check failed:', error);
      res.status(500).json({ error: 'Recommendation engine unavailable' });
    }
  });

  return router;
};

// Helper functions
async function getTrendingServices(options: {
  category?: string;
  location?: { lat: number; lng: number; radius: number };
  limit: number;
}): Promise<any[]> {
  try {
    // This would query the database for trending services
    // Based on recent booking patterns, ratings, and growth
    return [];
  } catch (error) {
    logger.error('Failed to get trending services:', error);
    return [];
  }
}

async function getSimilarServices(serviceId: string, limit: number): Promise<any[]> {
  try {
    // This would find services similar to the given service
    // Based on category, features, and user behavior patterns
    return [];
  } catch (error) {
    logger.error('Failed to get similar services:', error);
    return [];
  }
}

async function performSmartSearch(
  query: string, 
  intent: any, 
  options: any
): Promise<any[]> {
  try {
    // This would perform intelligent search using the analyzed intent
    // and combine multiple ranking factors
    return [];
  } catch (error) {
    logger.error('Failed to perform smart search:', error);
    return [];
  }
}

// Interaction tracking middleware for specific routes
export const trackRecommendationInteraction = (interactionType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const originalJson = res.json;
      
      res.json = function(body: any) {
        // Track interaction if the response is successful
        if (res.statusCode < 400) {
          const serviceId = body.service?.id || body.id || req.params.serviceId;
          if (serviceId) {
            req.recommendations?.trackInteraction(serviceId, interactionType);
          }
        }
        
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      logger.error('Recommendation interaction tracking error:', error);
      next();
    }
  };
};