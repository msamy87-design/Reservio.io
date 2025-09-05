import mongoose, { Document, Schema } from 'mongoose';
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';
import { recommendationEngine } from './recommendationEngine';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Inventory Management Types
interface IInventoryItem extends Document {
  businessId: string;
  serviceId?: string;
  itemName: string;
  itemType: 'service_slot' | 'physical_product' | 'digital_resource' | 'staff_time' | 'equipment';
  sku?: string;
  
  // Inventory tracking
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  minimumThreshold: number;
  maximumCapacity: number;
  
  // Time-based availability (for services)
  timeSlots?: {
    dayOfWeek: number; // 0-6 (Sun-Sat)
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    duration: number; // minutes
    capacity: number;
    isRecurring: boolean;
  }[];
  
  // Pricing and costs
  unitCost: number;
  unitPrice: number;
  dynamicPricing: {
    enabled: boolean;
    basePrice: number;
    demandMultiplier: number;
    seasonalFactors: Record<string, number>;
    peakHourRates: Record<string, number>;
  };
  
  // Demand forecasting data
  demandHistory: {
    date: Date;
    actualDemand: number;
    predictedDemand: number;
    factors: Record<string, number>;
  }[];
  
  // Auto-restocking
  autoRestock: {
    enabled: boolean;
    reorderPoint: number;
    reorderQuantity: number;
    leadTimeDays: number;
    supplierId?: string;
  };
  
  // Location and logistics
  location?: {
    warehouse?: string;
    zone?: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Analytics and optimization
  analytics: {
    turnoverRate: number;
    utilizationRate: number;
    profitMargin: number;
    demandVariance: number;
    stockoutFrequency: number;
    lastOptimized: Date;
  };
  
  // Status and metadata
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IDemandForecast extends Document {
  businessId: string;
  itemId: string;
  forecastPeriod: {
    startDate: Date;
    endDate: Date;
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  };
  
  // Forecast data
  predictions: {
    date: Date;
    predictedDemand: number;
    confidence: number;
    factors: {
      seasonal: number;
      trend: number;
      promotional: number;
      external: number;
      weekday: number;
    };
  }[];
  
  // Model information
  modelVersion: string;
  accuracy: number;
  lastTrained: Date;
  
  // External factors considered
  externalFactors: {
    weather?: any;
    events?: any[];
    holidays?: string[];
    competitors?: any[];
  };
}

interface IInventoryAlert extends Document {
  businessId: string;
  itemId: string;
  alertType: 'low_stock' | 'out_of_stock' | 'overstocked' | 'demand_spike' | 'optimization_needed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionRequired: string;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

// MongoDB Schemas
const inventoryItemSchema = new Schema<IInventoryItem>({
  businessId: { type: String, required: true, index: true },
  serviceId: { type: String, index: true },
  itemName: { type: String, required: true },
  itemType: { 
    type: String, 
    required: true,
    enum: ['service_slot', 'physical_product', 'digital_resource', 'staff_time', 'equipment']
  },
  sku: { type: String, unique: true, sparse: true },
  
  totalQuantity: { type: Number, required: true, min: 0 },
  availableQuantity: { type: Number, required: true, min: 0 },
  reservedQuantity: { type: Number, default: 0, min: 0 },
  minimumThreshold: { type: Number, required: true, min: 0 },
  maximumCapacity: { type: Number, required: true, min: 0 },
  
  timeSlots: [{
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startTime: String,
    endTime: String,
    duration: { type: Number, min: 15 },
    capacity: { type: Number, min: 1 },
    isRecurring: { type: Boolean, default: true }
  }],
  
  unitCost: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  dynamicPricing: {
    enabled: { type: Boolean, default: false },
    basePrice: { type: Number, min: 0 },
    demandMultiplier: { type: Number, default: 1, min: 0.1, max: 10 },
    seasonalFactors: { type: Map, of: Number },
    peakHourRates: { type: Map, of: Number }
  },
  
  demandHistory: [{
    date: { type: Date, required: true },
    actualDemand: { type: Number, required: true, min: 0 },
    predictedDemand: { type: Number, min: 0 },
    factors: { type: Map, of: Number }
  }],
  
  autoRestock: {
    enabled: { type: Boolean, default: false },
    reorderPoint: { type: Number, min: 0 },
    reorderQuantity: { type: Number, min: 1 },
    leadTimeDays: { type: Number, min: 0 },
    supplierId: String
  },
  
  location: {
    warehouse: String,
    zone: String,
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    }
  },
  
  analytics: {
    turnoverRate: { type: Number, default: 0, min: 0 },
    utilizationRate: { type: Number, default: 0, min: 0, max: 100 },
    profitMargin: { type: Number, default: 0 },
    demandVariance: { type: Number, default: 0, min: 0 },
    stockoutFrequency: { type: Number, default: 0, min: 0 },
    lastOptimized: { type: Date, default: Date.now }
  },
  
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'discontinued', 'out_of_stock'],
    default: 'active'
  },
  tags: [String],
  notes: String
}, {
  timestamps: true
});

