import { Matrix } from 'ml-matrix';
import { NlpManager } from 'node-nlp';
import { SentimentAnalyzer, PorterStemmer } from 'natural';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';
import mongoose from 'mongoose';

// Types
interface UserProfile {
  userId: string;
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    timePreferences: string[];
    locationRadius: number;
  };
  behaviorMetrics: {
    bookingFrequency: number;
    averageSpent: number;
    preferredTimes: string[];
    seasonalPatterns: Record<string, number>;
  };
  demographics: {
    ageGroup?: string;
    location?: { lat: number; lng: number };
    deviceType?: string;
  };
}

interface ServiceProfile {
  serviceId: string;
  businessId: string;
  features: {
    category: string;
    subcategory: string;
    price: number;
    duration: number;
    rating: number;
    popularity: number;
    keywords: string[];
  };
  availability: {
    timeSlots: string[];
    weekDays: number[];
    capacity: number;
  };
  performance: {
    bookingRate: number;
    cancellationRate: number;
    satisfaction: number;
  };
}

interface Recommendation {
  serviceId: string;
  businessId: string;
  score: number;
  reason: string;
  confidence: number;
  metadata: {
    algorithm: string;
    factors: Record<string, number>;
    timestamp: Date;
  };
}

interface BusinessIntelligence {
  businessId: string;
  insights: {
    demandPrediction: Record<string, number>;
    priceOptimization: Record<string, number>;
    inventoryRecommendations: string[];
    marketingTargets: UserProfile[];
  };
  competitiveAnalysis: {
    position: number;
    strengths: string[];
    opportunities: string[];
    threats: string[];
  };
}

// Recommendation Engine Service
export class RecommendationEngine {
  private nlp: NlpManager;
  private sentimentAnalyzer: SentimentAnalyzer;
  private ai?: GoogleGenerativeAI;
  private userProfiles: Map<string, UserProfile> = new Map();
  private serviceProfiles: Map<string, ServiceProfile> = new Map();
  private interactionMatrix?: Matrix;

  constructor() {
    this.initializeNLP();
    this.initializeSentiment();
    this.initializeAI();
    this.loadProfiles();
  }

  private initializeNLP() {
    try {
      this.nlp = new NlpManager({
        languages: ['en'],
        forceNER: true,
        autoSave: false
      });

      // Train the NLP model with service categories and intents
      this.trainNLPModel();
    } catch (error) {
      logger.error('Failed to initialize NLP:', error);
    }
  }

  private initializeSentiment() {
    try {
      this.sentimentAnalyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
    } catch (error) {
      logger.error('Failed to initialize sentiment analyzer:', error);
    }
  }

  private initializeAI() {
    if (process.env.API_KEY) {
      this.ai = new GoogleGenerativeAI(process.env.API_KEY);
    }
  }

  private async trainNLPModel() {
    try {
      // Service categories and intents
      const categories = [
        'beauty', 'wellness', 'fitness', 'health', 'education',
        'automotive', 'home-services', 'events', 'professional'
      ];

      const intents = [
        'book_service', 'find_nearby', 'compare_prices', 'check_availability',
        'read_reviews', 'urgent_booking', 'gift_booking', 'group_booking'
      ];

      // Train intents
      for (const intent of intents) {
        this.nlp.addDocument('en', `I want to ${intent.replace('_', ' ')}`, intent);
        this.nlp.addDocument('en', `Looking for ${intent.replace('_', ' ')}`, intent);
        this.nlp.addDocument('en', `Need to ${intent.replace('_', ' ')}`, intent);
      }

      // Train categories
      for (const category of categories) {
        this.nlp.addDocument('en', `Looking for ${category} services`, `category_${category}`);
        this.nlp.addDocument('en', `I need ${category} help`, `category_${category}`);
      }

      await this.nlp.train();
      logger.info('NLP model trained successfully');
    } catch (error) {
      logger.error('Failed to train NLP model:', error);
    }
  }

  private async loadProfiles() {
    try {
      // Load user profiles from database/cache
      const cachedProfiles = await cacheService.get('user_profiles');
      if (cachedProfiles) {
        this.userProfiles = new Map(JSON.parse(cachedProfiles));
      }

      // Load service profiles
      const cachedServices = await cacheService.get('service_profiles');
      if (cachedServices) {
        this.serviceProfiles = new Map(JSON.parse(cachedServices));
      }

      logger.info(`Loaded ${this.userProfiles.size} user profiles and ${this.serviceProfiles.size} service profiles`);
    } catch (error) {
      logger.error('Failed to load profiles:', error);
    }
  }

