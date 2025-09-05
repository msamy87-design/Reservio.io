# A/B Testing Infrastructure

This document describes the comprehensive A/B testing system implemented for Reservio to enable data-driven optimization and component-level testing.

## Overview

The A/B testing infrastructure provides:
- **Component-Level Testing**: Test different versions of UI components
- **Statistical Significance**: Proper statistical analysis with confidence intervals
- **User Segmentation**: Target tests to specific user groups
- **Real-time Analytics**: Track conversion rates and key metrics
- **Graceful Degradation**: Fallback to default variants when needed
- **Performance Monitoring**: Track A/B test performance impact
- **React Integration**: Seamless hooks and components for frontend

## Architecture

### Backend Services

#### ABTestService (`abTestService.ts`)
Core A/B testing functionality:
- Test management (create, update, delete)
- User assignment with consistent hashing
- Event tracking and analytics
- Statistical analysis and reporting
- Target audience segmentation

#### ABTestMiddleware (`abTestMiddleware.ts`)
Express middleware for A/B testing:
- Automatic user assignment
- Request context extraction
- Event tracking integration
- API endpoints for test management

### Frontend Integration

#### React Hooks (`useABTest.ts`)
- `useABTest()`: Main hook for A/B testing
- `useABTestVariant()`: Get specific test variant
- `useABTestComponent()`: Component-level testing
- `ABTestProvider`: Context provider for tests

#### React Components (`ABTestComponents.tsx`)
Pre-built components for common A/B test scenarios:
- `ABTestWrapper`: Generic test wrapper
- `ABTestButton`: Button variant testing
- `ABTestHeader`: Header/title testing
- `ABTestPricing`: Pricing display testing
- `ABTestSearchResults`: Search result layout testing

## Configuration

### Test Definition Structure

```typescript
interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABVariant[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  allocation: Record<string, number>; // variant percentages
  targeting?: ABTargeting;
  startDate?: Date;
  endDate?: Date;
  sampleSize?: number;
  confidenceLevel?: number;
}

interface ABVariant {
  id: string;
  name: string;
  description: string;
  config: Record<string, any>;
  isControl?: boolean;
}
```

### Targeting Options

```typescript
interface ABTargeting {
  userTypes?: ('customer' | 'business_owner' | 'staff' | 'guest')[];
  countries?: string[];
  cities?: string[];
  deviceTypes?: ('desktop' | 'mobile' | 'tablet')[];
  platforms?: ('web' | 'ios' | 'android')[];
  customAttributes?: Record<string, any>;
  percentage?: number; // percentage of eligible users
}
```

## Usage Examples

### Creating A/B Tests

#### 1. Backend Test Creation

```typescript
import { abTestService } from '../services/abTestService';

// Create a button color test
const buttonTest = await abTestService.createTest({
  name: 'CTA Button Color Test',
  description: 'Test different button colors for conversion optimization',
  variants: [
    {
      id: 'control',
      name: 'Blue Button (Control)',
      description: 'Current blue button',
      config: { color: 'blue', text: 'Book Now' },
      isControl: true
    },
    {
      id: 'red',
      name: 'Red Button',
      description: 'Red button variant',
      config: { color: 'red', text: 'Book Now' }
    },
    {
      id: 'green',
      name: 'Green Button',
      description: 'Green button variant',
      config: { color: 'green', text: 'Reserve Now' }
    }
  ],
  allocation: { control: 40, red: 30, green: 30 },
  status: 'active',
  targeting: {
    userTypes: ['customer', 'guest'],
    deviceTypes: ['desktop', 'mobile']
  }
});
```

#### 2. Frontend React Usage

```tsx
import { ABTestProvider, useABTest, ABTestButton } from './hooks/useABTest';

// App-level provider
function App() {
  return (
    <ABTestProvider apiBaseUrl="/api/ab" enableAutoTracking={true}>
      <BookingPage />
    </ABTestProvider>
  );
}

// Component using A/B test
function BookingPage() {
  const handleBooking = () => {
    // Handle booking logic
    console.log('Booking clicked');
  };

  return (
    <div>
      <h1>Book Your Appointment</h1>
      
      <ABTestButton
        testId="cta-button-test"
        variants={{
          control: { text: 'Book Now', color: 'blue', size: 'md', variant: 'primary' },
          red: { text: 'Book Now', color: 'red', size: 'md', variant: 'primary' },
          green: { text: 'Reserve Now', color: 'green', size: 'md', variant: 'primary' }
        }}
        defaultVariant="control"
        onClick={handleBooking}
      />
    </div>
  );
}
```

