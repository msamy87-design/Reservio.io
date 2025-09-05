import { cacheService } from './cacheService';
import { performanceMonitoring } from './performanceMonitoringService';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABVariant[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  allocation: Record<string, number>; // variant_id -> percentage (should sum to 100)
  targeting?: ABTargeting;
  startDate?: Date;
  endDate?: Date;
  sampleSize?: number;
  confidenceLevel?: number; // default 95%
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  config: Record<string, any>; // component configuration
  isControl?: boolean;
}

export interface ABTargeting {
  userTypes?: ('customer' | 'business_owner' | 'staff' | 'guest')[];
  countries?: string[];
  cities?: string[];
  deviceTypes?: ('desktop' | 'mobile' | 'tablet')[];
  platforms?: ('web' | 'ios' | 'android')[];
  customAttributes?: Record<string, any>;
  percentage?: number; // percentage of eligible users
}

export interface ABAssignment {
  userId: string;
  testId: string;
  variantId: string;
  assignedAt: Date;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ABEvent {
  id: string;
  testId: string;
  variantId: string;
  userId: string;
  eventType: string;
  eventData?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  variantName: string;
  totalUsers: number;
  conversionRate: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  statisticalSignificance: number;
  isWinner?: boolean;
  metrics: Record<string, number>;
}

export class ABTestService {
  private tests = new Map<string, ABTest>();
  private assignments = new Map<string, ABAssignment[]>(); // userId -> assignments
  private events: ABEvent[] = [];

  constructor() {
    this.loadTests();
  }

  // Test Management
  async createTest(test: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ABTest> {
    const newTest: ABTest = {
      ...test,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate allocation percentages
    const totalAllocation = Object.values(newTest.allocation).reduce((sum, pct) => sum + pct, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Variant allocations must sum to 100%');
    }

    // Validate variants exist
    for (const variantId of Object.keys(newTest.allocation)) {
      if (!newTest.variants.find(v => v.id === variantId)) {
        throw new Error(`Variant ${variantId} not found in test definition`);
      }
    }

    this.tests.set(newTest.id, newTest);
    await this.saveTests();

    performanceMonitoring.trackCustomEvent('ab_test_created', {
      testId: newTest.id,
      variantCount: newTest.variants.length
    });

    return newTest;
  }

  async updateTest(testId: string, updates: Partial<ABTest>): Promise<ABTest> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    // Don't allow changes to active tests that could affect assignments
    if (test.status === 'active' && (updates.variants || updates.allocation)) {
      throw new Error('Cannot modify variants or allocation of active test');
    }

    const updatedTest = {
      ...test,
      ...updates,
      updatedAt: new Date()
    };

    this.tests.set(testId, updatedTest);
    await this.saveTests();

    return updatedTest;
  }

  async deleteTest(testId: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (test.status === 'active') {
      throw new Error('Cannot delete active test. Pause it first.');
    }

    this.tests.delete(testId);
    
    // Clean up assignments and events
    for (const [userId, userAssignments] of this.assignments.entries()) {
      const filtered = userAssignments.filter(a => a.testId !== testId);
      if (filtered.length === 0) {
        this.assignments.delete(userId);
      } else {
        this.assignments.set(userId, filtered);
      }
    }

    this.events = this.events.filter(e => e.testId !== testId);

    await this.saveTests();
  }

  getTest(testId: string): ABTest | null {
    return this.tests.get(testId) || null;
  }

  getAllTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  getActiveTests(): ABTest[] {
    return Array.from(this.tests.values()).filter(t => t.status === 'active');
  }

  // User Assignment
  async assignUser(
    testId: string,
    userId: string,
    context: {
      userType?: string;
      country?: string;
      city?: string;
      deviceType?: string;
      platform?: string;
      sessionId?: string;
      userAgent?: string;
      ipAddress?: string;
      customAttributes?: Record<string, any>;
    } = {}
  ): Promise<ABAssignment | null> {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'active') {
      return null;
    }

    // Check if user already assigned to this test
    const existingAssignment = await this.getUserAssignment(testId, userId);
    if (existingAssignment) {
      return existingAssignment;
    }

    // Check targeting criteria
    if (!this.matchesTargeting(test.targeting, context)) {
      return null;
    }

    // Determine variant using consistent hashing
    const variantId = this.assignVariant(testId, userId, test.allocation);
    
    const assignment: ABAssignment = {
      userId,
      testId,
      variantId,
      assignedAt: new Date(),
      sessionId: context.sessionId,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress
    };

    // Store assignment
    const userAssignments = this.assignments.get(userId) || [];
    userAssignments.push(assignment);
    this.assignments.set(userId, userAssignments);

    // Cache for quick access
    await cacheService.set(`ab:assignment:${testId}:${userId}`, assignment, {
      ttl: 86400, // 24 hours
      tags: ['ab_test', `test:${testId}`]
    });

    performanceMonitoring.trackCustomEvent('ab_test_assignment', {
      testId,
      variantId,
      userId: this.hashUserId(userId)
    });

    return assignment;
  }

