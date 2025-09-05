import { Request, Response, NextFunction } from 'express';
import { inventoryManagementService } from '../services/inventoryManagementService';
import { logger } from '../utils/logger';

// Extend Request interface to include inventory methods
declare global {
  namespace Express {
    interface Request {
      inventory: {
        createItem: (data: any) => Promise<any>;
        updateItem: (itemId: string, updates: any) => Promise<any>;
        getItem: (itemId: string) => Promise<any>;
        getBusinessInventory: (filters?: any) => Promise<any[]>;
        generateForecast: (itemId: string, days?: number) => Promise<any>;
        optimizeInventory: () => Promise<any>;
        updateDynamicPricing: (itemId: string) => Promise<number | null>;
        createAlert: (itemId: string, alertType: string, severity: string, message: string, action: string) => Promise<any>;
        getAlerts: (filters?: any) => Promise<any[]>;
        analyzeItemPerformance: (itemId: string) => Promise<any>;
        getInventoryInsights: () => Promise<any>;
      };
    }
  }
}

// Inventory Management middleware
export const inventoryMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = (req as any).user?.businessId;
    const userRole = (req as any).user?.role;

    // Add inventory methods to request object
    req.inventory = {
      // Create new inventory item
      createItem: async (data: any) => {
        try {
          if (!businessId && userRole !== 'admin') {
            throw new Error('Business access required for inventory management');
          }

          const itemData = {
            ...data,
            businessId: businessId || 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          return await inventoryManagementService.createInventoryItem(itemData);
        } catch (error) {
          logger.error('Failed to create inventory item:', error);
          throw error;
        }
      },

      // Update inventory item
      updateItem: async (itemId: string, updates: any) => {
        try {
          const item = await inventoryManagementService.getInventoryItem(itemId);
          if (!item) {
            throw new Error('Inventory item not found');
          }

          // Check permissions
          if (userRole !== 'admin' && item.businessId !== businessId) {
            throw new Error('Unauthorized access to inventory item');
          }

          return await inventoryManagementService.updateInventoryItem(itemId, updates);
        } catch (error) {
          logger.error('Failed to update inventory item:', error);
          throw error;
        }
      },

      // Get inventory item
      getItem: async (itemId: string) => {
        try {
          const item = await inventoryManagementService.getInventoryItem(itemId);
          if (!item) {
            return null;
          }

          // Check permissions
          if (userRole !== 'admin' && item.businessId !== businessId) {
            throw new Error('Unauthorized access to inventory item');
          }

          return item;
        } catch (error) {
          logger.error('Failed to get inventory item:', error);
          throw error;
        }
      },

      // Get business inventory
      getBusinessInventory: async (filters: any = {}) => {
        try {
          const targetBusinessId = userRole === 'admin' ? filters.businessId || businessId : businessId;
          
          if (!targetBusinessId) {
            throw new Error('Business ID required');
          }

          return await inventoryManagementService.getBusinessInventory(targetBusinessId, filters);
        } catch (error) {
          logger.error('Failed to get business inventory:', error);
          return [];
        }
      },

      // Generate demand forecast
      generateForecast: async (itemId: string, days: number = 30) => {
        try {
          const item = await inventoryManagementService.getInventoryItem(itemId);
          if (!item) {
            throw new Error('Inventory item not found');
          }

          // Check permissions
          if (userRole !== 'admin' && item.businessId !== businessId) {
            throw new Error('Unauthorized access to inventory item');
          }

          return await inventoryManagementService.generateDemandForecast(itemId, days);
        } catch (error) {
          logger.error('Failed to generate forecast:', error);
          throw error;
        }
      },

      // Optimize inventory
      optimizeInventory: async () => {
        try {
          const targetBusinessId = businessId;
          
          if (!targetBusinessId) {
            throw new Error('Business ID required for optimization');
          }

          return await inventoryManagementService.optimizeInventory(targetBusinessId);
        } catch (error) {
          logger.error('Failed to optimize inventory:', error);
          throw error;
        }
      },

      // Update dynamic pricing
      updateDynamicPricing: async (itemId: string) => {
        try {
          const item = await inventoryManagementService.getInventoryItem(itemId);
          if (!item) {
            throw new Error('Inventory item not found');
          }

          // Check permissions
          if (userRole !== 'admin' && item.businessId !== businessId) {
            throw new Error('Unauthorized access to inventory item');
          }

          return await inventoryManagementService.updateDynamicPricing(itemId);
        } catch (error) {
          logger.error('Failed to update dynamic pricing:', error);
          throw error;
        }
      },

      // Create inventory alert
      createAlert: async (itemId: string, alertType: string, severity: string, message: string, action: string) => {
        try {
          const item = await inventoryManagementService.getInventoryItem(itemId);
          if (!item) {
            throw new Error('Inventory item not found');
          }

          // Check permissions
          if (userRole !== 'admin' && item.businessId !== businessId) {
            throw new Error('Unauthorized access to inventory item');
          }

          return await inventoryManagementService.createInventoryAlert(
            item.businessId,
            itemId,
            alertType,
            severity,
            message,
            action
          );
        } catch (error) {
          logger.error('Failed to create inventory alert:', error);
          throw error;
        }
      },

      // Get alerts
      getAlerts: async (filters: any = {}) => {
        try {
          const targetBusinessId = userRole === 'admin' ? filters.businessId || businessId : businessId;
          
          if (!targetBusinessId) {
            throw new Error('Business ID required');
          }

          return await inventoryManagementService.getBusinessAlerts(targetBusinessId, filters);
        } catch (error) {
          logger.error('Failed to get alerts:', error);
          return [];
        }
      },

      // Analyze item performance
      analyzeItemPerformance: async (itemId: string) => {
        try {
          const item = await inventoryManagementService.getInventoryItem(itemId);
          if (!item) {
            throw new Error('Inventory item not found');
          }

          // Check permissions
          if (userRole !== 'admin' && item.businessId !== businessId) {
            throw new Error('Unauthorized access to inventory item');
          }

          // Calculate performance metrics
          const analytics = item.analytics;
          const demandHistory = item.demandHistory || [];
          const recentDemand = demandHistory.slice(-30);
          
          const totalDemand = recentDemand.reduce((sum, d) => sum + d.actualDemand, 0);
          const avgDemand = recentDemand.length > 0 ? totalDemand / recentDemand.length : 0;
          const maxDemand = recentDemand.length > 0 ? Math.max(...recentDemand.map(d => d.actualDemand)) : 0;
          const minDemand = recentDemand.length > 0 ? Math.min(...recentDemand.map(d => d.actualDemand)) : 0;

          return {
            itemId: item._id,
            itemName: item.itemName,
            performance: {
              turnoverRate: analytics.turnoverRate,
              utilizationRate: analytics.utilizationRate,
              profitMargin: analytics.profitMargin,
              demandVariance: analytics.demandVariance,
              stockoutFrequency: analytics.stockoutFrequency
            },
            demandAnalysis: {
              avgDemand,
              maxDemand,
              minDemand,
              totalDemand,
              dataPoints: recentDemand.length
            },
            stockStatus: {
              current: item.availableQuantity,
              reserved: item.reservedQuantity,
              minimum: item.minimumThreshold,
              maximum: item.maximumCapacity,
              stockLevel: item.availableQuantity / item.maximumCapacity * 100
            },
            pricing: {
              unitCost: item.unitCost,
              unitPrice: item.unitPrice,
              dynamicPricing: item.dynamicPricing.enabled,
              profitPerUnit: item.unitPrice - item.unitCost
            },
            lastAnalyzed: new Date()
          };
        } catch (error) {
          logger.error('Failed to analyze item performance:', error);
          throw error;
        }
      },

      // Get inventory insights
      getInventoryInsights: async () => {
        try {
          const targetBusinessId = businessId;
          
          if (!targetBusinessId) {
            throw new Error('Business ID required');
          }

          const items = await inventoryManagementService.getBusinessInventory(targetBusinessId);
          const alerts = await inventoryManagementService.getBusinessAlerts(targetBusinessId, { isResolved: false });
          
          // Calculate insights
          const totalValue = items.reduce((sum, item) => sum + (item.availableQuantity * item.unitPrice), 0);
          const lowStockItems = items.filter(item => item.availableQuantity <= item.minimumThreshold);
          const highPerformers = items.filter(item => item.analytics.turnoverRate > 5);
          const underperformers = items.filter(item => item.analytics.turnoverRate < 1);
          
          const avgTurnover = items.length > 0 
            ? items.reduce((sum, item) => sum + item.analytics.turnoverRate, 0) / items.length 
            : 0;

          return {
            overview: {
              totalItems: items.length,
              totalValue: Math.round(totalValue * 100) / 100,
              activeAlerts: alerts.length,
              avgTurnoverRate: Math.round(avgTurnover * 100) / 100
            },
            stockStatus: {
              inStock: items.filter(item => item.status === 'active').length,
              lowStock: lowStockItems.length,
              outOfStock: items.filter(item => item.status === 'out_of_stock').length,
              discontinued: items.filter(item => item.status === 'discontinued').length
            },
            performance: {
              highPerformers: highPerformers.length,
              underperformers: underperformers.length,
              profitableItems: items.filter(item => item.analytics.profitMargin > 20).length,
              dynamicPricingEnabled: items.filter(item => item.dynamicPricing.enabled).length
            },
            alerts: {
              critical: alerts.filter(alert => alert.severity === 'critical').length,
              high: alerts.filter(alert => alert.severity === 'high').length,
              medium: alerts.filter(alert => alert.severity === 'medium').length,
              low: alerts.filter(alert => alert.severity === 'low').length
            },
            recommendations: [
              ...(lowStockItems.length > 0 ? [`${lowStockItems.length} items need restocking`] : []),
              ...(underperformers.length > 0 ? [`${underperformers.length} items have low turnover rates`] : []),
              ...(items.filter(item => !item.dynamicPricing.enabled && item.analytics.demandVariance > 0.3).length > 0 
                ? ['Consider enabling dynamic pricing for high-variance items'] : []),
              ...(alerts.filter(alert => alert.severity === 'critical').length > 0 
                ? ['Address critical inventory alerts immediately'] : [])
            ],
            generatedAt: new Date()
          };
        } catch (error) {
          logger.error('Failed to generate inventory insights:', error);
          throw error;
        }
      }
    };

    next();
  } catch (error) {
    logger.error('Inventory middleware error:', error);
    // Don't block the request if inventory fails
    req.inventory = {
      createItem: async () => { throw new Error('Inventory unavailable'); },
      updateItem: async () => { throw new Error('Inventory unavailable'); },
      getItem: async () => null,
      getBusinessInventory: async () => [],
      generateForecast: async () => { throw new Error('Inventory unavailable'); },
      optimizeInventory: async () => { throw new Error('Inventory unavailable'); },
      updateDynamicPricing: async () => { throw new Error('Inventory unavailable'); },
      createAlert: async () => { throw new Error('Inventory unavailable'); },
      getAlerts: async () => [],
      analyzeItemPerformance: async () => { throw new Error('Inventory unavailable'); },
      getInventoryInsights: async () => { throw new Error('Inventory unavailable'); }
    };
    next();
  }
};

