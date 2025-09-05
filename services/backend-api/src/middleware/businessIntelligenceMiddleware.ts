import { Request, Response, NextFunction } from 'express';
import { businessIntelligenceService } from '../services/businessIntelligenceService';
import { logger } from '../utils/logger';

// Extend Request interface to include business intelligence methods
declare global {
  namespace Express {
    interface Request {
      businessIntelligence: {
        generateReport: (reportType: string, configuration: any) => Promise<any>;
        getReport: (reportId: string) => Promise<any>;
        getBusinessReports: (filters?: any) => Promise<any[]>;
        createDashboard: (name: string, widgets: any[], settings: any) => Promise<any>;
        getDashboard: (dashboardId: string) => Promise<any>;
        getBusinessDashboards: () => Promise<any[]>;
        updateDashboard: (dashboardId: string, updates: any) => Promise<any>;
        createAlert: (name: string, type: string, conditions: any[], notifications: any) => Promise<any>;
        getBusinessAlerts: (filters?: any) => Promise<any[]>;
        generateInsights: (dataType?: string) => Promise<any>;
        exportReport: (reportId: string, format: string) => Promise<any>;
      };
    }
  }
}

// Business Intelligence middleware
export const businessIntelligenceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = (req as any).user?.businessId;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Add business intelligence methods to request object
    req.businessIntelligence = {
      // Generate business report
      generateReport: async (reportType: string, configuration: any) => {
        try {
          if (!businessId && userRole !== 'admin') {
            throw new Error('Business access required for report generation');
          }

          if (!userId) {
            throw new Error('User authentication required');
          }

          const targetBusinessId = businessId || 'admin';
          
          // Validate report configuration
          if (!configuration.dateRange || !configuration.dateRange.startDate || !configuration.dateRange.endDate) {
            throw new Error('Date range is required for report generation');
          }

          return await businessIntelligenceService.generateBusinessReport(
            targetBusinessId,
            reportType,
            configuration,
            userId
          );
        } catch (error) {
          logger.error('Failed to generate report:', error);
          throw error;
        }
      },

      // Get specific report
      getReport: async (reportId: string) => {
        try {
          const report = await businessIntelligenceService.getReport(reportId);
          if (!report) {
            return null;
          }

          // Check permissions
          if (userRole !== 'admin' && report.businessId !== businessId) {
            throw new Error('Unauthorized access to report');
          }

          return report;
        } catch (error) {
          logger.error('Failed to get report:', error);
          throw error;
        }
      },

      // Get business reports
      getBusinessReports: async (filters: any = {}) => {
        try {
          const targetBusinessId = userRole === 'admin' ? filters.businessId || businessId : businessId;
          
          if (!targetBusinessId) {
            throw new Error('Business ID required');
          }

          return await businessIntelligenceService.getBusinessReports(targetBusinessId, filters);
        } catch (error) {
          logger.error('Failed to get business reports:', error);
          return [];
        }
      },

      // Create dashboard
      createDashboard: async (name: string, widgets: any[], settings: any) => {
        try {
          if (!businessId && userRole !== 'admin') {
            throw new Error('Business access required for dashboard creation');
          }

          if (!userId) {
            throw new Error('User authentication required');
          }

          const targetBusinessId = businessId || 'admin';
          
          return await businessIntelligenceService.createDashboard(
            targetBusinessId,
            name,
            widgets,
            settings,
            userId
          );
        } catch (error) {
          logger.error('Failed to create dashboard:', error);
          throw error;
        }
      },

      // Get specific dashboard
      getDashboard: async (dashboardId: string) => {
        try {
          const dashboard = await businessIntelligenceService.getDashboard(dashboardId);
          if (!dashboard) {
            return null;
          }

          // Check permissions
          if (userRole !== 'admin' && dashboard.businessId !== businessId) {
            throw new Error('Unauthorized access to dashboard');
          }

          return dashboard;
        } catch (error) {
          logger.error('Failed to get dashboard:', error);
          throw error;
        }
      },

      // Get business dashboards
      getBusinessDashboards: async () => {
        try {
          const targetBusinessId = businessId;
          
          if (!targetBusinessId) {
            throw new Error('Business ID required');
          }

          return await businessIntelligenceService.getBusinessDashboards(targetBusinessId);
        } catch (error) {
          logger.error('Failed to get business dashboards:', error);
          return [];
        }
      },

      // Update dashboard
      updateDashboard: async (dashboardId: string, updates: any) => {
        try {
          const dashboard = await businessIntelligenceService.getDashboard(dashboardId);
          if (!dashboard) {
            throw new Error('Dashboard not found');
          }

          // Check permissions
          if (userRole !== 'admin' && dashboard.businessId !== businessId) {
            throw new Error('Unauthorized access to dashboard');
          }

          // Update dashboard properties
          Object.assign(dashboard, updates);
          dashboard.updatedAt = new Date();
          
          await dashboard.save();
          return dashboard;
        } catch (error) {
          logger.error('Failed to update dashboard:', error);
          throw error;
        }
      },

      // Create business alert
      createAlert: async (name: string, type: string, conditions: any[], notifications: any) => {
        try {
          if (!businessId && userRole !== 'admin') {
            throw new Error('Business access required for alert creation');
          }

          if (!userId) {
            throw new Error('User authentication required');
          }

          const targetBusinessId = businessId || 'admin';
          
          return await businessIntelligenceService.createAlert(
            targetBusinessId,
            name,
            type,
            conditions,
            notifications,
            userId
          );
        } catch (error) {
          logger.error('Failed to create alert:', error);
          throw error;
        }
      },

      // Get business alerts
      getBusinessAlerts: async (filters: any = {}) => {
        try {
          const targetBusinessId = userRole === 'admin' ? filters.businessId || businessId : businessId;
          
          if (!targetBusinessId) {
            throw new Error('Business ID required');
          }

          return await businessIntelligenceService.getBusinessAlerts(targetBusinessId, filters);
        } catch (error) {
          logger.error('Failed to get business alerts:', error);
          return [];
        }
      },

      // Generate insights
      generateInsights: async (dataType: string = 'comprehensive') => {
        try {
          const targetBusinessId = businessId;
          
          if (!targetBusinessId) {
            throw new Error('Business ID required for insights generation');
          }

          // Generate quick insights based on available data
          const reports = await businessIntelligenceService.getBusinessReports(targetBusinessId, { limit: 5 });
          const dashboards = await businessIntelligenceService.getBusinessDashboards(targetBusinessId);
          const alerts = await businessIntelligenceService.getBusinessAlerts(targetBusinessId, { isActive: true });

          const insights = {
            summary: {
              reportsGenerated: reports.length,
              dashboardsActive: dashboards.length,
              activeAlerts: alerts.length,
              lastReportGenerated: reports.length > 0 ? reports[0].generatedAt : null
            },
            trends: [
              {
                metric: 'report_generation',
                direction: reports.length > 2 ? 'up' : 'stable',
                change: reports.length * 10,
                timeframe: '30_days'
              }
            ],
            recommendations: [
              ...(reports.length === 0 ? [{
                priority: 'high',
                category: 'reporting',
                title: 'Generate Your First Business Report',
                description: 'Create a comprehensive business report to gain insights into your performance.',
                actionItems: ['Go to Reports section', 'Select report type', 'Configure date range']
              }] : []),
              ...(dashboards.length === 0 ? [{
                priority: 'medium',
                category: 'visualization',
                title: 'Create a Business Dashboard',
                description: 'Build a customized dashboard to monitor key metrics in real-time.',
                actionItems: ['Go to Dashboards section', 'Choose dashboard template', 'Add relevant widgets']
              }] : []),
              ...(alerts.length === 0 ? [{
                priority: 'low',
                category: 'monitoring',
                title: 'Set Up Business Alerts',
                description: 'Create alerts to stay informed about important business metrics changes.',
                actionItems: ['Go to Alerts section', 'Define alert conditions', 'Configure notifications']
              }] : [])
            ],
            generatedAt: new Date()
          };

          return insights;
        } catch (error) {
          logger.error('Failed to generate insights:', error);
          throw error;
        }
      },

      // Export report
      exportReport: async (reportId: string, format: string) => {
        try {
          const report = await businessIntelligenceService.getReport(reportId);
          if (!report) {
            throw new Error('Report not found');
          }

          // Check permissions
          if (userRole !== 'admin' && report.businessId !== businessId) {
            throw new Error('Unauthorized access to report');
          }

          // Generate export data based on format
          switch (format.toLowerCase()) {
            case 'json':
              return {
                format: 'json',
                data: report.toObject(),
                filename: `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`
              };
              
            case 'csv':
              const csvData = await this.generateCSVExport(report);
              return {
                format: 'csv',
                data: csvData,
                filename: `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
              };
              
            case 'pdf':
              // In a real implementation, this would generate a PDF
              return {
                format: 'pdf',
                data: 'PDF generation not implemented in this demo',
                filename: `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
              };
              
            default:
              throw new Error(`Unsupported export format: ${format}`);
          }
        } catch (error) {
          logger.error('Failed to export report:', error);
          throw error;
        }
      }
    };

    next();
  } catch (error) {
    logger.error('Business intelligence middleware error:', error);
    // Don't block the request if BI fails
    req.businessIntelligence = {
      generateReport: async () => { throw new Error('Business Intelligence unavailable'); },
      getReport: async () => null,
      getBusinessReports: async () => [],
      createDashboard: async () => { throw new Error('Business Intelligence unavailable'); },
      getDashboard: async () => null,
      getBusinessDashboards: async () => [],
      updateDashboard: async () => { throw new Error('Business Intelligence unavailable'); },
      createAlert: async () => { throw new Error('Business Intelligence unavailable'); },
      getBusinessAlerts: async () => [],
      generateInsights: async () => { throw new Error('Business Intelligence unavailable'); },
      exportReport: async () => { throw new Error('Business Intelligence unavailable'); }
    };
    next();
  }
};

