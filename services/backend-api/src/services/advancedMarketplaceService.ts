import mongoose, { Document, Schema } from 'mongoose';
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';
import { recommendationEngine } from './recommendationEngine';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Advanced Marketplace Types
interface IMarketplaceCategory extends Document {
  name: string;
  slug: string;
  description: string;
  icon: string;
  parentCategory?: string;
  subcategories: string[];
  metadata: {
    serviceCount: number;
    popularityScore: number;
    averagePrice: number;
    trends: Record<string, number>;
  };
  featuredServices: string[];
  isActive: boolean;
}

interface IServiceVerification extends Document {
  serviceId: string;
  businessId: string;
  verificationType: 'license' | 'certification' | 'background_check' | 'insurance' | 'quality_assurance';
  verificationProvider: string;
  verificationId: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verifiedAt?: Date;
  expiresAt?: Date;
  documents: {
    name: string;
    url: string;
    type: string;
  }[];
  verificationData: Record<string, any>;
}

interface IAdvancedReview extends Document {
  serviceId: string;
  businessId: string;
  customerId: string;
  bookingId: string;
  
  // Enhanced rating system
  ratings: {
    overall: number;
    quality: number;
    value: number;
    service: number;
    cleanliness: number;
    punctuality: number;
    communication: number;
  };
  
  // Rich review content
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  images: string[];
  
  // AI analysis
  sentiment: {
    score: number; // -1 to 1
    confidence: number;
    keywords: string[];
    topics: string[];
  };
  
  // Verification
  isVerified: boolean;
  verificationMethod: 'booking' | 'phone' | 'email' | 'manual';
  
  // Helpfulness tracking
  helpfulVotes: number;
  totalVotes: number;
  
  // Response system
  businessResponse?: {
    content: string;
    respondedAt: Date;
    respondedBy: string;
  };
  
  // Moderation
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationFlags: string[];
  
  status: 'active' | 'hidden' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

interface IMarketplacePromotion extends Document {
  title: string;
  description: string;
  type: 'discount' | 'flash_sale' | 'bundle' | 'loyalty' | 'referral' | 'seasonal';
  
  // Targeting
  targeting: {
    categories: string[];
    businesses: string[];
    services: string[];
    userSegments: string[];
    locations: {
      lat: number;
      lng: number;
      radius: number;
    }[];
    demographics: {
      ageRange?: { min: number; max: number };
      interests?: string[];
      behaviorTags?: string[];
    };
  };
  
  // Promotion details
  discount: {
    type: 'percentage' | 'fixed' | 'bogo' | 'free_addon';
    value: number;
    maxDiscount?: number;
    minPurchase?: number;
  };
  
  // Timing
  startDate: Date;
  endDate: Date;
  timeRestrictions?: {
    daysOfWeek: number[];
    timeSlots: string[];
  };
  
  // Limits
  usageLimit: {
    total?: number;
    perUser?: number;
    perDay?: number;
  };
  
  // Performance tracking
  metrics: {
    views: number;
    clicks: number;
    conversions: number;
    revenue: number;
    usageCount: number;
  };
  