const demandForecastSchema = new Schema<IDemandForecast>({
  businessId: { type: String, required: true, index: true },
  itemId: { type: String, required: true, index: true },
  forecastPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    granularity: { 
      type: String, 
      required: true,
      enum: ['hourly', 'daily', 'weekly', 'monthly']
    }
  },
  
  predictions: [{
    date: { type: Date, required: true },
    predictedDemand: { type: Number, required: true, min: 0 },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    factors: {
      seasonal: { type: Number, default: 1 },
      trend: { type: Number, default: 1 },
      promotional: { type: Number, default: 1 },
      external: { type: Number, default: 1 },
      weekday: { type: Number, default: 1 }
    }
  }],
  
  modelVersion: { type: String, required: true },
  accuracy: { type: Number, min: 0, max: 100 },
  lastTrained: { type: Date, default: Date.now },
  
  externalFactors: {
    weather: Schema.Types.Mixed,
    events: [Schema.Types.Mixed],
    holidays: [String],
    competitors: [Schema.Types.Mixed]
  }
}, {
  timestamps: true
});

const inventoryAlertSchema = new Schema<IInventoryAlert>({
  businessId: { type: String, required: true, index: true },
  itemId: { type: String, required: true, index: true },
  alertType: {
    type: String,
    required: true,
    enum: ['low_stock', 'out_of_stock', 'overstocked', 'demand_spike', 'optimization_needed']
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  message: { type: String, required: true },
  actionRequired: { type: String, required: true },
  isResolved: { type: Boolean, default: false },
  resolvedAt: Date
}, {
  timestamps: true
});

// Create indexes for performance
inventoryItemSchema.index({ businessId: 1, itemType: 1 });
inventoryItemSchema.index({ businessId: 1, status: 1 });
inventoryItemSchema.index({ 'analytics.turnoverRate': -1 });
inventoryItemSchema.index({ 'analytics.utilizationRate': -1 });

demandForecastSchema.index({ businessId: 1, itemId: 1, 'forecastPeriod.startDate': 1 });
demandForecastSchema.index({ accuracy: -1 });
demandForecastSchema.index({ lastTrained: -1 });

inventoryAlertSchema.index({ businessId: 1, isResolved: 1, createdAt: -1 });
inventoryAlertSchema.index({ severity: 1, createdAt: -1 });

// MongoDB Models
const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);
const DemandForecast = mongoose.model<IDemandForecast>('DemandForecast', demandForecastSchema);
const InventoryAlert = mongoose.model<IInventoryAlert>('InventoryAlert', inventoryAlertSchema);