#### 3. Manual Hook Usage

```tsx
function CustomComponent() {
  const { variant, trackEvent, isLoading } = useABTest('my-test-id');
  
  const handleClick = () => {
    trackEvent('click', { button: 'custom' });
  };
  
  const handleConversion = () => {
    trackEvent('conversion', { value: 49.99 });
  };
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {variant === 'new_design' ? (
        <NewDesignComponent onClick={handleClick} />
      ) : (
        <OldDesignComponent onClick={handleClick} />
      )}
      <button onClick={handleConversion}>Complete Purchase</button>
    </div>
  );
}
```

### Advanced Component Testing

#### Header Variants Test

```tsx
<ABTestHeader
  testId="homepage-header-test"
  variants={{
    control: {
      title: 'Find Your Perfect Beauty Service',
      subtitle: 'Book appointments with top-rated professionals',
      titleColor: '#1f2937',
      size: 'lg',
      alignment: 'center',
      showSubtitle: true
    },
    urgent: {
      title: 'Book Now - Limited Availability!',
      subtitle: 'Secure your spot with premium beauty experts',
      titleColor: '#dc2626',
      size: 'xl',
      alignment: 'center',
      showSubtitle: true
    },
    minimal: {
      title: 'Beauty Services',
      titleColor: '#374151',
      size: 'md',
      alignment: 'left',
      showSubtitle: false
    }
  }}
  defaultVariant="control"
/>
```

#### Pricing Display Test

```tsx
<ABTestPricing
  testId="service-pricing-test"
  variants={{
    standard: {
      layout: 'vertical',
      showDiscount: true,
      highlightSavings: false,
      priceColor: '#059669',
      ctaText: 'Book Appointment',
      showFeatures: true
    },
    urgent: {
      layout: 'horizontal',
      showDiscount: true,
      highlightSavings: true,
      priceColor: '#dc2626',
      ctaText: 'Book Now - Save 20%!',
      showFeatures: true
    },
    minimal: {
      layout: 'vertical',
      showDiscount: false,
      highlightSavings: false,
      priceColor: '#1f2937',
      ctaText: 'Reserve',
      showFeatures: false
    }
  }}
  price={79.99}
  originalPrice={99.99}
  features={['60-minute session', 'Professional stylist', 'Premium products']}
  onCTAClick={() => console.log('CTA clicked')}
/>
```

## API Endpoints

### Test Management

```http
# Create test
POST /api/ab/tests
Content-Type: application/json

{
  "name": "Search Results Layout Test",
  "description": "Test grid vs list layout for search results",
  "variants": [...],
  "allocation": { "grid": 50, "list": 50 },
  "status": "active"
}

# Get all tests
GET /api/ab/tests

# Get specific test
GET /api/ab/tests/:testId

# Update test
PUT /api/ab/tests/:testId

# Delete test
DELETE /api/ab/tests/:testId
```

### Analytics and Tracking

```http
# Get test results
GET /api/ab/tests/:testId/results

# Track custom event
POST /api/ab/tests/:testId/events
Content-Type: application/json

{
  "eventType": "conversion",
  "eventData": { "value": 49.99, "category": "booking" }
}

# Get user's assignments
GET /api/ab/my/tests

# Get dashboard data
GET /api/ab/dashboard
```

## Event Tracking

### Automatic Events
- `page_view`: Tracked automatically for assigned users
- `view`: Component render tracking
- `click`: Button/link clicks

### Custom Events
```typescript
// Track conversion
await trackEvent('conversion', { 
  value: 49.99, 
  currency: 'USD',
  category: 'booking'
});

// Track engagement
await trackEvent('scroll_depth', { 
  percentage: 75,
  section: 'pricing'
});

// Track user journey
await trackEvent('step_completed', { 
  step: 'service_selection',
  duration: 45000
});
```

## Statistical Analysis

### Metrics Calculated
- **Conversion Rate**: Events / Total Users
- **Confidence Interval**: Statistical range for conversion rate
- **Statistical Significance**: P-value for result reliability
- **Sample Size**: Number of users in each variant

### Result Interpretation
```typescript
interface ABTestResult {
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
```

## Best Practices

### Test Design
1. **Clear Hypothesis**: Define what you're testing and why
2. **Single Variable**: Test one change at a time
3. **Adequate Sample Size**: Ensure statistical power
4. **Runtime**: Run tests for full business cycles
5. **Success Metrics**: Define clear conversion goals

