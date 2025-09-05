import { abTestService, ABTest, ABVariant } from '../services/abTestService';
import { cacheService } from '../services/cacheService';

// Mock cache service
jest.mock('../services/cacheService', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    invalidateByTags: jest.fn(),
    getStats: jest.fn(() => Promise.resolve({}))
  }
}));

// Mock performance monitoring
jest.mock('../services/performanceMonitoringService', () => ({
  performanceMonitoring: {
    trackCustomEvent: jest.fn(),
    trackError: jest.fn()
  }
}));

describe('ABTestService', () => {
  let testService: typeof abTestService;

  beforeEach(() => {
    // Clear all tests before each test
    testService = abTestService;
    (testService as any).tests.clear();
    (testService as any).assignments.clear();
    (testService as any).events = [];
    
    // Reset mocks
    jest.clearAllMocks();
  });

  const createSampleTest = (): Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'> => ({
    name: 'Button Color Test',
    description: 'Test different button colors',
    variants: [
      {
        id: 'control',
        name: 'Blue Button',
        description: 'Current blue button',
        config: { color: 'blue' },
        isControl: true
      },
      {
        id: 'variant',
        name: 'Red Button', 
        description: 'New red button',
        config: { color: 'red' }
      }
    ],
    status: 'draft' as const,
    allocation: { control: 50, variant: 50 }
  });

  describe('Test Management', () => {
    it('should create a new test', async () => {
      const testData = createSampleTest();
      const test = await testService.createTest(testData);

      expect(test.id).toBeDefined();
      expect(test.name).toBe(testData.name);
      expect(test.variants).toHaveLength(2);
      expect(test.createdAt).toBeDefined();
      expect(test.updatedAt).toBeDefined();
    });

    it('should validate allocation percentages sum to 100', async () => {
      const testData = createSampleTest();
      testData.allocation = { control: 30, variant: 40 }; // Only sums to 70

      await expect(testService.createTest(testData)).rejects.toThrow(
        'Variant allocations must sum to 100%'
      );
    });

    it('should validate variants exist for allocation', async () => {
      const testData = createSampleTest();
      testData.allocation = { control: 50, nonexistent: 50 };

      await expect(testService.createTest(testData)).rejects.toThrow(
        'Variant nonexistent not found in test definition'
      );
    });

    it('should retrieve a test by ID', async () => {
      const testData = createSampleTest();
      const createdTest = await testService.createTest(testData);
      const retrievedTest = testService.getTest(createdTest.id);

      expect(retrievedTest).toEqual(createdTest);
    });

    it('should return null for non-existent test', () => {
      const test = testService.getTest('non-existent-id');
      expect(test).toBeNull();
    });

    it('should update a test', async () => {
      const testData = createSampleTest();
      const createdTest = await testService.createTest(testData);
      
      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updatedTest = await testService.updateTest(createdTest.id, {
        name: 'Updated Button Test',
        status: 'active'
      });

      expect(updatedTest.name).toBe('Updated Button Test');
      expect(updatedTest.status).toBe('active');
      expect(updatedTest.updatedAt.getTime()).toBeGreaterThan(createdTest.updatedAt.getTime());
    });

    it('should prevent modifying active test variants', async () => {
      const testData = createSampleTest();
      testData.status = 'active';
      const createdTest = await testService.createTest(testData);

      await expect(
        testService.updateTest(createdTest.id, {
          variants: [...testData.variants]
        })
      ).rejects.toThrow('Cannot modify variants or allocation of active test');
    });

    it('should delete a test', async () => {
      const testData = createSampleTest();
      const createdTest = await testService.createTest(testData);

      await testService.deleteTest(createdTest.id);
      const retrievedTest = testService.getTest(createdTest.id);

      expect(retrievedTest).toBeNull();
    });

    it('should not delete active test', async () => {
      const testData = createSampleTest();
      testData.status = 'active';
      const createdTest = await testService.createTest(testData);

      await expect(testService.deleteTest(createdTest.id)).rejects.toThrow(
        'Cannot delete active test. Pause it first.'
      );
    });
  });

  describe('User Assignment', () => {
    let activeTest: ABTest;

    beforeEach(async () => {
      const testData = createSampleTest();
      testData.status = 'active';
      activeTest = await testService.createTest(testData);
    });

    it('should assign user to a variant', async () => {
      const assignment = await testService.assignUser(activeTest.id, 'user-123');

      expect(assignment).toBeDefined();
      expect(assignment?.testId).toBe(activeTest.id);
      expect(assignment?.userId).toBe('user-123');
      expect(['control', 'variant']).toContain(assignment?.variantId);
      expect(assignment?.assignedAt).toBeDefined();
    });

    it('should return consistent assignments for same user', async () => {
      const assignment1 = await testService.assignUser(activeTest.id, 'user-123');
      const assignment2 = await testService.assignUser(activeTest.id, 'user-123');

      expect(assignment1?.variantId).toBe(assignment2?.variantId);
    });

    it('should not assign user to inactive test', async () => {
      await testService.updateTest(activeTest.id, { status: 'paused' });
      const assignment = await testService.assignUser(activeTest.id, 'user-123');

      expect(assignment).toBeNull();
    });

    it('should respect targeting criteria', async () => {
      const testWithTargeting = await testService.createTest({
        ...createSampleTest(),
        status: 'active',
        targeting: {
          userTypes: ['customer'],
          countries: ['US']
        }
      });

      // Should assign when criteria match
      const assignment1 = await testService.assignUser(
        testWithTargeting.id,
        'user-123',
        { userType: 'customer', country: 'US' }
      );
      expect(assignment1).toBeDefined();

      // Should not assign when criteria don't match
      const assignment2 = await testService.assignUser(
        testWithTargeting.id,
        'user-456', 
        { userType: 'guest', country: 'UK' }
      );
      expect(assignment2).toBeNull();
    });

    it('should distribute users according to allocation', async () => {
      const assignments: { [key: string]: number } = { control: 0, variant: 0 };
      const numUsers = 1000;

      // Assign many users to test distribution
      for (let i = 0; i < numUsers; i++) {
        const assignment = await testService.assignUser(activeTest.id, `user-${i}`);
        if (assignment) {
          assignments[assignment.variantId]++;
        }
      }

      // Should be roughly 50/50 split (allowing for some variance)
      const controlPercent = (assignments.control / numUsers) * 100;
      const variantPercent = (assignments.variant / numUsers) * 100;

      expect(controlPercent).toBeGreaterThan(45);
      expect(controlPercent).toBeLessThan(55);
      expect(variantPercent).toBeGreaterThan(45);
      expect(variantPercent).toBeLessThan(55);
    });

    it('should get user assignment', async () => {
      await testService.assignUser(activeTest.id, 'user-123');
      const assignment = await testService.getUserAssignment(activeTest.id, 'user-123');

      expect(assignment).toBeDefined();
      expect(assignment?.userId).toBe('user-123');
    });

    it('should get all user assignments', async () => {
      const test2 = await testService.createTest({
        ...createSampleTest(),
        name: 'Test 2',
        status: 'active'
      });

      await testService.assignUser(activeTest.id, 'user-123');
      await testService.assignUser(test2.id, 'user-123');

      const assignments = await testService.getUserAssignments('user-123');
      expect(assignments).toHaveLength(2);
    });
  });

  describe('Event Tracking', () => {
    let activeTest: ABTest;
    let assignment: any;

    beforeEach(async () => {
      const testData = createSampleTest();
      testData.status = 'active';
      activeTest = await testService.createTest(testData);
      assignment = await testService.assignUser(activeTest.id, 'user-123');
    });

    it('should track events', async () => {
      await testService.trackEvent(
        activeTest.id,
        assignment.variantId,
        'user-123',
        'click',
        { button: 'cta' }
      );

      const events = (testService as any).events;
      expect(events).toHaveLength(1);
      expect(events[0].testId).toBe(activeTest.id);
      expect(events[0].eventType).toBe('click');
      expect(events[0].eventData).toEqual({ button: 'cta' });
    });

    it('should generate unique event IDs', async () => {
      await testService.trackEvent(activeTest.id, assignment.variantId, 'user-123', 'click');
      await testService.trackEvent(activeTest.id, assignment.variantId, 'user-123', 'view');

      const events = (testService as any).events;
      expect(events[0].id).toBeDefined();
      expect(events[1].id).toBeDefined();
      expect(events[0].id).not.toBe(events[1].id);
    });
  });

  describe('Analytics and Reporting', () => {
    let activeTest: ABTest;

    beforeEach(async () => {
      const testData = createSampleTest();
      testData.status = 'active';
      activeTest = await testService.createTest(testData);

      // Create some assignments and events for testing
      await testService.assignUser(activeTest.id, 'user-1');
      await testService.assignUser(activeTest.id, 'user-2');
      await testService.assignUser(activeTest.id, 'user-3');
      await testService.assignUser(activeTest.id, 'user-4');

      // Track some conversion events
      const assignment1 = await testService.getUserAssignment(activeTest.id, 'user-1');
      const assignment2 = await testService.getUserAssignment(activeTest.id, 'user-2');
      
      if (assignment1) {
        await testService.trackEvent(activeTest.id, assignment1.variantId, 'user-1', 'conversion');
      }
      if (assignment2) {
        await testService.trackEvent(activeTest.id, assignment2.variantId, 'user-2', 'view');
      }
    });

    it('should generate test results', async () => {
      const results = await testService.getTestResults(activeTest.id);

      expect(results).toHaveLength(2); // Control and variant
      expect(results[0].testId).toBe(activeTest.id);
      expect(results[0].totalUsers).toBeGreaterThan(0);
      expect(results[0].conversionRate).toBeGreaterThanOrEqual(0);
      expect(results[0].metrics).toBeDefined();
    });

    it('should calculate confidence intervals', async () => {
      const results = await testService.getTestResults(activeTest.id);

      for (const result of results) {
        expect(result.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
        expect(result.confidenceInterval.upper).toBeLessThanOrEqual(1);
        expect(result.confidenceInterval.lower).toBeLessThanOrEqual(result.confidenceInterval.upper);
      }
    });

    it('should identify winner when applicable', async () => {
      const results = await testService.getTestResults(activeTest.id);
      const winners = results.filter(r => r.isWinner);

      expect(winners.length).toBeLessThanOrEqual(1); // At most one winner
    });

    it('should generate test summary', async () => {
      const summary = await testService.getTestSummary();

      expect(summary.totalTests).toBeGreaterThan(0);
      expect(summary.activeTests).toBeGreaterThanOrEqual(0);
      expect(summary.totalAssignments).toBeGreaterThanOrEqual(0);
      expect(summary.totalEvents).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Component Integration', () => {
    let activeTest: ABTest;

    beforeEach(async () => {
      const testData = createSampleTest();
      testData.status = 'active';
      activeTest = await testService.createTest(testData);
    });

    it('should get variant config', async () => {
      await testService.assignUser(activeTest.id, 'user-123');
      const config = await testService.getVariantConfig(activeTest.id, 'user-123');

      expect(config).toBeDefined();
      expect(config?.color).toMatch(/^(blue|red)$/);
    });

    it('should determine which variant to show', async () => {
      const variantId = await testService.shouldShowVariant(activeTest.id, 'user-123');

      expect(['control', 'variant']).toContain(variantId);
    });

    it('should return default variant when test inactive', async () => {
      await testService.updateTest(activeTest.id, { status: 'paused' });
      const variantId = await testService.shouldShowVariant(activeTest.id, 'user-123', 'default');

      expect(variantId).toBe('default');
    });
  });

  describe('Targeting Logic', () => {
    it('should match user types', () => {
      const targeting = { userTypes: ['customer', 'business_owner'] };
      const context = { userType: 'customer' };
      
      const matches = (testService as any).matchesTargeting(targeting, context);
      expect(matches).toBe(true);
    });

    it('should reject non-matching user types', () => {
      const targeting = { userTypes: ['customer'] };
      const context = { userType: 'guest' };
      
      const matches = (testService as any).matchesTargeting(targeting, context);
      expect(matches).toBe(false);
    });

    it('should handle percentage targeting', () => {
      const targeting = { percentage: 50 };
      
      // Test with multiple users to verify percentage logic
      let matches = 0;
      for (let i = 0; i < 100; i++) {
        const context = { userId: `user-${i}` };
        if ((testService as any).matchesTargeting(targeting, context)) {
          matches++;
        }
      }
      
      // Should be roughly 50% (allowing for variance)
      expect(matches).toBeGreaterThan(30);
      expect(matches).toBeLessThan(70);
    });
  });

  describe('Utility Functions', () => {
    it('should generate consistent hashes for same input', () => {
      const hash1 = (testService as any).hashString('test-input');
      const hash2 = (testService as any).hashString('test-input');
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = (testService as any).hashString('input-1');
      const hash2 = (testService as any).hashString('input-2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate unique IDs', () => {
      const id1 = (testService as any).generateId();
      const id2 = (testService as any).generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should hash user IDs for privacy', () => {
      const hashedId = (testService as any).hashUserId('user-12345');
      
      expect(hashedId).toBeDefined();
      expect(hashedId).not.toContain('user');
      expect(hashedId).not.toContain('12345');
    });
  });
});