// Create inventory management routes
export const createInventoryRoutes = (express: any) => {
  const router = express.Router();

  // Inventory Item Management Routes

  // Create inventory item
  router.post('/items', async (req: Request, res: Response) => {
    try {
      const item = await req.inventory.createItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      logger.error('Failed to create inventory item:', error);
      res.status(error.message.includes('required') ? 403 : 500)
        .json({ error: error.message || 'Failed to create inventory item' });
    }
  });

  // Get business inventory
  router.get('/items', async (req: Request, res: Response) => {
    try {
      const filters = {
        itemType: req.query.itemType,
        status: req.query.status,
        limit: parseInt(req.query.limit as string) || 100,
        businessId: req.query.businessId // For admin access
      };

      const items = await req.inventory.getBusinessInventory(filters);
      res.json({ items, count: items.length });
    } catch (error) {
      logger.error('Failed to get inventory:', error);
      res.status(500).json({ error: 'Failed to get inventory' });
    }
  });

  // Get specific inventory item
  router.get('/items/:itemId', async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const item = await req.inventory.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      res.json(item);
    } catch (error) {
      logger.error('Failed to get inventory item:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to get inventory item' });
    }
  });

  // Update inventory item
  router.put('/items/:itemId', async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const item = await req.inventory.updateItem(itemId, req.body);
      
      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      res.json(item);
    } catch (error) {
      logger.error('Failed to update inventory item:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to update inventory item' });
    }
  });

  // Demand Forecasting Routes

  // Generate demand forecast
  router.post('/items/:itemId/forecast', async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const { days = 30 } = req.body;
      
      const forecast = await req.inventory.generateForecast(itemId, days);
      
      if (!forecast) {
        return res.status(400).json({ error: 'Unable to generate forecast' });
      }

      res.json(forecast);
    } catch (error) {
      logger.error('Failed to generate forecast:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to generate forecast' });
    }
  });

  // Inventory Optimization Routes

  // Optimize business inventory
  router.post('/optimize', async (req: Request, res: Response) => {
    try {
      const optimization = await req.inventory.optimizeInventory();
      res.json(optimization);
    } catch (error) {
      logger.error('Failed to optimize inventory:', error);
      res.status(500).json({ error: 'Failed to optimize inventory' });
    }
  });

  // Update dynamic pricing for item
  router.post('/items/:itemId/pricing/update', async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const newPrice = await req.inventory.updateDynamicPricing(itemId);
      
      if (newPrice === null) {
        return res.status(400).json({ error: 'Dynamic pricing not available for this item' });
      }

      res.json({ itemId, newPrice, updatedAt: new Date() });
    } catch (error) {
      logger.error('Failed to update dynamic pricing:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to update pricing' });
    }
  });

  // Analytics and Insights Routes

  // Get item performance analysis
  router.get('/items/:itemId/performance', async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const analysis = await req.inventory.analyzeItemPerformance(itemId);
      res.json(analysis);
    } catch (error) {
      logger.error('Failed to analyze item performance:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to analyze performance' });
    }
  });

  // Get inventory insights
  router.get('/insights', async (req: Request, res: Response) => {
    try {
      const insights = await req.inventory.getInventoryInsights();
      res.json(insights);
    } catch (error) {
      logger.error('Failed to get inventory insights:', error);
      res.status(500).json({ error: 'Failed to get insights' });
    }
  });

  // Alert Management Routes

  // Create inventory alert
  router.post('/alerts', async (req: Request, res: Response) => {
    try {
      const { itemId, alertType, severity, message, actionRequired } = req.body;
      
      if (!itemId || !alertType || !severity || !message || !actionRequired) {
        return res.status(400).json({ 
          error: 'Missing required fields: itemId, alertType, severity, message, actionRequired' 
        });
      }

      const alert = await req.inventory.createAlert(itemId, alertType, severity, message, actionRequired);
      res.status(201).json(alert);
    } catch (error) {
      logger.error('Failed to create inventory alert:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to create alert' });
    }
  });

  // Get business alerts
  router.get('/alerts', async (req: Request, res: Response) => {
    try {
      const filters = {
        isResolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
        severity: req.query.severity,
        limit: parseInt(req.query.limit as string) || 50,
        businessId: req.query.businessId // For admin access
      };

      const alerts = await req.inventory.getAlerts(filters);
      res.json({ alerts, count: alerts.length });
    } catch (error) {
      logger.error('Failed to get alerts:', error);
      res.status(500).json({ error: 'Failed to get alerts' });
    }
  });

  // Inventory Management Dashboard Route
  router.get('/dashboard', async (req: Request, res: Response) => {
    try {
      const insights = await req.inventory.getInventoryInsights();
      const alerts = await req.inventory.getAlerts({ isResolved: false, limit: 10 });
      const items = await req.inventory.getBusinessInventory({ status: 'active', limit: 10 });

      res.json({
        insights,
        recentAlerts: alerts.slice(0, 5),
        topItems: items.slice(0, 5),
        generatedAt: new Date()
      });
    } catch (error) {
      logger.error('Failed to get inventory dashboard:', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
    }
  });

  // Health check for inventory management
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const isConfigured = inventoryManagementService.isConfigured();
      const stats = await inventoryManagementService.getStats();
      
      res.json({
        status: 'ok',
        configuration: isConfigured,
        statistics: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Inventory health check failed:', error);
      res.status(500).json({ error: 'Inventory management unavailable' });
    }
  });

  return router;
};

// Inventory tracking middleware for specific routes
export const trackInventoryEvents = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const originalJson = res.json;
      
      res.json = function(body: any) {
        // Track inventory events if response is successful
        if (res.statusCode < 400) {
          const itemId = body.item?.id || body.id || req.params.itemId;
          if (itemId) {
            logger.info('Inventory event tracked:', {
              itemId,
              action: req.method,
              endpoint: req.path,
              userId: (req as any).user?.id,
              businessId: (req as any).user?.businessId,
              timestamp: new Date()
            });
          }
        }
        
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      logger.error('Inventory tracking error:', error);
      next();
    }
  };
};