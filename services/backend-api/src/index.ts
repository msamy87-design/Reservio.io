
// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Import New Relic first, before any other modules
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase, getDatabaseStatus, isDatabaseConnected } from './config/database';
import { logger, stream } from './utils/logger';
import businessesRouter from './routes/businesses';
import bookingsRouter from './routes/bookings';
import authRouter from './routes/auth';
import customerRouter from './routes/customer';
import bizRouter from './routes/biz';
import paymentsRouter from './routes/payments';
import adminRouter from './routes/admin';
import reviewsRouter from './routes/reviews';
import waitlistRouter from './routes/waitlist';
import stripeWebhooksRouter from './routes/webhooks';
import { runSimulatedCronJobs } from './services/notificationService';
import { swaggerSpec, swaggerOptions } from './swagger/swagger.config';
import { performanceMonitoring } from './services/performanceMonitoringService';
import { cacheService } from './services/cacheService';
import { abTestService } from './services/abTestService';
import { abTestMiddleware, createABTestRoutes } from './middleware/abTestMiddleware';
import { pushNotificationService } from './services/pushNotificationService';
import { pushNotificationMiddleware, createPushNotificationRoutes } from './middleware/pushNotificationMiddleware';
import { analyticsService } from './services/analyticsService';
import { analyticsMiddleware, createAnalyticsRoutes, trackBookingAnalytics, trackPaymentAnalytics, trackRegistrationAnalytics } from './middleware/analyticsMiddleware';
import { recommendationEngine } from './services/recommendationEngine';
import { recommendationMiddleware, createRecommendationRoutes, trackRecommendationInteraction } from './middleware/recommendationMiddleware';
import { advancedMarketplaceService } from './services/advancedMarketplaceService';
import { advancedMarketplaceMiddleware, createAdvancedMarketplaceRoutes, trackVerificationStatus } from './middleware/advancedMarketplaceMiddleware';
import { inventoryManagementService } from './services/inventoryManagementService';
import { inventoryMiddleware, createInventoryRoutes, trackInventoryEvents } from './middleware/inventoryMiddleware';
import { businessIntelligenceService } from './services/businessIntelligenceService';
import { businessIntelligenceMiddleware, createBusinessIntelligenceRoutes, trackBIEvents } from './middleware/businessIntelligenceMiddleware';
import { collaborationService } from './services/collaborationService';
import { collaborationMiddleware, createCollaborationRoutes, trackCollaborationEvents } from './middleware/collaborationMiddleware';


// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to database
connectDatabase();

// --- Security Middleware ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting with environment configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});
app.use('/api/', limiter);

// HTTP request logging
app.use(morgan('combined', { stream }));

// Performance monitoring middleware
app.use(performanceMonitoring.createMiddleware());

// A/B testing middleware
app.use(abTestMiddleware);

// Push notification middleware
app.use(pushNotificationMiddleware);

// Analytics middleware
app.use(analyticsMiddleware);

// Recommendation middleware
app.use(recommendationMiddleware);

// Advanced marketplace middleware
app.use(advancedMarketplaceMiddleware);

// Inventory management middleware
app.use(inventoryMiddleware);

// Business intelligence middleware
app.use(businessIntelligenceMiddleware);

// Collaboration middleware
app.use(collaborationMiddleware);