// Helper method for CSV export
async function generateCSVExport(report: any): Promise<string> {
  const headers = ['Metric', 'Value', 'Trend', 'Prediction'];
  const rows = [];
  
  // Add summary data
  if (report.data.summary) {
    Object.entries(report.data.summary).forEach(([key, value]) => {
      if (typeof value === 'number') {
        rows.push([key, value.toString(), '', '']);
      }
    });
  }
  
  // Add metrics data
  if (report.data.metrics) {
    for (const [key, value] of report.data.metrics) {
      const trend = report.data.trends?.find((t: any) => t.metric === key);
      const prediction = report.data.predictions?.find((p: any) => p.metric === key);
      
      rows.push([
        key,
        value?.toString() || '',
        trend ? `${trend.direction} ${trend.change}%` : '',
        prediction ? `${prediction.predictedValue} (${prediction.confidence}%)` : ''
      ]);
    }
  }
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

// Create business intelligence routes
export const createBusinessIntelligenceRoutes = (express: any) => {
  const router = express.Router();

  // Report Management Routes

  // Generate new report
  router.post('/reports/generate', async (req: Request, res: Response) => {
    try {
      const { reportType, configuration } = req.body;
      
      if (!reportType) {
        return res.status(400).json({ error: 'Report type is required' });
      }

      if (!configuration) {
        return res.status(400).json({ error: 'Report configuration is required' });
      }

      const report = await req.businessIntelligence.generateReport(reportType, configuration);
      res.status(201).json(report);
    } catch (error) {
      logger.error('Failed to generate report:', error);
      res.status(error.message.includes('required') ? 403 : 500)
        .json({ error: error.message || 'Failed to generate report' });
    }
  });

  // Get business reports
  router.get('/reports', async (req: Request, res: Response) => {
    try {
      const filters = {
        reportType: req.query.reportType,
        status: req.query.status,
        limit: parseInt(req.query.limit as string) || 20,
        businessId: req.query.businessId // For admin access
      };

      const reports = await req.businessIntelligence.getBusinessReports(filters);
      res.json({ reports, count: reports.length });
    } catch (error) {
      logger.error('Failed to get reports:', error);
      res.status(500).json({ error: 'Failed to get reports' });
    }
  });

  // Get specific report
  router.get('/reports/:reportId', async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const report = await req.businessIntelligence.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      res.json(report);
    } catch (error) {
      logger.error('Failed to get report:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to get report' });
    }
  });

  // Export report
  router.post('/reports/:reportId/export', async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { format = 'json' } = req.body;
      
      const exportData = await req.businessIntelligence.exportReport(reportId, format);
      
      res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
      res.setHeader('Content-Type', this.getContentType(format));
      res.send(exportData.data);
    } catch (error) {
      logger.error('Failed to export report:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to export report' });
    }
  });

  // Dashboard Management Routes

  // Create dashboard
  router.post('/dashboards', async (req: Request, res: Response) => {
    try {
      const { name, widgets = [], settings = {} } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Dashboard name is required' });
      }

      const dashboard = await req.businessIntelligence.createDashboard(name, widgets, settings);
      res.status(201).json(dashboard);
    } catch (error) {
      logger.error('Failed to create dashboard:', error);
      res.status(error.message.includes('required') ? 403 : 500)
        .json({ error: error.message || 'Failed to create dashboard' });
    }
  });

  // Get business dashboards
  router.get('/dashboards', async (req: Request, res: Response) => {
    try {
      const dashboards = await req.businessIntelligence.getBusinessDashboards();
      res.json({ dashboards, count: dashboards.length });
    } catch (error) {
      logger.error('Failed to get dashboards:', error);
      res.status(500).json({ error: 'Failed to get dashboards' });
    }
  });

  // Get specific dashboard
  router.get('/dashboards/:dashboardId', async (req: Request, res: Response) => {
    try {
      const { dashboardId } = req.params;
      const dashboard = await req.businessIntelligence.getDashboard(dashboardId);
      
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }

      res.json(dashboard);
    } catch (error) {
      logger.error('Failed to get dashboard:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to get dashboard' });
    }
  });

  // Update dashboard
  router.put('/dashboards/:dashboardId', async (req: Request, res: Response) => {
    try {
      const { dashboardId } = req.params;
      const dashboard = await req.businessIntelligence.updateDashboard(dashboardId, req.body);
      res.json(dashboard);
    } catch (error) {
      logger.error('Failed to update dashboard:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to update dashboard' });
    }
  });

  // Alert Management Routes

  // Create alert
  router.post('/alerts', async (req: Request, res: Response) => {
    try {
      const { name, type, conditions, notifications } = req.body;
      
      if (!name || !type || !conditions || !notifications) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, type, conditions, notifications' 
        });
      }

      const alert = await req.businessIntelligence.createAlert(name, type, conditions, notifications);
      res.status(201).json(alert);
    } catch (error) {
      logger.error('Failed to create alert:', error);
      res.status(error.message.includes('required') ? 403 : 500)
        .json({ error: error.message || 'Failed to create alert' });
    }
  });

  // Get business alerts
  router.get('/alerts', async (req: Request, res: Response) => {
    try {
      const filters = {
        isActive: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
        severity: req.query.severity,
        limit: parseInt(req.query.limit as string) || 50,
        businessId: req.query.businessId // For admin access
      };

      const alerts = await req.businessIntelligence.getBusinessAlerts(filters);
      res.json({ alerts, count: alerts.length });
    } catch (error) {
      logger.error('Failed to get alerts:', error);
      res.status(500).json({ error: 'Failed to get alerts' });
    }
  });

  // Insights and Analytics Routes

  // Generate insights
  router.get('/insights', async (req: Request, res: Response) => {
    try {
      const dataType = req.query.type as string || 'comprehensive';
      const insights = await req.businessIntelligence.generateInsights(dataType);
      res.json(insights);
    } catch (error) {
      logger.error('Failed to generate insights:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  });

  // Business Intelligence Overview
  router.get('/overview', async (req: Request, res: Response) => {
    try {
      const reports = await req.businessIntelligence.getBusinessReports({ limit: 5 });
      const dashboards = await req.businessIntelligence.getBusinessDashboards();
      const alerts = await req.businessIntelligence.getBusinessAlerts({ isActive: true, limit: 5 });
      const insights = await req.businessIntelligence.generateInsights();

      res.json({
        summary: {
          reportsCount: reports.length,
          dashboardsCount: dashboards.length,
          alertsCount: alerts.length
        },
        recentReports: reports.slice(0, 3),
        activeDashboards: dashboards.slice(0, 3),
        activeAlerts: alerts.slice(0, 3),
        insights: insights,
        generatedAt: new Date()
      });
    } catch (error) {
      logger.error('Failed to get BI overview:', error);
      res.status(500).json({ error: 'Failed to get overview' });
    }
  });

  // Health check for business intelligence
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const isConfigured = businessIntelligenceService.isConfigured();
      const stats = await businessIntelligenceService.getStats();
      
      res.json({
        status: 'ok',
        configuration: isConfigured,
        statistics: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Business Intelligence health check failed:', error);
      res.status(500).json({ error: 'Business Intelligence unavailable' });
    }
  });

  return router;
};

// Helper function to get content type for exports
function getContentType(format: string): string {
  switch (format.toLowerCase()) {
    case 'json':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    case 'pdf':
      return 'application/pdf';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

// BI tracking middleware for specific routes
export const trackBIEvents = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const originalJson = res.json;
      
      res.json = function(body: any) {
        // Track BI events if response is successful
        if (res.statusCode < 400) {
          const eventType = req.path.includes('reports') ? 'report' : 
                           req.path.includes('dashboards') ? 'dashboard' :
                           req.path.includes('alerts') ? 'alert' : 'insight';
          
          logger.info('Business Intelligence event tracked:', {
            eventType,
            action: req.method,
            endpoint: req.path,
            userId: (req as any).user?.id,
            businessId: (req as any).user?.businessId,
            timestamp: new Date()
          });
        }
        
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      logger.error('BI tracking error:', error);
      next();
    }
  };
};