  async getUserAssignment(testId: string, userId: string): Promise<ABAssignment | null> {
    // Try cache first
    const cached = await cacheService.get<ABAssignment>(`ab:assignment:${testId}:${userId}`);
    if (cached) {
      return cached;
    }

    // Fallback to memory
    const userAssignments = this.assignments.get(userId) || [];
    return userAssignments.find(a => a.testId === testId) || null;
  }

  async getUserAssignments(userId: string): Promise<ABAssignment[]> {
    return this.assignments.get(userId) || [];
  }

  // Event Tracking
  async trackEvent(
    testId: string,
    variantId: string,
    userId: string,
    eventType: string,
    eventData?: Record<string, any>,
    sessionId?: string
  ): Promise<void> {
    const event: ABEvent = {
      id: this.generateId(),
      testId,
      variantId,
      userId,
      eventType,
      eventData,
      timestamp: new Date(),
      sessionId
    };

    this.events.push(event);

    // Cache event for real-time analytics
    await cacheService.set(`ab:event:${event.id}`, event, {
      ttl: 3600, // 1 hour
      tags: ['ab_event', `test:${testId}`, `variant:${variantId}`]
    });

    performanceMonitoring.trackCustomEvent('ab_test_event', {
      testId,
      variantId,
      eventType,
      userId: this.hashUserId(userId)
    });
  }

  // Analytics and Reporting
  async getTestResults(testId: string): Promise<ABTestResult[]> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const results: ABTestResult[] = [];
    const testEvents = this.events.filter(e => e.testId === testId);

    for (const variant of test.variants) {
      const variantAssignments = Array.from(this.assignments.values())
        .flat()
        .filter(a => a.testId === testId && a.variantId === variant.id);

      const variantEvents = testEvents.filter(e => e.variantId === variant.id);
      const conversionEvents = variantEvents.filter(e => e.eventType === 'conversion');

      const totalUsers = variantAssignments.length;
      const conversions = conversionEvents.length;
      const conversionRate = totalUsers > 0 ? conversions / totalUsers : 0;

      // Calculate confidence interval (simplified)
      const z = 1.96; // 95% confidence level
      const se = totalUsers > 0 ? Math.sqrt((conversionRate * (1 - conversionRate)) / totalUsers) : 0;
      const margin = z * se;

      // Calculate metrics
      const metrics: Record<string, number> = {
        views: variantEvents.filter(e => e.eventType === 'view').length,
        clicks: variantEvents.filter(e => e.eventType === 'click').length,
        conversions
      };

      results.push({
        testId,
        variantId: variant.id,
        variantName: variant.name,
        totalUsers,
        conversionRate,
        confidenceInterval: {
          lower: Math.max(0, conversionRate - margin),
          upper: Math.min(1, conversionRate + margin)
        },
        statisticalSignificance: this.calculateSignificance(testId, variant.id),
        metrics
      });
    }

    // Determine winner
    if (results.length > 1) {
      const bestResult = results.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );
      bestResult.isWinner = true;
    }