  status: 'draft' | 'active' | 'paused' | 'expired' | 'completed';
  createdBy: string;
}

interface IServiceComparison extends Document {
  userId: string;
  services: {
    serviceId: string;
    businessId: string;
    addedAt: Date;
  }[];
  comparisonData: {
    features: Record<string, any>;
    pricing: Record<string, number>;
    ratings: Record<string, number>;
    availability: Record<string, any>;
  };
  sharedWith: string[];
  isPublic: boolean;
  expiresAt: Date;
}

interface IMarketplaceInsight {
  category: string;
  insights: {
    demandTrends: Record<string, number>;
    priceAnalysis: {
      average: number;
      median: number;
      range: { min: number; max: number };
      trends: Record<string, number>;
    };
    competitionLevel: number;
    seasonalPatterns: Record<string, number>;
    customerPreferences: Record<string, number>;
    gapAnalysis: {
      underservedAreas: string[];
      priceGaps: { min: number; max: number }[];
      serviceGaps: string[];
    };
  };
  recommendations: {
    pricing: string[];
    services: string[];
    marketing: string[];
    timing: string[];
  };
}

// Schemas
const MarketplaceCategorySchema = new Schema<IMarketplaceCategory>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  parentCategory: { type: String, ref: 'MarketplaceCategory' },
  subcategories: [{ type: String, ref: 'MarketplaceCategory' }],
  metadata: {
    serviceCount: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 },
    averagePrice: { type: Number, default: 0 },
    trends: { type: Map, of: Number, default: new Map() }
  },
  featuredServices: [{ type: String, ref: 'Service' }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

const ServiceVerificationSchema = new Schema<IServiceVerification>({
  serviceId: { type: String, required: true, ref: 'Service' },
  businessId: { type: String, required: true, ref: 'Business' },
  verificationType: {
    type: String,
    enum: ['license', 'certification', 'background_check', 'insurance', 'quality_assurance'],
    required: true
  },
  verificationProvider: { type: String, required: true },
  verificationId: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'expired'],
    default: 'pending'
  },
  verifiedAt: Date,
  expiresAt: Date,
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  verificationData: { type: Map, of: Schema.Types.Mixed }
}, {
  timestamps: true
});

const AdvancedReviewSchema = new Schema<IAdvancedReview>({
  serviceId: { type: String, required: true, ref: 'Service' },
  businessId: { type: String, required: true, ref: 'Business' },
  customerId: { type: String, required: true, ref: 'Customer' },
  bookingId: { type: String, required: true, ref: 'Booking' },
  
  ratings: {
    overall: { type: Number, required: true, min: 1, max: 5 },
    quality: { type: Number, required: true, min: 1, max: 5 },
    value: { type: Number, required: true, min: 1, max: 5 },
    service: { type: Number, required: true, min: 1, max: 5 },
    cleanliness: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 }
  },
  
  title: { type: String, required: true, maxlength: 100 },
  content: { type: String, required: true, maxlength: 2000 },
  pros: [{ type: String, maxlength: 200 }],
  cons: [{ type: String, maxlength: 200 }],
  images: [String],
  
  sentiment: {
    score: { type: Number, min: -1, max: 1 },
    confidence: { type: Number, min: 0, max: 1 },
    keywords: [String],
    topics: [String]
  },
  
  isVerified: { type: Boolean, default: false },
  verificationMethod: {
    type: String,
    enum: ['booking', 'phone', 'email', 'manual'],
    default: 'booking'
  },
  
  helpfulVotes: { type: Number, default: 0 },
  totalVotes: { type: Number, default: 0 },
  
  businessResponse: {
    content: { type: String, maxlength: 1000 },
    respondedAt: Date,
    respondedBy: String
  },
  
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderationFlags: [String],
  
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

const MarketplacePromotionSchema = new Schema<IMarketplacePromotion>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['discount', 'flash_sale', 'bundle', 'loyalty', 'referral', 'seasonal'],
    required: true
  },
  
  targeting: {
    categories: [String],
    businesses: [String],
    services: [String],
    userSegments: [String],
    locations: [{
      lat: Number,
      lng: Number,
      radius: Number
    }],
    demographics: {
      ageRange: {
        min: Number,
        max: Number
      },
      interests: [String],
      behaviorTags: [String]
    }
  },
  
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'bogo', 'free_addon'],
      required: true
    },
    value: { type: Number, required: true },
    maxDiscount: Number,
    minPurchase: Number
  },
  
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timeRestrictions: {
    daysOfWeek: [Number],
    timeSlots: [String]
  },
  
  usageLimit: {
    total: Number,
    perUser: Number,
    perDay: Number
  },
  
  metrics: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 }
  },
  
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'expired', 'completed'],
    default: 'draft'
  },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