// --- Core Middleware ---
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Cookie parser for refresh tokens
app.use(cookieParser(process.env.COOKIE_SECRET));

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// --- Health Check ---
app.get('/api/health', async (req: express.Request, res: express.Response) => {
  const databaseStatus = getDatabaseStatus();
  const isDbConnected = isDatabaseConnected();
  
  // Determine overall health status
  const isHealthy = isDbConnected;
  const httpStatus = isHealthy ? 200 : 503;
  
  try {
    const performanceSummary = performanceMonitoring.getPerformanceSummary();
    const cacheStats = await cacheService.getStats();
    const abTestSummary = await abTestService.getTestSummary();
    const pushStats = await pushNotificationService.getNotificationStats();
    const pushConfig = pushNotificationService.isConfigured();
    const analyticsStats = await analyticsService.getStats();
    const analyticsConfig = analyticsService.isConfigured();
    const recommendationStats = await recommendationEngine.getStats();
    const recommendationConfig = recommendationEngine.isConfigured();
    const marketplaceStats = await advancedMarketplaceService.getStats();
    const marketplaceConfig = advancedMarketplaceService.isConfigured();
    const inventoryStats = await inventoryManagementService.getStats();
    const inventoryConfig = inventoryManagementService.isConfigured();
    const biStats = await businessIntelligenceService.getStats();
    const biConfig = businessIntelligenceService.isConfigured();
    const collaborationStats = await collaborationService.getStats();
    const collaborationConfig = collaborationService.isConfigured();
    
    res.status(httpStatus).json({ 
      status: isHealthy ? 'ok' : 'degraded', 
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database: {
        connected: isDbConnected,
        ...databaseStatus
      },
      monitoring: performanceSummary,
      cache: cacheStats,
      abTesting: abTestSummary,
      pushNotifications: {
        stats: pushStats,
        configuration: pushConfig
      },
      analytics: {
        stats: analyticsStats,
        configuration: analyticsConfig
      },
      recommendations: {
        stats: recommendationStats,
        configuration: recommendationConfig
      },
      marketplace: {
        stats: marketplaceStats,
        configuration: marketplaceConfig
      },
      inventory: {
        stats: inventoryStats,
        configuration: inventoryConfig
      },
      businessIntelligence: {
        stats: biStats,
        configuration: biConfig
      },
      collaboration: {
        stats: collaborationStats,
        configuration: collaborationConfig
      }
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      database: {
        connected: isDbConnected,
        ...databaseStatus
      }
    });
  }
});

// --- Swagger Documentation ---
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// --- API Root ---
app.get('/api', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'Reservio API is running!',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      business: '/api/biz',
      customer: '/api/customer',
      admin: '/api/admin',
      bookings: '/api/bookings',
      businesses: '/api/businesses',
      reviews: '/api/reviews',
      payments: '/api/payments',
      waitlist: '/api/waitlist',
      webhooks: '/api/webhooks',
      abTesting: '/api/ab',
      pushNotifications: '/api/push',
      analytics: '/api/analytics',
      recommendations: '/api/recommendations',
      marketplace: '/api/marketplace',
      inventory: '/api/inventory',
      businessIntelligence: '/api/bi',
      collaboration: '/api/collaboration'
    }
  });
});

// ⚠️ Webhooks must come BEFORE JSON body parsing
app.use('/api/webhooks', stripeWebhooksRouter);

// JSON/body parsers for normal routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/businesses', trackRecommendationInteraction('business_view'), businessesRouter);
app.use('/api/bookings', trackBookingAnalytics('booking_api'), trackRecommendationInteraction('booking'), bookingsRouter);
app.use('/api/auth', trackRegistrationAnalytics, authRouter);
app.use('/api/customer', customerRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/biz', bizRouter);
app.use('/api/payments', trackPaymentAnalytics('payment_api'), paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/waitlist', waitlistRouter);

// A/B Testing routes
app.use('/api/ab', createABTestRoutes(express));

// Push Notification routes
app.use('/api/push', createPushNotificationRoutes(express));

// Analytics routes
app.use('/api/analytics', createAnalyticsRoutes(express));

// Recommendation routes
app.use('/api/recommendations', createRecommendationRoutes(express));

// Advanced Marketplace routes
app.use('/api/marketplace', trackVerificationStatus(), createAdvancedMarketplaceRoutes(express));

// Inventory Management routes
app.use('/api/inventory', trackInventoryEvents(), createInventoryRoutes(express));

// Business Intelligence routes
app.use('/api/bi', trackBIEvents(), createBusinessIntelligenceRoutes(express));

// Collaboration routes
app.use('/api/collaboration', trackCollaborationEvents(), createCollaborationRoutes(express));


// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Track error with performance monitoring
  performanceMonitoring.trackError(err, {
    endpoint: req.originalUrl,
    userType: (req as any).user?.role,
    userId: (req as any).user?.id,
    additionalData: {
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });
  
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// --- Start Server ---
const server = app.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
  
  // Initialize Socket.IO for real-time collaboration
  collaborationService.initializeSocketIO(server);
  
  // Start background services
  runSimulatedCronJobs();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await cacheService.disconnect();
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await cacheService.disconnect();
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
