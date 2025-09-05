import { Request, Response, NextFunction } from 'express';
import { advancedMarketplaceService } from '../services/advancedMarketplaceService';
import { logger } from '../utils/logger';

// Extend Request interface to include advanced marketplace methods
declare global {
  namespace Express {
    interface Request {
      marketplace: {
        getCategoryInsights: (categorySlug: string) => Promise<any>;
        verifyService: (serviceId: string, verificationType: string) => Promise<any>;
        createAdvancedReview: (data: any) => Promise<any>;
        analyzeReviewSentiment: (content: string) => Promise<any>;
        generateMarketplaceInsights: (category?: string) => Promise<any>;
        createPromotion: (data: any) => Promise<any>;
        compareServices: (serviceIds: string[]) => Promise<any>;
      };
    }
  }
}

// Advanced Marketplace middleware
export const advancedMarketplaceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add marketplace methods to request object
    req.marketplace = {
      // Get category insights with trending data
      getCategoryInsights: async (categorySlug: string) => {
        try {
          const category = await advancedMarketplaceService.getCategoryBySlug(categorySlug);
          if (!category) {
            throw new Error('Category not found');
          }

          const insights = await advancedMarketplaceService.generateMarketplaceInsights(categorySlug);
          return { category, insights };
        } catch (error) {
          logger.error('Failed to get category insights:', error);
          throw error;
        }
      },

      // Verify a service with external providers
      verifyService: async (serviceId: string, verificationType: string) => {
        try {
          const businessId = (req as any).user?.businessId;
          const userRole = (req as any).user?.role;
          
          if (!businessId && userRole !== 'admin') {
            throw new Error('Unauthorized: Business verification required');
          }

          return await advancedMarketplaceService.submitVerification({
            serviceId,
            businessId: businessId || 'admin',
            verificationType: verificationType as any,
            verificationProvider: 'internal',
            documents: []
          });
        } catch (error) {
          logger.error('Failed to verify service:', error);
          throw error;
        }
      },

      // Create an advanced review with AI analysis
      createAdvancedReview: async (data: any) => {
        try {
          const customerId = (req as any).user?.id;
          if (!customerId) {
            throw new Error('Authentication required for reviews');
          }

          const reviewData = {
            ...data,
            customerId,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          return await advancedMarketplaceService.createAdvancedReview(reviewData);
        } catch (error) {
          logger.error('Failed to create advanced review:', error);
          throw error;
        }
      },

      // Analyze review sentiment
      analyzeReviewSentiment: async (content: string) => {
        try {
          return await advancedMarketplaceService.analyzeReviewSentiment(content);
        } catch (error) {
          logger.error('Failed to analyze review sentiment:', error);
          return { sentiment: 'neutral', confidence: 0, aspects: [] };
        }
      },

      // Generate marketplace insights
      generateMarketplaceInsights: async (category?: string) => {
        try {
          return await advancedMarketplaceService.generateMarketplaceInsights(category);
        } catch (error) {
          logger.error('Failed to generate marketplace insights:', error);
          throw error;
        }
      },

      // Create a promotion
      createPromotion: async (data: any) => {
        try {
          const businessId = (req as any).user?.businessId;
          const userRole = (req as any).user?.role;
          
          if (!businessId && userRole !== 'admin') {
            throw new Error('Unauthorized: Business access required');
          }

          const promotionData = {
            ...data,
            businessId: businessId || 'admin',
            createdBy: (req as any).user?.id,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          return await advancedMarketplaceService.createPromotion(promotionData);
        } catch (error) {
          logger.error('Failed to create promotion:', error);
          throw error;
        }
      },

      // Compare multiple services
      compareServices: async (serviceIds: string[]) => {
        try {
          if (!serviceIds || serviceIds.length < 2) {
            throw new Error('At least 2 services required for comparison');
          }

          return await advancedMarketplaceService.compareServices(serviceIds);
        } catch (error) {
          logger.error('Failed to compare services:', error);
          throw error;
        }
      }
    };

    next();
  } catch (error) {
    logger.error('Advanced marketplace middleware error:', error);
    // Don't block the request if marketplace fails
    req.marketplace = {
      getCategoryInsights: async () => { throw new Error('Marketplace unavailable'); },
      verifyService: async () => { throw new Error('Marketplace unavailable'); },
      createAdvancedReview: async () => { throw new Error('Marketplace unavailable'); },
      analyzeReviewSentiment: async () => ({ sentiment: 'neutral', confidence: 0, aspects: [] }),
      generateMarketplaceInsights: async () => { throw new Error('Marketplace unavailable'); },
      createPromotion: async () => { throw new Error('Marketplace unavailable'); },
      compareServices: async () => { throw new Error('Marketplace unavailable'); }
    };
    next();
  }
};