const ServiceComparisonSchema = new Schema<IServiceComparison>({
  userId: { type: String, required: true },
  services: [{
    serviceId: { type: String, required: true },
    businessId: { type: String, required: true },
    addedAt: { type: Date, default: Date.now }
  }],
  comparisonData: {
    features: { type: Map, of: Schema.Types.Mixed },
    pricing: { type: Map, of: Number },
    ratings: { type: Map, of: Number },
    availability: { type: Map, of: Schema.Types.Mixed }
  },
  sharedWith: [String],
  isPublic: { type: Boolean, default: false },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
}, {
  timestamps: true
});

// Indexes
MarketplaceCategorySchema.index({ slug: 1 });
MarketplaceCategorySchema.index({ parentCategory: 1 });
ServiceVerificationSchema.index({ serviceId: 1, businessId: 1 });
ServiceVerificationSchema.index({ status: 1, expiresAt: 1 });
AdvancedReviewSchema.index({ serviceId: 1, businessId: 1 });
AdvancedReviewSchema.index({ customerId: 1 });
AdvancedReviewSchema.index({ moderationStatus: 1 });
MarketplacePromotionSchema.index({ status: 1, startDate: 1, endDate: 1 });
ServiceComparisonSchema.index({ userId: 1 });

// Models
const MarketplaceCategory = mongoose.model<IMarketplaceCategory>('MarketplaceCategory', MarketplaceCategorySchema);
const ServiceVerification = mongoose.model<IServiceVerification>('ServiceVerification', ServiceVerificationSchema);
const AdvancedReview = mongoose.model<IAdvancedReview>('AdvancedReview', AdvancedReviewSchema);
const MarketplacePromotion = mongoose.model<IMarketplacePromotion>('MarketplacePromotion', MarketplacePromotionSchema);
const ServiceComparison = mongoose.model<IServiceComparison>('ServiceComparison', ServiceComparisonSchema);

// Advanced Marketplace Service
export class AdvancedMarketplaceService {
  private ai?: GoogleGenerativeAI;

  constructor() {
    if (process.env.API_KEY) {
      this.ai = new GoogleGenerativeAI(process.env.API_KEY);
    }
  }

  // Category Management
  async createCategory(data: {
    name: string;
    description: string;
    icon: string;
    parentCategory?: string;
  }): Promise<IMarketplaceCategory> {
    try {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const category = new MarketplaceCategory({
        ...data,
        slug
      });

      await category.save();

      // Update parent category if specified
      if (data.parentCategory) {
        await MarketplaceCategory.findByIdAndUpdate(
          data.parentCategory,
          { $addToSet: { subcategories: category.id } }
        );
      }

      logger.info('Marketplace category created:', { categoryId: category.id, name: data.name });
      return category;
    } catch (error) {
      logger.error('Failed to create category:', error);
      throw error;
    }
  }

  async updateCategoryMetrics(categoryId: string): Promise<void> {
    try {
      // This would calculate real metrics from services and bookings
      const serviceCount = await mongoose.model('Service').countDocuments({ category: categoryId });
      const avgPrice = 100; // Would calculate from actual services
      const popularityScore = serviceCount * 0.1; // Simplified calculation

      await MarketplaceCategory.findByIdAndUpdate(categoryId, {
        'metadata.serviceCount': serviceCount,
        'metadata.averagePrice': avgPrice,
        'metadata.popularityScore': popularityScore
      });

      logger.info('Category metrics updated:', { categoryId, serviceCount, avgPrice });
    } catch (error) {
      logger.error('Failed to update category metrics:', error);
    }
  }