    return results;
  }

  async getTestSummary(): Promise<{
    totalTests: number;
    activeTests: number;
    totalAssignments: number;
    totalEvents: number;
  }> {
    return {
      totalTests: this.tests.size,
      activeTests: this.getActiveTests().length,
      totalAssignments: Array.from(this.assignments.values()).flat().length,
      totalEvents: this.events.length
    };
  }

  // Component Integration Helpers
  getVariantConfig(testId: string, userId: string): Promise<Record<string, any> | null> {
    return this.getUserAssignment(testId, userId).then(assignment => {
      if (!assignment) return null;
      
      const test = this.tests.get(testId);
      if (!test) return null;
      
      const variant = test.variants.find(v => v.id === assignment.variantId);
      return variant?.config || null;
    });
  }

  async shouldShowVariant(testId: string, userId: string, defaultVariantId?: string): Promise<string | null> {
    const assignment = await this.getUserAssignment(testId, userId);
    if (assignment) {
      return assignment.variantId;
    }

    // Auto-assign if test is active
    const test = this.tests.get(testId);
    if (test?.status === 'active') {
      const newAssignment = await this.assignUser(testId, userId);
      return newAssignment?.variantId || defaultVariantId || null;
    }

    return defaultVariantId || null;
  }

  // Private Helper Methods
  private matchesTargeting(targeting?: ABTargeting, context: any = {}): boolean {
    if (!targeting) return true;

    // Check user type
    if (targeting.userTypes && context.userType) {
      if (!targeting.userTypes.includes(context.userType)) return false;
    }

    // Check country
    if (targeting.countries && context.country) {
      if (!targeting.countries.includes(context.country)) return false;
    }

    // Check city
    if (targeting.cities && context.city) {
      if (!targeting.cities.includes(context.city)) return false;
    }

    // Check device type
    if (targeting.deviceTypes && context.deviceType) {
      if (!targeting.deviceTypes.includes(context.deviceType)) return false;
    }

    // Check platform
    if (targeting.platforms && context.platform) {
      if (!targeting.platforms.includes(context.platform)) return false;
    }

    // Check custom attributes
    if (targeting.customAttributes && context.customAttributes) {
      for (const [key, value] of Object.entries(targeting.customAttributes)) {
        if (context.customAttributes[key] !== value) return false;
      }
    }

    // Check percentage targeting
    if (targeting.percentage && targeting.percentage < 100) {
      const hash = this.hashString(`${context.userId || 'anonymous'}_targeting`);
      const hashPercent = (hash % 100) + 1;
      if (hashPercent > targeting.percentage) return false;
    }

    return true;
  }

  private assignVariant(testId: string, userId: string, allocation: Record<string, number>): string {
    const hash = this.hashString(`${testId}_${userId}`);
    const percentage = (hash % 100) + 1; // 1-100

    let cumulativePercentage = 0;
    for (const [variantId, variantPercentage] of Object.entries(allocation)) {
      cumulativePercentage += variantPercentage;
      if (percentage <= cumulativePercentage) {
        return variantId;
      }
    }

    // Fallback to first variant
    return Object.keys(allocation)[0];
  }

  private calculateSignificance(testId: string, variantId: string): number {
    // Simplified significance calculation
    // In production, you'd want proper statistical testing
    const testEvents = this.events.filter(e => e.testId === testId);
    const variantEvents = testEvents.filter(e => e.variantId === variantId);
    
    if (variantEvents.length < 30) return 0; // Need minimum sample size
    
    return Math.min(95, (variantEvents.length / 100) * 95);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private hashUserId(userId: string): string {
    // Simple hash for privacy in logs
    return this.hashString(userId).toString(36);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async loadTests(): Promise<void> {
    try {
      // In production, load from database
      // For now, use cache for persistence
      const cached = await cacheService.get<ABTest[]>('ab:tests:all');
      if (cached) {
        cached.forEach(test => this.tests.set(test.id, test));
      }
    } catch (error) {
      console.warn('Failed to load A/B tests from cache:', error);
    }
  }

  private async saveTests(): Promise<void> {
    try {
      const allTests = Array.from(this.tests.values());
      await cacheService.set('ab:tests:all', allTests, {
        ttl: 86400 * 7, // 1 week
        tags: ['ab_tests']
      });
    } catch (error) {
      console.warn('Failed to save A/B tests to cache:', error);
    }
  }
}

export const abTestService = new ABTestService();