// Intelligent Inventory Management Service
export class InventoryManagementService {
  private genAI: GoogleGenerativeAI | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      if (process.env.GEMINI_API_KEY) {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        logger.info('Inventory Management Service initialized with AI capabilities');
      } else {
        logger.warn('No Gemini API key found, AI features will be limited');
      }
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize Inventory Management Service:', error);
    }
  }

  // Inventory Item Management
  async createInventoryItem(data: Partial<IInventoryItem>): Promise<IInventoryItem> {
    try {
      // Generate SKU if not provided
      if (!data.sku && data.itemName) {
        data.sku = this.generateSKU(data.itemName, data.businessId!);
      }

      // Set initial analytics
      data.analytics = {
        turnoverRate: 0,
        utilizationRate: 0,
        profitMargin: ((data.unitPrice! - data.unitCost!) / data.unitPrice!) * 100,
        demandVariance: 0,
        stockoutFrequency: 0,
        lastOptimized: new Date()
      };

      const item = new InventoryItem(data);
      await item.save();

      // Cache the item
      await cacheService.set(`inventory:${item._id}`, item, 3600);

      logger.info('Inventory item created:', {
        itemId: item._id,
        businessId: item.businessId,
        itemName: item.itemName,
        itemType: item.itemType
      });

      return item;
    } catch (error) {
      logger.error('Failed to create inventory item:', error);
      throw error;
    }
  }

  async updateInventoryItem(itemId: string, updates: Partial<IInventoryItem>): Promise<IInventoryItem | null> {
    try {
      const item = await InventoryItem.findByIdAndUpdate(
        itemId,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (item) {
        await cacheService.set(`inventory:${itemId}`, item, 3600);
        
        // Check if restocking is needed
        await this.checkRestockingNeeds(item);
      }

      return item;
    } catch (error) {
      logger.error('Failed to update inventory item:', error);
      throw error;
    }
  }

  async getInventoryItem(itemId: string): Promise<IInventoryItem | null> {
    try {
      // Try cache first
      const cached = await cacheService.get(`inventory:${itemId}`);
      if (cached) {
        return cached;
      }

      const item = await InventoryItem.findById(itemId);
      if (item) {
        await cacheService.set(`inventory:${itemId}`, item, 3600);
      }

      return item;
    } catch (error) {
      logger.error('Failed to get inventory item:', error);
      return null;
    }
  }

  async getBusinessInventory(businessId: string, filters: any = {}): Promise<IInventoryItem[]> {
    try {
      const query: any = { businessId, ...filters };
      
      if (filters.itemType) {
        query.itemType = filters.itemType;
      }
      
      if (filters.status) {
        query.status = filters.status;
      }

      const items = await InventoryItem.find(query)
        .sort({ itemName: 1 })
        .limit(filters.limit || 100);

      return items;
    } catch (error) {
      logger.error('Failed to get business inventory:', error);
      return [];
    }
  }

  // Demand Forecasting
  async generateDemandForecast(itemId: string, days: number = 30): Promise<IDemandForecast | null> {
    try {
      const item = await this.getInventoryItem(itemId);
      if (!item) {
        throw new Error('Inventory item not found');
      }

      // Analyze historical demand data
      const historicalData = item.demandHistory || [];
      
      if (historicalData.length < 7) {
        logger.warn(`Insufficient historical data for item ${itemId}, using simple projection`);
        return await this.createSimpleForecast(item, days);
      }

      // Use AI for advanced forecasting if available
      if (this.genAI) {
        return await this.createAIForecast(item, days);
      } else {
        return await this.createStatisticalForecast(item, days);
      }
    } catch (error) {
      logger.error('Failed to generate demand forecast:', error);
      return null;
    }
  }

  private async createSimpleForecast(item: IInventoryItem, days: number): Promise<IDemandForecast> {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    
    // Use average demand from last 30 days
    const recentHistory = item.demandHistory.slice(-30);
    const avgDemand = recentHistory.length > 0 
      ? recentHistory.reduce((sum, d) => sum + d.actualDemand, 0) / recentHistory.length
      : 1;

    const predictions = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      predictions.push({
        date,
        predictedDemand: Math.max(0, Math.round(avgDemand + (Math.random() - 0.5) * avgDemand * 0.2)),
        confidence: 60, // Lower confidence for simple forecast
        factors: {
          seasonal: 1,
          trend: 1,
          promotional: 1,
          external: 1,
          weekday: date.getDay() === 0 || date.getDay() === 6 ? 0.8 : 1.2
        }
      });
    }

    const forecast = new DemandForecast({
      businessId: item.businessId,
      itemId: item._id,
      forecastPeriod: { startDate, endDate, granularity: 'daily' },
      predictions,
      modelVersion: 'simple-v1.0',
      accuracy: 60,
      lastTrained: new Date()
    });

    await forecast.save();
    return forecast;
  }

  private async createStatisticalForecast(item: IInventoryItem, days: number): Promise<IDemandForecast> {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    
    const history = item.demandHistory;
    
    // Calculate moving averages and trends
    const movingAverage = this.calculateMovingAverage(history, 7);
    const trend = this.calculateTrend(history);
    const seasonality = this.calculateSeasonality(history);
    
    const predictions = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      const weekOfYear = this.getWeekOfYear(date);
      
      const baseDemand = movingAverage;
      const trendFactor = 1 + (trend * i / 30); // Apply trend over time
      const seasonalFactor = seasonality[weekOfYear % seasonality.length] || 1;
      const weekdayFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.1;
      
      const predictedDemand = Math.max(0, Math.round(
        baseDemand * trendFactor * seasonalFactor * weekdayFactor
      ));
      
      predictions.push({
        date,
        predictedDemand,
        confidence: 75,
        factors: {
          seasonal: seasonalFactor,
          trend: trendFactor,
          promotional: 1,
          external: 1,
          weekday: weekdayFactor
        }
      });
    }

    const forecast = new DemandForecast({
      businessId: item.businessId,
      itemId: item._id,
      forecastPeriod: { startDate, endDate, granularity: 'daily' },
      predictions,
      modelVersion: 'statistical-v1.0',
      accuracy: 75,
      lastTrained: new Date()
    });

    await forecast.save();
    return forecast;
  }

  private async createAIForecast(item: IInventoryItem, days: number): Promise<IDemandForecast> {
    try {
      const model = this.genAI!.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Analyze the demand patterns for this inventory item and provide a ${days}-day forecast:
        
        Item Details:
        - Name: ${item.itemName}
        - Type: ${item.itemType}
        - Historical Demand: ${JSON.stringify(item.demandHistory.slice(-30))}
        - Current Stock: ${item.availableQuantity}
        - Unit Price: $${item.unitPrice}
        
        Please provide a JSON forecast with the following structure:
        {
          "dailyPredictions": [
            {
              "day": 1,
              "predictedDemand": number,
              "confidence": number (0-100),
              "factors": {
                "seasonal": number,
                "trend": number,
                "promotional": number,
                "external": number,
                "weekday": number
              }
            }
          ],
          "overallAccuracy": number (0-100),
          "insights": "string"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response
      let aiResponse;
      try {
        aiResponse = JSON.parse(text);
      } catch {
        logger.warn('Failed to parse AI forecast response, falling back to statistical forecast');
        return await this.createStatisticalForecast(item, days);
      }

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      
      const predictions = aiResponse.dailyPredictions.map((pred: any, index: number) => ({
        date: new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000),
        predictedDemand: pred.predictedDemand,
        confidence: pred.confidence,
        factors: pred.factors
      }));

      const forecast = new DemandForecast({
        businessId: item.businessId,
        itemId: item._id,
        forecastPeriod: { startDate, endDate, granularity: 'daily' },
        predictions,
        modelVersion: 'ai-gemini-v1.0',
        accuracy: aiResponse.overallAccuracy,
        lastTrained: new Date()
      });

      await forecast.save();
      return forecast;
    } catch (error) {
      logger.error('AI forecast failed, falling back to statistical forecast:', error);
      return await this.createStatisticalForecast(item, days);
    }
  }

  // Dynamic Pricing
  async updateDynamicPricing(itemId: string): Promise<number | null> {
    try {
      const item = await this.getInventoryItem(itemId);
      if (!item || !item.dynamicPricing.enabled) {
        return null;
      }

      const forecast = await DemandForecast.findOne({
        itemId,
        'forecastPeriod.endDate': { $gte: new Date() }
      }).sort({ createdAt: -1 });

      if (!forecast) {
        return item.unitPrice;
      }

      // Get next 7 days demand
      const nextWeekDemand = forecast.predictions
        .slice(0, 7)
        .reduce((sum, p) => sum + p.predictedDemand, 0);

      // Calculate demand-based pricing
      const avgWeeklyDemand = item.demandHistory
        .slice(-28)
        .reduce((sum, d) => sum + d.actualDemand, 0) / 4;

      const demandRatio = avgWeeklyDemand > 0 ? nextWeekDemand / avgWeeklyDemand : 1;
      
      // Apply pricing factors
      let priceMultiplier = item.dynamicPricing.demandMultiplier;
      
      if (demandRatio > 1.5) {
        priceMultiplier *= 1.2; // High demand
      } else if (demandRatio < 0.5) {
        priceMultiplier *= 0.9; // Low demand
      }

      // Apply seasonal factors
      const currentSeason = this.getCurrentSeason();
      const seasonalFactor = item.dynamicPricing.seasonalFactors.get(currentSeason) || 1;
      priceMultiplier *= seasonalFactor;

      // Apply peak hour rates if applicable
      const currentHour = new Date().getHours();
      const peakFactor = item.dynamicPricing.peakHourRates.get(currentHour.toString()) || 1;
      priceMultiplier *= peakFactor;

      const newPrice = Math.round(item.dynamicPricing.basePrice * priceMultiplier * 100) / 100;
      
      // Update item price
      await this.updateInventoryItem(itemId, { unitPrice: newPrice });

      logger.info('Dynamic pricing updated:', {
        itemId,
        oldPrice: item.unitPrice,
        newPrice,
        demandRatio,
        priceMultiplier
      });

      return newPrice;
    } catch (error) {
      logger.error('Failed to update dynamic pricing:', error);
      return null;
    }
  }

  // Inventory Optimization
  async optimizeInventory(businessId: string): Promise<any> {
    try {
      const items = await this.getBusinessInventory(businessId, { status: 'active' });
      const optimizations = [];

      for (const item of items) {
        const optimization = await this.analyzeItemOptimization(item);
        if (optimization.actions.length > 0) {
          optimizations.push(optimization);
        }
      }

      return {
        totalItems: items.length,
        itemsOptimized: optimizations.length,
        optimizations,
        estimatedSavings: optimizations.reduce((sum, opt) => sum + (opt.estimatedSavings || 0), 0),
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to optimize inventory:', error);
      throw error;
    }
  }

  private async analyzeItemOptimization(item: IInventoryItem): Promise<any> {
    const actions = [];
    let estimatedSavings = 0;

    // Check stock levels
    if (item.availableQuantity < item.minimumThreshold) {
      actions.push({
        type: 'restock',
        priority: 'high',
        description: `Stock level (${item.availableQuantity}) below minimum threshold (${item.minimumThreshold})`,
        recommendedQuantity: item.autoRestock.reorderQuantity || item.maximumCapacity - item.availableQuantity
      });
    }

    // Check for overstocking
    const turnoverRate = item.analytics.turnoverRate;
    if (turnoverRate < 2 && item.availableQuantity > item.maximumCapacity * 0.8) {
      actions.push({
        type: 'reduce_stock',
        priority: 'medium',
        description: `Low turnover rate (${turnoverRate}) with high stock levels`,
        recommendedReduction: Math.floor(item.availableQuantity * 0.3)
      });
      estimatedSavings += item.unitCost * Math.floor(item.availableQuantity * 0.3);
    }

    // Dynamic pricing opportunities
    if (!item.dynamicPricing.enabled && item.analytics.demandVariance > 0.3) {
      actions.push({
        type: 'enable_dynamic_pricing',
        priority: 'medium',
        description: 'High demand variance suggests dynamic pricing could increase revenue',
        estimatedRevenueIncrease: item.unitPrice * 0.15 * item.demandHistory.slice(-30).reduce((sum, d) => sum + d.actualDemand, 0)
      });
    }

    return {
      itemId: item._id,
      itemName: item.itemName,
      actions,
      estimatedSavings,
      lastAnalyzed: new Date()
    };
  }

  // Alert Management
  async createInventoryAlert(
    businessId: string,
    itemId: string,
    alertType: string,
    severity: string,
    message: string,
    actionRequired: string
  ): Promise<IInventoryAlert> {
    try {
      const alert = new InventoryAlert({
        businessId,
        itemId,
        alertType,
        severity,
        message,
        actionRequired
      });

      await alert.save();

      logger.warn('Inventory alert created:', {
        alertId: alert._id,
        businessId,
        itemId,
        alertType,
        severity
      });

      return alert;
    } catch (error) {
      logger.error('Failed to create inventory alert:', error);
      throw error;
    }
  }

  async getBusinessAlerts(businessId: string, filters: any = {}): Promise<IInventoryAlert[]> {
    try {
      const query: any = { businessId };
      
      if (filters.isResolved !== undefined) {
        query.isResolved = filters.isResolved;
      }
      
      if (filters.severity) {
        query.severity = filters.severity;
      }

      const alerts = await InventoryAlert.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50);

      return alerts;
    } catch (error) {
      logger.error('Failed to get business alerts:', error);
      return [];
    }
  }

  // Auto-restocking
  private async checkRestockingNeeds(item: IInventoryItem): Promise<void> {
    try {
      if (!item.autoRestock.enabled) {
        return;
      }

      if (item.availableQuantity <= item.autoRestock.reorderPoint) {
        await this.createInventoryAlert(
          item.businessId,
          item._id!.toString(),
          'low_stock',
          'high',
          `Auto-restock triggered for ${item.itemName}. Current stock: ${item.availableQuantity}`,
          `Order ${item.autoRestock.reorderQuantity} units from supplier`
        );

        // In a real implementation, this would trigger supplier orders
        logger.info('Auto-restock triggered:', {
          itemId: item._id,
          currentStock: item.availableQuantity,
          reorderQuantity: item.autoRestock.reorderQuantity
        });
      }
    } catch (error) {
      logger.error('Failed to check restocking needs:', error);
    }
  }

  // Utility methods
  private generateSKU(itemName: string, businessId: string): string {
    const nameCode = itemName.substring(0, 3).toUpperCase();
    const businessCode = businessId.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${nameCode}-${businessCode}-${timestamp}`;
  }

  private calculateMovingAverage(history: any[], windowSize: number): number {
    if (history.length < windowSize) {
      return history.length > 0 
        ? history.reduce((sum, d) => sum + d.actualDemand, 0) / history.length 
        : 1;
    }

    const recent = history.slice(-windowSize);
    return recent.reduce((sum, d) => sum + d.actualDemand, 0) / windowSize;
  }

  private calculateTrend(history: any[]): number {
    if (history.length < 2) return 0;

    const mid = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, mid);
    const secondHalf = history.slice(mid);

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.actualDemand, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.actualDemand, 0) / secondHalf.length;

    return (secondAvg - firstAvg) / firstAvg;
  }

  private calculateSeasonality(history: any[]): number[] {
    // Simple seasonal calculation - weekly pattern
    const weeklyPattern = new Array(52).fill(1);
    
    history.forEach(entry => {
      const week = this.getWeekOfYear(entry.date);
      weeklyPattern[week % 52] = (weeklyPattern[week % 52] + entry.actualDemand / this.calculateMovingAverage(history, history.length)) / 2;
    });

    return weeklyPattern;
  }

  private getWeekOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.floor(diff / oneWeek);
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  // Service status and statistics
  isConfigured(): any {
    return {
      database: this.isInitialized,
      ai: !!this.genAI,
      caching: true,
      forecasting: true,
      dynamicPricing: true,
      autoRestock: true
    };
  }

  async getStats(): Promise<any> {
    try {
      const totalItems = await InventoryItem.countDocuments();
      const activeItems = await InventoryItem.countDocuments({ status: 'active' });
      const lowStockItems = await InventoryItem.countDocuments({ 
        $expr: { $lte: ['$availableQuantity', '$minimumThreshold'] } 
      });
      const outOfStockItems = await InventoryItem.countDocuments({ status: 'out_of_stock' });
      const totalForecasts = await DemandForecast.countDocuments();
      const totalAlerts = await InventoryAlert.countDocuments({ isResolved: false });

      return {
        inventory: {
          totalItems,
          activeItems,
          lowStockItems,
          outOfStockItems,
          stockingRate: totalItems > 0 ? ((totalItems - outOfStockItems) / totalItems * 100) : 100
        },
        forecasting: {
          totalForecasts,
          avgAccuracy: totalForecasts > 0 ? 75 : 0, // This would be calculated from actual data
          modelsUsed: ['simple', 'statistical', 'ai'].filter(m => 
            this.isConfigured()[m] !== false
          )
        },
        alerts: {
          totalActive: totalAlerts,
          criticalAlerts: await InventoryAlert.countDocuments({ severity: 'critical', isResolved: false })
        },
        optimization: {
          itemsOptimized: 0, // This would be tracked
          estimatedSavings: 0,
          lastRunAt: new Date()
        }
      };
    } catch (error) {
      logger.error('Failed to get inventory stats:', error);
      return {
        inventory: { totalItems: 0, activeItems: 0, lowStockItems: 0, outOfStockItems: 0 },
        forecasting: { totalForecasts: 0, avgAccuracy: 0 },
        alerts: { totalActive: 0, criticalAlerts: 0 },
        optimization: { itemsOptimized: 0, estimatedSavings: 0 }
      };
    }
  }
}

// Export singleton instance
export const inventoryManagementService = new InventoryManagementService();