  // Service Verification System
  async submitVerification(data: {
    serviceId: string;
    businessId: string;
    verificationType: string;
    verificationProvider: string;
    documents: { name: string; url: string; type: string }[];
  }): Promise<IServiceVerification> {
    try {
      const verification = new ServiceVerification({
        ...data,
        verificationId: `VER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending'
      });

      await verification.save();

      // Trigger verification process (would integrate with external providers)
      await this.processVerification(verification.id);

      logger.info('Verification submitted:', { 
        verificationId: verification.id,
        serviceId: data.serviceId,
        type: data.verificationType
      });

      return verification;
    } catch (error) {
      logger.error('Failed to submit verification:', error);
      throw error;
    }
  }

  private async processVerification(verificationId: string): Promise<void> {
    try {
      // In a real implementation, this would:
      // 1. Call external verification APIs
      // 2. Process uploaded documents
      // 3. Update verification status
      
      // For demo, auto-approve after delay
      setTimeout(async () => {
        await ServiceVerification.findByIdAndUpdate(verificationId, {
          status: 'verified',
          verifiedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        });

        logger.info('Verification processed:', { verificationId });
      }, 5000);
    } catch (error) {
      logger.error('Failed to process verification:', error);
    }
  }

  // Advanced Review System
  async createAdvancedReview(data: {
    serviceId: string;
    businessId: string;
    customerId: string;
    bookingId: string;
    ratings: Record<string, number>;
    title: string;
    content: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
  }): Promise<IAdvancedReview> {
    try {
      // Analyze sentiment using AI
      const sentiment = await this.analyzeSentiment(data.content);
      
      const review = new AdvancedReview({
        ...data,
        sentiment,
        isVerified: true, // Verified through booking
        verificationMethod: 'booking',
        moderationStatus: 'pending'
      });

      await review.save();

      // Process for moderation
      await this.moderateReview(review.id);

      // Update service ratings
      await this.updateServiceRatings(data.serviceId);

      logger.info('Advanced review created:', { 
        reviewId: review.id,
        serviceId: data.serviceId,
        rating: data.ratings.overall
      });

      return review;
    } catch (error) {
      logger.error('Failed to create review:', error);
      throw error;
    }
  }

  private async analyzeSentiment(text: string): Promise<{
    score: number;
    confidence: number;
    keywords: string[];
    topics: string[];
  }> {
    try {
      if (!this.ai) {
        return {
          score: 0,
          confidence: 0.5,
          keywords: [],
          topics: []
        };
      }

      const model = this.ai.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `
        Analyze the sentiment of this review and extract key information:
        "${text}"
        
        Return a JSON object with:
        - score: sentiment score from -1 (negative) to 1 (positive)
        - confidence: confidence level from 0 to 1
        - keywords: array of important keywords
        - topics: array of main topics discussed
        
        Example format:
        {"score": 0.8, "confidence": 0.9, "keywords": ["excellent", "professional"], "topics": ["service quality", "staff behavior"]}
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();
      
      try {
        const parsed = JSON.parse(response);
        return {
          score: Math.max(-1, Math.min(1, parsed.score || 0)),
          confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          topics: Array.isArray(parsed.topics) ? parsed.topics : []
        };
      } catch (parseError) {
        logger.warn('Failed to parse AI sentiment response:', parseError);
        return { score: 0, confidence: 0.5, keywords: [], topics: [] };
      }
    } catch (error) {
      logger.error('Failed to analyze sentiment:', error);
      return { score: 0, confidence: 0.5, keywords: [], topics: [] };
    }
  }

  private async moderateReview(reviewId: string): Promise<void> {
    try {
      const review = await AdvancedReview.findById(reviewId);
      if (!review) return;

      // Simple moderation rules
      const flags = [];
      const content = review.content.toLowerCase();
      
      // Check for inappropriate content
      const inappropriateWords = ['spam', 'fake', 'scam']; // Would be more comprehensive
      if (inappropriateWords.some(word => content.includes(word))) {
        flags.push('inappropriate_content');
      }

      // Check sentiment extremes
      if (review.sentiment.score < -0.8 && review.sentiment.confidence > 0.8) {
        flags.push('extremely_negative');
      }

      const status = flags.length > 0 ? 'flagged' : 'approved';

      await AdvancedReview.findByIdAndUpdate(reviewId, {
        moderationStatus: status,
        moderationFlags: flags
      });

      logger.info('Review moderated:', { reviewId, status, flags });
    } catch (error) {
      logger.error('Failed to moderate review:', error);
    }
  }

  private async updateServiceRatings(serviceId: string): Promise<void> {
    try {
      const reviews = await AdvancedReview.find({
        serviceId,
        moderationStatus: 'approved',
        status: 'active'
      });

      if (reviews.length === 0) return;

      // Calculate average ratings
      const ratingCategories = ['overall', 'quality', 'value', 'service', 'cleanliness', 'punctuality', 'communication'];
      const averageRatings: Record<string, number> = {};

      ratingCategories.forEach(category => {
        const ratings = reviews
          .map(r => r.ratings[category as keyof typeof r.ratings])
          .filter(r => r != null);
        
        if (ratings.length > 0) {
          averageRatings[category] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        }
      });

      // Update service with new ratings
      await mongoose.model('Service').findByIdAndUpdate(serviceId, {
        ratings: averageRatings,
        reviewCount: reviews.length,
        averageRating: averageRatings.overall || 0
      });

      logger.info('Service ratings updated:', { serviceId, reviewCount: reviews.length });
    } catch (error) {
      logger.error('Failed to update service ratings:', error);
    }
  }

  // Marketplace Promotions
  async createPromotion(data: Partial<IMarketplacePromotion>): Promise<IMarketplacePromotion> {
    try {
      const promotion = new MarketplacePromotion(data);
      await promotion.save();

      // Cache active promotions
      await this.cacheActivePromotions();

      logger.info('Promotion created:', { promotionId: promotion.id, type: promotion.type });
      return promotion;
    } catch (error) {
      logger.error('Failed to create promotion:', error);
      throw error;
    }
  }

  async getActivePromotions(filters: {
    categories?: string[];
    location?: { lat: number; lng: number };
    userId?: string;
  }): Promise<IMarketplacePromotion[]> {
    try {
      const cacheKey = `active_promotions:${JSON.stringify(filters)}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const now = new Date();
      let query: any = {
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now }
      };

      // Apply filters
      if (filters.categories?.length) {
        query['targeting.categories'] = { $in: filters.categories };
      }

      const promotions = await MarketplacePromotion.find(query)
        .sort({ startDate: -1 })
        .limit(20);

      // Filter by location if provided
      let filteredPromotions = promotions;
      if (filters.location) {
        filteredPromotions = promotions.filter(promo => 
          this.isLocationInTargeting(filters.location!, promo.targeting.locations)
        );
      }

      await cacheService.setex(cacheKey, 600, JSON.stringify(filteredPromotions)); // 10 min cache
      return filteredPromotions;
    } catch (error) {
      logger.error('Failed to get active promotions:', error);
      return [];
    }
  }

  private isLocationInTargeting(
    userLocation: { lat: number; lng: number },
    targetLocations: { lat: number; lng: number; radius: number }[]
  ): boolean {
    if (!targetLocations?.length) return true; // No location restrictions

    return targetLocations.some(target => {
      const distance = this.calculateDistance(
        userLocation.lat, userLocation.lng,
        target.lat, target.lng
      );
      return distance <= target.radius;
    });
  }

  // Service Comparison Tool
  async createServiceComparison(data: {
    userId: string;
    serviceIds: string[];
  }): Promise<IServiceComparison> {
    try {
      const services = await mongoose.model('Service')
        .find({ _id: { $in: data.serviceIds } })
        .populate('businessId');

      const comparisonData = await this.generateComparisonData(services);

      const comparison = new ServiceComparison({
        userId: data.userId,
        services: data.serviceIds.map(id => ({
          serviceId: id,
          businessId: services.find(s => s.id === id)?.businessId || '',
          addedAt: new Date()
        })),
        comparisonData
      });

      await comparison.save();

      logger.info('Service comparison created:', { 
        comparisonId: comparison.id,
        serviceCount: data.serviceIds.length
      });

      return comparison;
    } catch (error) {
      logger.error('Failed to create service comparison:', error);
      throw error;
    }
  }

  private async generateComparisonData(services: any[]): Promise<{
    features: Record<string, any>;
    pricing: Record<string, number>;
    ratings: Record<string, number>;
    availability: Record<string, any>;
  }> {
    const comparisonData = {
      features: {},
      pricing: {},
      ratings: {},
      availability: {}
    };

    services.forEach(service => {
      comparisonData.pricing[service.id] = service.price;
      comparisonData.ratings[service.id] = service.averageRating || 0;
      comparisonData.features[service.id] = {
        duration: service.duration,
        category: service.category,
        description: service.description
      };
      comparisonData.availability[service.id] = {
        timeSlots: service.availableTimeSlots || [],
        weekDays: service.availableWeekDays || []
      };
    });

    return comparisonData;
  }

  // Marketplace Insights
  async generateMarketplaceInsights(category: string): Promise<IMarketplaceInsight> {
    try {
      const cacheKey = `marketplace_insights:${category}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Analyze services in category
      const services = await mongoose.model('Service').find({ category });
      const bookings = await mongoose.model('Booking').find({
        serviceId: { $in: services.map(s => s.id) }
      });

      const insights: IMarketplaceInsight = {
        category,
        insights: {
          demandTrends: this.calculateDemandTrends(bookings),
          priceAnalysis: this.analyzePricing(services),
          competitionLevel: this.calculateCompetitionLevel(services),
          seasonalPatterns: this.analyzeSeasonalPatterns(bookings),
          customerPreferences: this.analyzeCustomerPreferences(bookings),
          gapAnalysis: await this.performGapAnalysis(category, services)
        },
        recommendations: await this.generateRecommendations(category, services, bookings)
      };

      await cacheService.setex(cacheKey, 3600, JSON.stringify(insights)); // 1 hour cache
      return insights;
    } catch (error) {
      logger.error('Failed to generate marketplace insights:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateDemandTrends(bookings: any[]): Record<string, number> {
    // Calculate demand trends over time
    const trends: Record<string, number> = {};
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const monthKey = new Date(now.getFullYear(), now.getMonth() - i, 1)
        .toISOString()
        .substr(0, 7);
      
      trends[monthKey] = bookings.filter(b => 
        b.createdAt >= new Date(now.getFullYear(), now.getMonth() - i, 1) &&
        b.createdAt < new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      ).length;
    }
    
    return trends;
  }

  private analyzePricing(services: any[]): {
    average: number;
    median: number;
    range: { min: number; max: number };
    trends: Record<string, number>;
  } {
    const prices = services.map(s => s.price).sort((a, b) => a - b);
    
    return {
      average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      median: prices[Math.floor(prices.length / 2)],
      range: { min: prices[0], max: prices[prices.length - 1] },
      trends: {} // Would calculate historical price trends
    };
  }

  private calculateCompetitionLevel(services: any[]): number {
    // Simple competition calculation based on service density
    return Math.min(services.length / 10, 1); // Scale 0-1
  }

  private analyzeSeasonalPatterns(bookings: any[]): Record<string, number> {
    const patterns: Record<string, number> = {};
    const seasons = ['spring', 'summer', 'fall', 'winter'];
    
    seasons.forEach((season, index) => {
      const seasonBookings = bookings.filter(b => {
        const month = new Date(b.createdAt).getMonth();
        const seasonStart = index * 3;
        return month >= seasonStart && month < seasonStart + 3;
      });
      
      patterns[season] = seasonBookings.length;
    });
    
    return patterns;
  }

  private analyzeCustomerPreferences(bookings: any[]): Record<string, number> {
    // Analyze booking patterns to understand preferences
    const preferences: Record<string, number> = {
      morningBookings: bookings.filter(b => 
        new Date(b.scheduledFor).getHours() < 12
      ).length / bookings.length,
      
      weekendBookings: bookings.filter(b => {
        const day = new Date(b.scheduledFor).getDay();
        return day === 0 || day === 6;
      }).length / bookings.length,
      
      advanceBookings: bookings.filter(b => {
        const advance = new Date(b.scheduledFor).getTime() - new Date(b.createdAt).getTime();
        return advance > 24 * 60 * 60 * 1000; // More than 1 day advance
      }).length / bookings.length
    };
    
    return preferences;
  }

  private async performGapAnalysis(category: string, services: any[]): Promise<{
    underservedAreas: string[];
    priceGaps: { min: number; max: number }[];
    serviceGaps: string[];
  }> {
    // Analyze market gaps
    return {
      underservedAreas: [], // Would analyze geographic gaps
      priceGaps: [], // Would identify price point gaps
      serviceGaps: [] // Would identify missing service types
    };
  }

  private async generateRecommendations(
    category: string,
    services: any[],
    bookings: any[]
  ): Promise<{
    pricing: string[];
    services: string[];
    marketing: string[];
    timing: string[];
  }> {
    const avgPrice = services.reduce((sum, s) => sum + s.price, 0) / services.length;
    
    return {
      pricing: [
        avgPrice > 100 ? 'Consider competitive pricing strategies' : 'Premium pricing opportunities available',
        'Dynamic pricing based on demand could increase revenue'
      ],
      services: [
        'Bundle complementary services for higher value',
        'Consider mobile or on-demand options'
      ],
      marketing: [
        'Focus on digital marketing for younger demographics',
        'Leverage customer reviews and social proof'
      ],
      timing: [
        'Promote off-peak hours with discounts',
        'Seasonal campaigns can boost bookings'
      ]
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async cacheActivePromotions(): Promise<void> {
    try {
      const activePromotions = await MarketplacePromotion.find({
        status: 'active',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      });

      await cacheService.setex('active_promotions', 600, JSON.stringify(activePromotions));
    } catch (error) {
      logger.error('Failed to cache active promotions:', error);
    }
  }

  // Public methods for configuration and stats
  isConfigured(): { database: boolean; ai: boolean; cache: boolean } {
    return {
      database: mongoose.connection.readyState === 1,
      ai: !!this.ai,
      cache: true
    };
  }

  async getStats(): Promise<{
    categories: number;
    verifications: { pending: number; verified: number };
    reviews: { total: number; avgRating: number };
    promotions: { active: number; total: number };
    comparisons: number;
  }> {
    try {
      const [
        categoryCount,
        pendingVerifications,
        verifiedCount,
        totalReviews,
        avgRating,
        activePromotions,
        totalPromotions,
        comparisonCount
      ] = await Promise.all([
        MarketplaceCategory.countDocuments({ isActive: true }),
        ServiceVerification.countDocuments({ status: 'pending' }),
        ServiceVerification.countDocuments({ status: 'verified' }),
        AdvancedReview.countDocuments({ status: 'active' }),
        AdvancedReview.aggregate([
          { $match: { status: 'active', moderationStatus: 'approved' } },
          { $group: { _id: null, avgRating: { $avg: '$ratings.overall' } } }
        ]).then(result => result[0]?.avgRating || 0),
        MarketplacePromotion.countDocuments({ status: 'active' }),
        MarketplacePromotion.countDocuments(),
        ServiceComparison.countDocuments()
      ]);

      return {
        categories: categoryCount,
        verifications: {
          pending: pendingVerifications,
          verified: verifiedCount
        },
        reviews: {
          total: totalReviews,
          avgRating: Math.round(avgRating * 100) / 100
        },
        promotions: {
          active: activePromotions,
          total: totalPromotions
        },
        comparisons: comparisonCount
      };
    } catch (error) {
      logger.error('Failed to get marketplace stats:', error);
      return {
        categories: 0,
        verifications: { pending: 0, verified: 0 },
        reviews: { total: 0, avgRating: 0 },
        promotions: { active: 0, total: 0 },
        comparisons: 0
      };
    }
  }
}

// Export singleton instance
export const advancedMarketplaceService = new AdvancedMarketplaceService();
export {
  IMarketplaceCategory,
  IServiceVerification,
  IAdvancedReview,
  IMarketplacePromotion,
  IServiceComparison,
  IMarketplaceInsight,
  MarketplaceCategory,
  ServiceVerification,
  AdvancedReview,
  MarketplacePromotion,
  ServiceComparison
};