// Create advanced marketplace routes
export const createAdvancedMarketplaceRoutes = (express: any) => {
  const router = express.Router();

  // Category Management Routes
  
  // Get all categories with hierarchy
  router.get('/categories', async (req: Request, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await advancedMarketplaceService.getAllCategories(includeInactive);
      res.json({ categories, count: categories.length });
    } catch (error) {
      logger.error('Failed to get categories:', error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  });

  // Get category by slug with insights
  router.get('/categories/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const insights = await req.marketplace.getCategoryInsights(slug);
      res.json(insights);
    } catch (error) {
      logger.error('Failed to get category insights:', error);
      res.status(404).json({ error: 'Category not found' });
    }
  });

  // Create new category (admin only)
  router.post('/categories', async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const category = await advancedMarketplaceService.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      logger.error('Failed to create category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  // Update category (admin only)
  router.put('/categories/:slug', async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { slug } = req.params;
      const category = await advancedMarketplaceService.updateCategory(slug, req.body);
      res.json(category);
    } catch (error) {
      logger.error('Failed to update category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  // Service Verification Routes

  // Submit service for verification
  router.post('/services/:serviceId/verify', async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;
      const { verificationType } = req.body;
      
      const verification = await req.marketplace.verifyService(serviceId, verificationType);
      res.status(201).json(verification);
    } catch (error) {
      logger.error('Failed to submit verification:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to submit verification' });
    }
  });

  // Get service verification status
  router.get('/services/:serviceId/verification', async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;
      const verifications = await advancedMarketplaceService.getServiceVerification(serviceId);
      res.json({ verifications, count: verifications.length });
    } catch (error) {
      logger.error('Failed to get verification status:', error);
      res.status(500).json({ error: 'Failed to get verification status' });
    }
  });

  // Advanced Review Routes

  // Create advanced review
  router.post('/reviews/advanced', async (req: Request, res: Response) => {
    try {
      const review = await req.marketplace.createAdvancedReview(req.body);
      res.status(201).json(review);
    } catch (error) {
      logger.error('Failed to create advanced review:', error);
      res.status(error.message.includes('required') ? 401 : 500)
        .json({ error: error.message || 'Failed to create review' });
    }
  });

  // Analyze review sentiment
  router.post('/reviews/analyze-sentiment', async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Review content is required' });
      }

      const sentiment = await req.marketplace.analyzeReviewSentiment(content);
      res.json(sentiment);
    } catch (error) {
      logger.error('Failed to analyze sentiment:', error);
      res.status(500).json({ error: 'Failed to analyze sentiment' });
    }
  });

  // Get service reviews with advanced analytics
  router.get('/services/:serviceId/reviews/advanced', async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const reviews = await advancedMarketplaceService.getAdvancedReviews(serviceId, page, limit);
      res.json(reviews);
    } catch (error) {
      logger.error('Failed to get advanced reviews:', error);
      res.status(500).json({ error: 'Failed to get reviews' });
    }
  });

  // Promotion Management Routes

  // Create promotion
  router.post('/promotions', async (req: Request, res: Response) => {
    try {
      const promotion = await req.marketplace.createPromotion(req.body);
      res.status(201).json(promotion);
    } catch (error) {
      logger.error('Failed to create promotion:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to create promotion' });
    }
  });

  // Get active promotions
  router.get('/promotions/active', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const location = req.query.location ? JSON.parse(req.query.location as string) : undefined;
      
      const promotions = await advancedMarketplaceService.getActivePromotions({
        category,
        location
      });
      res.json({ promotions, count: promotions.length });
    } catch (error) {
      logger.error('Failed to get active promotions:', error);
      res.status(500).json({ error: 'Failed to get promotions' });
    }
  });

  // Service Comparison Routes

  // Compare services
  router.post('/compare', async (req: Request, res: Response) => {
    try {
      const { serviceIds } = req.body;
      const comparison = await req.marketplace.compareServices(serviceIds);
      res.json(comparison);
    } catch (error) {
      logger.error('Failed to compare services:', error);
      res.status(400).json({ error: error.message || 'Failed to compare services' });
    }
  });

  // Marketplace Insights Routes

  // Get marketplace insights
  router.get('/insights', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const insights = await req.marketplace.generateMarketplaceInsights(category);
      res.json(insights);
    } catch (error) {
      logger.error('Failed to get marketplace insights:', error);
      res.status(500).json({ error: 'Failed to get insights' });
    }
  });

  // Get trending services
  router.get('/trending', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const location = req.query.location ? JSON.parse(req.query.location as string) : undefined;
      const timeframe = req.query.timeframe as string || '7d';

      const trending = await advancedMarketplaceService.getTrendingServices({
        category,
        location,
        timeframe
      });
      res.json({ services: trending, count: trending.length });
    } catch (error) {
      logger.error('Failed to get trending services:', error);
      res.status(500).json({ error: 'Failed to get trending services' });
    }
  });

  // Health check for advanced marketplace
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const isConfigured = advancedMarketplaceService.isConfigured();
      const stats = await advancedMarketplaceService.getStats();
      
      res.json({
        status: 'ok',
        configuration: isConfigured,
        statistics: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Advanced marketplace health check failed:', error);
      res.status(500).json({ error: 'Advanced marketplace unavailable' });
    }
  });

  return router;
};

// Verification tracking middleware for specific routes
export const trackVerificationStatus = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const originalJson = res.json;
      
      res.json = function(body: any) {
        // Track verification interactions if response is successful
        if (res.statusCode < 400) {
          const serviceId = body.service?.id || body.id || req.params.serviceId;
          if (serviceId) {
            logger.info('Service verification interaction:', {
              serviceId,
              action: req.method,
              endpoint: req.path,
              userId: (req as any).user?.id,
              timestamp: new Date()
            });
          }
        }
        
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      logger.error('Verification tracking error:', error);
      next();
    }
  };
};