  // Build user profile from historical data
  async buildUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Query user's booking history, preferences, and behavior
      const bookings = await mongoose.model('Booking').find({ customerId: userId }).populate('serviceId businessId');
      const reviews = await mongoose.model('Review').find({ customerId: userId });

      // Analyze booking patterns
      const categories = [...new Set(bookings.map(b => b.serviceId?.category).filter(Boolean))];
      const avgSpent = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) / bookings.length || 0;
      
      // Time preferences analysis
      const timePreferences = this.analyzeTimePreferences(bookings);
      
      // Seasonal patterns
      const seasonalPatterns = this.analyzeSeasonalPatterns(bookings);

      // Price range analysis
      const prices = bookings.map(b => b.totalAmount || 0).sort((a, b) => a - b);
      const priceRange = {
        min: prices[Math.floor(prices.length * 0.25)] || 0,
        max: prices[Math.floor(prices.length * 0.75)] || 1000
      };

      const profile: UserProfile = {
        userId,
        preferences: {
          categories,
          priceRange,
          timePreferences,
          locationRadius: 10 // Default 10km
        },
        behaviorMetrics: {
          bookingFrequency: bookings.length,
          averageSpent: avgSpent,
          preferredTimes: timePreferences,
          seasonalPatterns
        },
        demographics: {
          // These would be collected from user registration or inferred
        }
      };

      this.userProfiles.set(userId, profile);
      await this.cacheProfiles();

      return profile;
    } catch (error) {
      logger.error('Failed to build user profile:', error);
      throw error;
    }
  }

  // Build service profile from performance data
  async buildServiceProfile(serviceId: string): Promise<ServiceProfile> {
    try {
      const service = await mongoose.model('Service').findById(serviceId).populate('businessId');
      const bookings = await mongoose.model('Booking').find({ serviceId });
      const reviews = await mongoose.model('Review').find({ serviceId });

      // Calculate performance metrics
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      
      const rating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;
      const bookingRate = completedBookings / totalBookings || 0;
      const cancellationRate = cancelledBookings / totalBookings || 0;

      // Extract keywords from description and reviews
      const keywords = await this.extractServiceKeywords(service, reviews);

      const profile: ServiceProfile = {
        serviceId,
        businessId: service.businessId,
        features: {
          category: service.category,
          subcategory: service.subcategory || '',
          price: service.price,
          duration: service.duration,
          rating,
          popularity: totalBookings,
          keywords
        },
        availability: {
          timeSlots: service.availableTimeSlots || [],
          weekDays: service.availableWeekDays || [1, 2, 3, 4, 5],
          capacity: service.capacity || 1
        },
        performance: {
          bookingRate,
          cancellationRate,
          satisfaction: rating / 5 // Normalize to 0-1
        }
      };

      this.serviceProfiles.set(serviceId, profile);
      await this.cacheProfiles();

      return profile;
    } catch (error) {
      logger.error('Failed to build service profile:', error);
      throw error;
    }
  }

  // Generate personalized recommendations
  async getRecommendations(
    userId: string, 
    options: {
      limit?: number;
      categories?: string[];
      location?: { lat: number; lng: number; radius: number };
      priceRange?: { min: number; max: number };
      timeSlot?: string;
    } = {}
  ): Promise<Recommendation[]> {
    try {
      const { limit = 10 } = options;
      
      // Get or build user profile
      let userProfile = this.userProfiles.get(userId);
      if (!userProfile) {
        userProfile = await this.buildUserProfile(userId);
      }

      // Get candidate services
      const candidates = await this.getCandidateServices(userProfile, options);
      
      // Calculate recommendations using multiple algorithms
      const recommendations: Recommendation[] = [];

      for (const serviceProfile of candidates) {
        // Collaborative Filtering Score
        const cfScore = await this.calculateCollaborativeFilteringScore(userId, serviceProfile.serviceId);
        
        // Content-Based Score
        const cbScore = this.calculateContentBasedScore(userProfile, serviceProfile);
        
        // Popularity Score
        const popularityScore = this.calculatePopularityScore(serviceProfile);
        
        // Location Score (if location provided)
        const locationScore = options.location ? 
          await this.calculateLocationScore(serviceProfile, options.location) : 0.5;

        // AI-Enhanced Score (if AI available)
        const aiScore = this.ai ? 
          await this.calculateAIScore(userProfile, serviceProfile) : 0.5;

        // Combine scores with weights
        const finalScore = (
          cfScore * 0.3 +
          cbScore * 0.25 +
          popularityScore * 0.15 +
          locationScore * 0.15 +
          aiScore * 0.15
        );

        // Generate explanation
        const reason = this.generateRecommendationReason(userProfile, serviceProfile, {
          cf: cfScore,
          cb: cbScore,
          popularity: popularityScore,
          location: locationScore,
          ai: aiScore
        });

        recommendations.push({
          serviceId: serviceProfile.serviceId,
          businessId: serviceProfile.businessId,
          score: finalScore,
          reason,
          confidence: Math.min(finalScore * 1.2, 1.0), // Cap at 1.0
          metadata: {
            algorithm: 'hybrid_ensemble',
            factors: {
              collaborative: cfScore,
              content: cbScore,
              popularity: popularityScore,
              location: locationScore,
              ai: aiScore
            },
            timestamp: new Date()
          }
        });
      }

      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      logger.error('Failed to generate recommendations:', error);
      return [];
    }
  }

  // Collaborative Filtering using user-item interactions
  private async calculateCollaborativeFilteringScore(userId: string, serviceId: string): Promise<number> {
    try {
      // Build interaction matrix if not exists
      if (!this.interactionMatrix) {
        await this.buildInteractionMatrix();
      }

      // Find similar users based on booking patterns
      const userSimilarities = await this.findSimilarUsers(userId);
      
      // Calculate weighted score based on similar users' preferences
      let score = 0;
      let totalWeight = 0;

      for (const [similarUserId, similarity] of userSimilarities) {
        const userRating = await this.getUserServiceRating(similarUserId, serviceId);
        if (userRating > 0) {
          score += similarity * userRating;
          totalWeight += similarity;
        }
      }

      return totalWeight > 0 ? score / totalWeight : 0.5;
    } catch (error) {
      logger.error('Collaborative filtering calculation failed:', error);
      return 0.5;
    }
  }

  // Content-based filtering using service features
  private calculateContentBasedScore(userProfile: UserProfile, serviceProfile: ServiceProfile): number {
    try {
      let score = 0;
      
      // Category preference match
      const categoryMatch = userProfile.preferences.categories.includes(serviceProfile.features.category) ? 1 : 0;
      score += categoryMatch * 0.4;

      // Price preference match
      const priceMatch = this.calculatePriceMatch(userProfile.preferences.priceRange, serviceProfile.features.price);
      score += priceMatch * 0.3;

      // Quality score (rating)
      const qualityScore = serviceProfile.features.rating / 5;
      score += qualityScore * 0.3;

      return Math.min(score, 1.0);
    } catch (error) {
      logger.error('Content-based calculation failed:', error);
      return 0.5;
    }
  }

  // Calculate popularity-based score
  private calculatePopularityScore(serviceProfile: ServiceProfile): number {
    try {
      // Normalize popularity using log scale
      const normalizedPopularity = Math.log(serviceProfile.features.popularity + 1) / Math.log(100);
      
      // Combine with performance metrics
      const performanceScore = (
        serviceProfile.performance.bookingRate * 0.5 +
        (1 - serviceProfile.performance.cancellationRate) * 0.3 +
        serviceProfile.performance.satisfaction * 0.2
      );

      return (normalizedPopularity * 0.6 + performanceScore * 0.4);
    } catch (error) {
      logger.error('Popularity calculation failed:', error);
      return 0.5;
    }
  }

  // Calculate location-based score
  private async calculateLocationScore(
    serviceProfile: ServiceProfile, 
    location: { lat: number; lng: number; radius: number }
  ): Promise<number> {
    try {
      const business = await mongoose.model('Business').findById(serviceProfile.businessId);
      if (!business || !business.latitude || !business.longitude) {
        return 0.3; // Default score if no location data
      }

      const distance = this.calculateDistance(
        location.lat, location.lng,
        business.latitude, business.longitude
      );

      // Score decreases with distance
      const score = Math.max(0, 1 - (distance / location.radius));
      return score;
    } catch (error) {
      logger.error('Location score calculation failed:', error);
      return 0.5;
    }
  }

  // AI-enhanced scoring using Gemini
  private async calculateAIScore(userProfile: UserProfile, serviceProfile: ServiceProfile): Promise<number> {
    try {
      if (!this.ai) return 0.5;

      const model = this.ai.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `
        Analyze the compatibility between this user and service for a recommendation system.
        
        User Profile:
        - Categories: ${userProfile.preferences.categories.join(', ')}
        - Price Range: $${userProfile.preferences.priceRange.min}-${userProfile.preferences.priceRange.max}
        - Booking Frequency: ${userProfile.behaviorMetrics.bookingFrequency}
        - Average Spent: $${userProfile.behaviorMetrics.averageSpent}
        
        Service Profile:
        - Category: ${serviceProfile.features.category}
        - Price: $${serviceProfile.features.price}
        - Rating: ${serviceProfile.features.rating}/5
        - Keywords: ${serviceProfile.features.keywords.join(', ')}
        
        Return only a compatibility score between 0 and 1 (e.g., 0.75).
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();
      const score = parseFloat(response);

      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch (error) {
      logger.error('AI score calculation failed:', error);
      return 0.5;
    }
  }

  // Generate business intelligence insights
  async generateBusinessIntelligence(businessId: string): Promise<BusinessIntelligence> {
    try {
      const services = await mongoose.model('Service').find({ businessId });
      const bookings = await mongoose.model('Booking').find({ businessId }).populate('serviceId customerId');
      
      // Demand prediction analysis
      const demandPrediction = await this.predictDemand(businessId, bookings);
      
      // Price optimization recommendations
      const priceOptimization = await this.analyzePriceOptimization(businessId, services, bookings);
      
      // Inventory recommendations
      const inventoryRecommendations = await this.generateInventoryRecommendations(businessId, services, bookings);
      
      // Marketing target identification
      const marketingTargets = await this.identifyMarketingTargets(businessId);
      
      // Competitive analysis
      const competitiveAnalysis = await this.performCompetitiveAnalysis(businessId);

      const intelligence: BusinessIntelligence = {
        businessId,
        insights: {
          demandPrediction,
          priceOptimization,
          inventoryRecommendations,
          marketingTargets
        },
        competitiveAnalysis
      };

      // Cache insights
      await cacheService.setex(`business_intelligence:${businessId}`, 3600, JSON.stringify(intelligence));

      return intelligence;
    } catch (error) {
      logger.error('Failed to generate business intelligence:', error);
      throw error;
    }
  }

  // Search intent analysis using NLP
  async analyzeSearchIntent(query: string): Promise<{
    intent: string;
    entities: any[];
    category?: string;
    confidence: number;
  }> {
    try {
      const result = await this.nlp.process('en', query);
      
      return {
        intent: result.intent,
        entities: result.entities,
        category: result.intent?.startsWith('category_') ? result.intent.replace('category_', '') : undefined,
        confidence: result.score || 0
      };
    } catch (error) {
      logger.error('Search intent analysis failed:', error);
      return {
        intent: 'unknown',
        entities: [],
        confidence: 0
      };
    }
  }

  // Helper methods
  private analyzeTimePreferences(bookings: any[]): string[] {
    const timeSlots = bookings
      .map(b => new Date(b.scheduledFor).getHours())
      .reduce((acc, hour) => {
        const slot = this.getTimeSlot(hour);
        acc[slot] = (acc[slot] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(timeSlots)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([slot]) => slot);
  }

  private analyzeSeasonalPatterns(bookings: any[]): Record<string, number> {
    const seasons = bookings.reduce((acc, booking) => {
      const month = new Date(booking.scheduledFor).getMonth();
      const season = this.getSeason(month);
      acc[season] = (acc[season] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return seasons;
  }

  private async extractServiceKeywords(service: any, reviews: any[]): Promise<string[]> {
    try {
      const text = [
        service.name,
        service.description,
        ...reviews.map(r => r.comment)
      ].filter(Boolean).join(' ');

      // Use NLP to extract key phrases
      const result = await this.nlp.process('en', text);
      return result.entities?.map((e: any) => e.sourceText) || [];
    } catch (error) {
      return [];
    }
  }

  private async getCandidateServices(
    userProfile: UserProfile, 
    options: any
  ): Promise<ServiceProfile[]> {
    // Filter services based on user preferences and options
    const candidates = Array.from(this.serviceProfiles.values()).filter(service => {
      // Category filter
      if (options.categories?.length && !options.categories.includes(service.features.category)) {
        return false;
      }

      // Price filter
      if (options.priceRange) {
        if (service.features.price < options.priceRange.min || service.features.price > options.priceRange.max) {
          return false;
        }
      }

      return true;
    });

    return candidates.slice(0, 100); // Limit candidates for performance
  }

  private calculatePriceMatch(userPriceRange: { min: number; max: number }, servicePrice: number): number {
    if (servicePrice >= userPriceRange.min && servicePrice <= userPriceRange.max) {
      return 1.0;
    }
    
    const rangeMidpoint = (userPriceRange.min + userPriceRange.max) / 2;
    const distance = Math.abs(servicePrice - rangeMidpoint);
    const rangeSize = userPriceRange.max - userPriceRange.min;
    
    return Math.max(0, 1 - (distance / rangeSize));
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getTimeSlot(hour: number): string {
    if (hour < 6) return 'early_morning';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private getSeason(month: number): string {
    if (month < 3 || month === 11) return 'winter';
    if (month < 6) return 'spring';
    if (month < 9) return 'summer';
    return 'fall';
  }

  private generateRecommendationReason(
    userProfile: UserProfile,
    serviceProfile: ServiceProfile,
    scores: Record<string, number>
  ): string {
    const reasons = [];

    if (scores.cb > 0.7) {
      reasons.push(`Matches your ${serviceProfile.features.category} preferences`);
    }

    if (scores.cf > 0.7) {
      reasons.push('Popular with similar users');
    }

    if (scores.popularity > 0.8) {
      reasons.push(`Highly rated (${serviceProfile.features.rating.toFixed(1)}/5)`);
    }

    if (scores.location > 0.8) {
      reasons.push('Conveniently located near you');
    }

    return reasons.join(', ') || 'Good match for your profile';
  }

  private async buildInteractionMatrix(): Promise<void> {
    // Implementation for building user-item interaction matrix
    // This would be more complex in a real implementation
    logger.info('Building interaction matrix...');
  }

  private async findSimilarUsers(userId: string): Promise<[string, number][]> {
    // Implementation for finding similar users
    // Returns array of [userId, similarity] pairs
    return [];
  }

  private async getUserServiceRating(userId: string, serviceId: string): Promise<number> {
    // Get user's rating for a service (explicit or implicit)
    const review = await mongoose.model('Review').findOne({ customerId: userId, serviceId });
    return review ? review.rating / 5 : 0;
  }

  private async predictDemand(businessId: string, bookings: any[]): Promise<Record<string, number>> {
    // Demand prediction implementation
    return {};
  }

  private async analyzePriceOptimization(businessId: string, services: any[], bookings: any[]): Promise<Record<string, number>> {
    // Price optimization implementation
    return {};
  }

  private async generateInventoryRecommendations(businessId: string, services: any[], bookings: any[]): Promise<string[]> {
    // Inventory recommendations implementation
    return [];
  }

  private async identifyMarketingTargets(businessId: string): Promise<UserProfile[]> {
    // Marketing target identification implementation
    return [];
  }

  private async performCompetitiveAnalysis(businessId: string): Promise<any> {
    // Competitive analysis implementation
    return {
      position: 1,
      strengths: [],
      opportunities: [],
      threats: []
    };
  }

  private async cacheProfiles(): Promise<void> {
    try {
      await Promise.all([
        cacheService.setex('user_profiles', 3600, JSON.stringify(Array.from(this.userProfiles.entries()))),
        cacheService.setex('service_profiles', 3600, JSON.stringify(Array.from(this.serviceProfiles.entries())))
      ]);
    } catch (error) {
      logger.error('Failed to cache profiles:', error);
    }
  }

  // Public method to check if service is configured
  isConfigured(): { nlp: boolean; sentiment: boolean; ai: boolean; database: boolean } {
    return {
      nlp: !!this.nlp,
      sentiment: !!this.sentimentAnalyzer,
      ai: !!this.ai,
      database: true // Assuming mongoose is connected
    };
  }

  // Get recommendation engine statistics
  async getStats(): Promise<{
    userProfiles: number;
    serviceProfiles: number;
    recommendations: { generated: number; cached: number };
    performance: { avgResponseTime: number };
  }> {
    return {
      userProfiles: this.userProfiles.size,
      serviceProfiles: this.serviceProfiles.size,
      recommendations: {
        generated: 0, // Would track in production
        cached: 0
      },
      performance: {
        avgResponseTime: 0 // Would track in production
      }
    };
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();