### Implementation
1. **Fallback Handling**: Always provide default variants
2. **Performance**: Minimize A/B test overhead
3. **User Experience**: Avoid variant switching mid-session
4. **Mobile Responsive**: Test across all devices
5. **Accessibility**: Ensure all variants are accessible

### Analysis
1. **Statistical Significance**: Wait for 95%+ confidence
2. **Practical Significance**: Consider business impact
3. **Segment Analysis**: Look at results by user type
4. **External Factors**: Account for seasonality/events
5. **Learning Documentation**: Record insights for future tests

## Performance Considerations

### Frontend Optimization
- Variants loaded asynchronously
- Cached assignments to reduce API calls  
- Minimal JavaScript bundle impact
- Progressive enhancement patterns

### Backend Optimization
- Redis caching for assignments
- Efficient user hashing algorithms
- Batched event processing
- Database query optimization

### Monitoring
- Track A/B test middleware performance
- Monitor cache hit rates
- Alert on assignment failures
- Dashboard for test health

## Testing and Validation

### Unit Tests
```typescript
describe('ABTestService', () => {
  it('should assign users consistently', async () => {
    const assignment1 = await abTestService.assignUser('test-id', 'user-123');
    const assignment2 = await abTestService.assignUser('test-id', 'user-123');
    expect(assignment1?.variantId).toBe(assignment2?.variantId);
  });
  
  it('should respect allocation percentages', async () => {
    // Test with 1000 users to verify distribution
  });
});
```

### Integration Tests
```typescript
describe('A/B Testing API', () => {
  it('should create and retrieve tests', async () => {
    const test = await request(app)
      .post('/api/ab/tests')
      .send(testData);
    
    expect(test.status).toBe(200);
    expect(test.body.id).toBeDefined();
  });
});
```

### Frontend Tests
```typescript
describe('useABTest hook', () => {
  it('should provide variant and tracking functions', () => {
    const { result } = renderHook(() => useABTest('test-id'));
    
    expect(result.current.variant).toBeDefined();
    expect(result.current.trackEvent).toBeDefined();
  });
});
```

## Security Considerations

### Data Privacy
- User IDs are hashed in logs
- No PII stored in test events
- GDPR compliance for EU users
- Opt-out mechanisms available

### Access Control
- Admin-only test creation/management
- Rate limiting on event endpoints
- Input validation and sanitization
- SQL injection prevention

## Deployment and Operations

### Environment Configuration
```bash
# Optional - A/B testing works without additional config
AB_TEST_CACHE_TTL=3600
AB_TEST_AUTO_TRACK=true
AB_TEST_DEBUG=false
```

### Monitoring and Alerts
- Test performance metrics in New Relic
- Cache performance monitoring
- Assignment success rates
- Conversion tracking accuracy

### Rollout Strategy
1. **Staging Testing**: Validate A/B tests in staging
2. **Gradual Rollout**: Start with small traffic percentages
3. **Monitor Performance**: Watch for performance impact
4. **Scale Up**: Increase traffic as confidence grows
5. **Analysis**: Regular result reviews and optimizations

## Troubleshooting

### Common Issues

1. **Users Not Assigned to Tests**
   - Check test status (must be 'active')
   - Verify targeting criteria
   - Check user context extraction

2. **Inconsistent Assignments**
   - Ensure user ID consistency across sessions
   - Check cache configuration
   - Verify hashing algorithm

3. **Events Not Tracking**
   - Verify API endpoint connectivity
   - Check event payload format
   - Review middleware configuration

4. **Performance Issues**
   - Monitor cache hit rates
   - Check assignment query performance
   - Review middleware overhead

### Debug Tools
```typescript
// Enable debug mode
const abTest = useABTest('test-id');
console.log('A/B Test Debug:', {
  variant: abTest.variant,
  assignments: abTest.assignments,
  isLoading: abTest.isLoading,
  error: abTest.error
});

// Check test status
const testStatus = await abTestService.getTest('test-id');
console.log('Test Status:', testStatus);
```

## Future Enhancements

### Planned Features
1. **Multi-armed Bandit**: Dynamic allocation based on performance
2. **Bayesian Analysis**: More sophisticated statistical methods
3. **Holdout Groups**: Control groups for long-term impact analysis
4. **Cross-platform Sync**: Consistent tests across web/mobile
5. **AI-powered Optimization**: Automated variant generation

### Integration Opportunities
1. **Analytics Platforms**: Google Analytics, Mixpanel integration
2. **Feature Flags**: Integration with feature flag systems
3. **Personalization**: User-specific variant selection
4. **ML Models**: Predictive assignment optimization
5. **Revenue Attribution**: Enhanced business impact tracking