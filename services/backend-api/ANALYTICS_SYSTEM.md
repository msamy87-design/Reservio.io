# Advanced Analytics and User Behavior Tracking System

This document describes the comprehensive analytics and user behavior tracking system implemented for Reservio to provide detailed insights into user interactions, business performance, and conversion optimization.

## Overview

The analytics infrastructure provides:
- **User Session Tracking**: Complete user journey tracking and session management
- **Event Analytics**: Comprehensive event tracking for user interactions
- **Business Intelligence**: Revenue, conversion, and performance metrics
- **Funnel Analysis**: Step-by-step conversion tracking and optimization
- **Real-time Dashboards**: Live analytics and monitoring capabilities
- **User Behavior Patterns**: Advanced behavioral analysis and segmentation
- **Performance Monitoring**: System performance and error tracking
- **Third-party Integration**: Mixpanel integration for advanced analytics

## Architecture

### Backend Services

#### AnalyticsService (`analyticsService.ts`)
Core analytics functionality:
- Session creation and management
- Event and page view tracking
- User behavior pattern analysis
- Business metrics generation
- Funnel analysis capabilities
- Real-time dashboard data
- Mixpanel integration
- MongoDB and Redis integration for data storage and caching

#### AnalyticsMiddleware (`analyticsMiddleware.ts`)
Express middleware for analytics integration:
- Automatic session tracking
- Request-level analytics helpers
- API endpoints for analytics data
- Specialized tracking for bookings, payments, and registrations
- Admin panel for analytics management

### Frontend Integration

#### React Hooks (`useAnalytics.ts`)
- `useAnalytics()`: Main hook for analytics management
- `usePageTracking()`: Automatic page view tracking
- `useFormTracking()`: Form interaction tracking
- `useInteractionTracking()`: Button clicks and user interactions
- `useEcommerceTracking()`: E-commerce and transaction tracking
- `useBookingTracking()`: Booking-specific analytics
- `usePerformanceTracking()`: Performance monitoring and error tracking

#### React Components (`AnalyticsComponents.tsx`)
Pre-built components for analytics features:
- `AnalyticsDashboard`: Main analytics dashboard with overview metrics
- `BusinessMetricsDashboard`: Business-specific metrics and KPIs
- `FunnelAnalysis`: Conversion funnel visualization and analysis
- `AnalyticsEventTracker`: Development tool for testing analytics

## Configuration

### Environment Variables

```bash
# Mixpanel Integration (Optional)
MIXPANEL_PROJECT_TOKEN=your_mixpanel_project_token_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/reservio
REDIS_URL=redis://localhost:6379

# Analytics Settings (Optional)
ANALYTICS_BATCH_SIZE=100
ANALYTICS_FLUSH_INTERVAL=10000
ANALYTICS_RETENTION_DAYS=365
```

### Database Setup

The analytics system automatically creates the following MongoDB collections:
- `user_sessions`: User session data
- `analytics_events`: All tracked events
- `page_views`: Page view tracking
- `user_behavior_patterns`: Analyzed user behavior data
- `business_metrics`: Aggregated business metrics

## Usage Examples

### Backend Implementation

#### 1. Basic Event Tracking

```typescript
import { analyticsService } from '../services/analyticsService';

// Track a custom event
await analyticsService.trackEvent({
  userId: 'user123',
  sessionId: 'session456',
  eventName: 'button_click',
  properties: {
    buttonName: 'book_now',
    pageUrl: '/services/haircut',
    buttonPosition: 'header'
  },
  metadata: {
    userType: 'customer',
    platform: 'web',
    browser: 'chrome'
  }
});
```

#### 2. Session Management

```typescript
// Create user session
const session = await analyticsService.createSession({
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.1',
  userId: 'user123',
  referrer: 'https://google.com'
});

// Update session
await analyticsService.updateSession(session.sessionId, {
  endedAt: new Date(),
  totalEvents: 15,
  totalPageViews: 8
});
```

#### 3. Business Metrics Generation

```typescript
// Generate comprehensive business metrics
const metrics = await analyticsService.generateBusinessMetrics('business123', '30d');

console.log('Business Metrics:', {
  revenue: metrics.bookings.revenue,
  conversionRate: metrics.conversions.rate,
  customerAcquisition: metrics.customers.new,
  averageOrderValue: metrics.bookings.averageValue
});
```

#### 4. User Behavior Analysis

```typescript
// Analyze user behavior patterns
const behaviorPattern = await analyticsService.analyzeUserBehavior('user123');

console.log('User Behavior:', {
  sessionCount: behaviorPattern.totalSessions,
  averageSessionDuration: behaviorPattern.averageSessionDuration,
  mostViewedPages: behaviorPattern.topPages,
  preferredDevices: behaviorPattern.devicePreferences,
  conversionHistory: behaviorPattern.conversions
});
```

### Frontend Implementation

#### 1. App-Level Setup

```tsx
import { AnalyticsProvider } from './hooks/useAnalytics';

function App() {
  return (
    <AnalyticsProvider
      apiBaseUrl="/api/analytics"
      enableAutoTracking={true}
      enableConsoleLogging={process.env.NODE_ENV === 'development'}
    >
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/business-analytics" element={<BusinessDashboard />} />
        </Routes>
      </Router>
    </AnalyticsProvider>
  );
}
```

#### 2. Page Tracking

```tsx
import { usePageTracking, useAnalytics } from '../hooks/useAnalytics';

function HomePage() {
  const { identify } = useAnalytics();
  
  // Automatically track page view
  usePageTracking('/home', 'Home Page', {
    category: 'landing',
    loadTime: performance.now()
  });
  
  useEffect(() => {
    // Identify user when logged in
    if (user) {
      identify(user.id, {
        email: user.email,
        userType: user.role,
        registrationDate: user.createdAt
      });
    }
  }, [user]);

  return (
    <div>
      <h1>Welcome to Reservio</h1>
      {/* Page content */}
    </div>
  );
}
```

#### 3. Form Tracking

```tsx
import { useFormTracking } from '../hooks/useAnalytics';

function BookingForm() {
  const {
    trackFormStart,
    trackFormFieldInteraction,
    trackFormSubmit,
    trackFormError,
    trackFormComplete
  } = useFormTracking('booking_form');

  const handleFormStart = () => {
    trackFormStart();
  };

  const handleFieldFocus = (fieldName: string) => {
    trackFormFieldInteraction(fieldName, 'focus');
  };

  const handleSubmit = async (formData: any) => {
    try {
      trackFormSubmit();
      const result = await submitBooking(formData);
      trackFormComplete();
    } catch (error) {
      trackFormError(error.message, 'submit');
    }
  };

  return (
    <form onSubmit={handleSubmit} onFocus={handleFormStart}>
      <input
        type="text"
        onFocus={() => handleFieldFocus('service_name')}
        placeholder="Service Name"
      />
      {/* Form fields */}
    </form>
  );
}
```

#### 4. E-commerce Tracking

```tsx
import { useEcommerceTracking, useBookingTracking } from '../hooks/useAnalytics';

function BookingConfirmation({ booking }) {
  const { trackPurchase } = useEcommerceTracking();
  const { trackBookingComplete } = useBookingTracking();

  useEffect(() => {
    if (booking.status === 'confirmed') {
      // Track as e-commerce purchase
      trackPurchase(booking.id, [booking.service], booking.totalAmount, {
        paymentMethod: booking.paymentMethod,
        businessId: booking.businessId
      });

      // Track booking-specific completion
      trackBookingComplete(
        booking.id,
        booking.serviceId,
        booking.businessId,
        booking.totalAmount,
        {
          duration: booking.duration,
          appointmentDate: booking.scheduledFor
        }
      );
    }
  }, [booking]);

  return (
    <div>
      <h1>Booking Confirmed!</h1>
      {/* Confirmation details */}
    </div>
  );
}
```

#### 5. Dashboard Implementation

```tsx
import { AnalyticsDashboard, BusinessMetricsDashboard } from '../components/AnalyticsComponents';

function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('business')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'business'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Business Metrics
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'overview' && <AnalyticsDashboard />}
      {activeTab === 'business' && <BusinessMetricsDashboard businessId="current-business" />}
    </div>
  );
}
```

## API Endpoints

### Event Tracking

```http
# Track custom events
POST /api/analytics/track
Content-Type: application/json

{
  "eventName": "button_click",
  "properties": {
    "buttonName": "book_now",
    "pageUrl": "/services",
    "timestamp": 1631234567890
  }
}

# Track page views
POST /api/analytics/pageview
Content-Type: application/json

{
  "path": "/services/haircut",
  "title": "Haircut Services - Reservio",
  "properties": {
    "loadTime": 1200,
    "referrer": "https://google.com"
  }
}

# Track conversions
POST /api/analytics/conversion
Content-Type: application/json

{
  "conversionType": "booking_completed",
  "value": 85.00,
  "properties": {
    "bookingId": "booking123",
    "serviceId": "service456",
    "paymentMethod": "stripe"
  }
}
```

### Analytics Data Retrieval

```http
# Get user behavior analysis
GET /api/analytics/user-behavior/:userId

# Get business metrics (admin/business owner only)
GET /api/analytics/business-metrics/:businessId?period=30d

# Get funnel analysis (admin only)
POST /api/analytics/funnel-analysis
Content-Type: application/json

{
  "funnelName": "booking_funnel",
  "steps": ["service_viewed", "booking_started", "booking_completed"],
  "timeframe": {
    "startDate": "2023-09-01T00:00:00Z",
    "endDate": "2023-09-30T23:59:59Z"
  }
}

# Get real-time dashboard data (admin only)
GET /api/analytics/dashboard

# Get analytics configuration
GET /api/analytics/config

# Health check
GET /api/analytics/health
```

## Analytics Event Types

### User Interaction Events

1. **Page Views**
   - Triggered: On every page load
   - Data: Path, title, load time, referrer
   - Usage: Traffic analysis, content performance

2. **Button Clicks**
   - Triggered: User clicks interactive elements
   - Data: Element name, position, page context
   - Usage: UI optimization, conversion tracking

3. **Form Interactions**
   - Triggered: Form start, field focus, submit, errors
   - Data: Form name, field names, completion rates
   - Usage: Form optimization, user experience improvement

### Business Events

1. **Booking Events**
   - Started, completed, cancelled, rescheduled
   - Data: Service details, pricing, user info
   - Usage: Conversion tracking, revenue analysis

2. **Payment Events**
   - Payment initiated, completed, failed
   - Data: Amount, method, booking reference
   - Usage: Revenue tracking, payment optimization

3. **User Registration**
   - Account creation, email verification, profile completion
   - Data: Registration method, user type, referrer
   - Usage: User acquisition analysis

### Engagement Events

1. **Search Events**
   - Search queries, results, refinements
   - Data: Search terms, result count, selected results
   - Usage: Search optimization, content discovery

2. **Content Engagement**
   - Time on page, scroll depth, content interactions
   - Data: Engagement duration, scroll percentage
   - Usage: Content effectiveness, user interest

## Advanced Features

### User Segmentation

```typescript
// Create custom user segments based on behavior
const segments = await analyticsService.createUserSegments({
  highValueCustomers: {
    criteria: {
      totalBookings: { $gte: 5 },
      totalSpent: { $gte: 500 }
    }
  },
  mobileUsers: {
    criteria: {
      'sessions.platform': 'mobile'
    }
  },
  recentSignups: {
    criteria: {
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  }
});
```

### Custom Funnel Analysis

```typescript
// Define and analyze custom conversion funnels
const customFunnel = await analyticsService.analyzeFunnel('spa_booking', [
  'spa_page_viewed',
  'service_selected',
  'date_selected',
  'personal_info_entered',
  'payment_completed'
], {
  startDate: new Date('2023-09-01'),
  endDate: new Date('2023-09-30'),
  segmentBy: 'userType'
});
```

### Cohort Analysis

```typescript
// Analyze user cohorts over time
const cohortAnalysis = await analyticsService.analyzeCohorts({
  cohortType: 'registration',
  timeframe: '30d',
  metrics: ['retention', 'revenue', 'bookings']
});
```

## Performance Optimization

### Data Aggregation

- Events are batched and processed asynchronously
- Real-time metrics use Redis caching for fast retrieval
- Historical data is aggregated into daily/weekly/monthly summaries
- Automatic data archival after configurable retention period

### Caching Strategy

```typescript
// Redis caching for frequently accessed metrics
const cacheKey = `analytics:dashboard:${businessId}:${period}`;
const cachedData = await redis.get(cacheKey);

if (!cachedData) {
  const dashboardData = await generateDashboardData(businessId, period);
  await redis.setex(cacheKey, 300, JSON.stringify(dashboardData)); // 5-minute cache
  return dashboardData;
}
```

### Background Processing

- Event processing happens in background workers
- Automatic retry mechanism for failed operations
- Queue management for high-volume event processing
- Graceful degradation when services are unavailable

## Privacy and Compliance

### Data Privacy

- Personal data is anonymized in analytics events
- User consent management for tracking
- GDPR-compliant data retention and deletion
- Secure data transmission and storage

### Data Retention

```typescript
// Configurable data retention policies
const retentionPolicies = {
  rawEvents: 90, // days
  aggregatedMetrics: 365, // days
  userSessions: 180, // days
  personalData: 'user_controlled' // deleted on user request
};
```

## Testing

### Unit Tests

```typescript
describe('AnalyticsService', () => {
  it('should track events successfully', async () => {
    const event = {
      userId: 'test-user',
      sessionId: 'test-session',
      eventName: 'test_event',
      properties: { test: true }
    };
    
    const result = await analyticsService.trackEvent(event);
    expect(result).toBeTruthy();
  });

  it('should generate business metrics', async () => {
    const metrics = await analyticsService.generateBusinessMetrics('business123', '7d');
    expect(metrics.bookings).toBeDefined();
    expect(metrics.revenue).toBeGreaterThanOrEqual(0);
  });
});
```

### Integration Tests

```typescript
describe('Analytics API', () => {
  it('should track events via API', async () => {
    const response = await request(app)
      .post('/api/analytics/track')
      .send({
        eventName: 'api_test',
        properties: { source: 'integration_test' }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Monitoring and Alerts

### Health Monitoring

```typescript
// Monitor analytics service health
const healthCheck = await analyticsService.getStats();

if (healthCheck.eventProcessingRate < threshold) {
  // Alert: Low event processing rate
  await alertService.sendAlert('analytics_performance_degraded');
}
```

### Error Tracking

- Automatic error logging and aggregation
- Performance monitoring for query execution times
- Alert system for service degradation
- Dashboard for system health monitoring

## Third-party Integrations

### Mixpanel Integration

```typescript
// Automatic Mixpanel sync when configured
if (process.env.MIXPANEL_PROJECT_TOKEN) {
  await mixpanel.track(eventName, {
    distinct_id: userId,
    ...properties,
    $insert_id: eventId // Prevent duplicates
  });
}
```

### Google Analytics Integration

```typescript
// Optional GA4 integration
if (process.env.GA_MEASUREMENT_ID) {
  await sendGoogleAnalyticsEvent(eventName, properties);
}
```

## Deployment

### Production Configuration

```bash
# Required environment variables for production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/reservio
REDIS_URL=redis://redis-cluster:6379

# Optional integrations
MIXPANEL_PROJECT_TOKEN=your_production_mixpanel_token
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Performance settings
ANALYTICS_BATCH_SIZE=500
ANALYTICS_FLUSH_INTERVAL=30000
ANALYTICS_RETENTION_DAYS=365
ANALYTICS_ENABLE_DEBUG=false
```

### Database Indexes

```javascript
// MongoDB indexes for optimal performance
db.analytics_events.createIndex({ userId: 1, timestamp: -1 });
db.analytics_events.createIndex({ sessionId: 1, timestamp: 1 });
db.analytics_events.createIndex({ eventName: 1, timestamp: -1 });
db.user_sessions.createIndex({ userId: 1, createdAt: -1 });
db.page_views.createIndex({ path: 1, timestamp: -1 });
```

## Troubleshooting

### Common Issues

1. **Events Not Tracking**
   - Check MongoDB/Redis connections
   - Verify middleware is properly configured
   - Check browser console for JavaScript errors
   - Confirm API endpoints are accessible

2. **Dashboard Not Loading**
   - Verify user permissions (admin access required)
   - Check API authentication
   - Confirm database connectivity
   - Review server logs for errors

3. **Performance Issues**
   - Check Redis cache configuration
   - Review database query performance
   - Monitor background job processing
   - Consider data archival for old records

### Debug Tools

```typescript
// Enable debug logging in development
const analyticsService = new AnalyticsService({
  debug: true,
  logLevel: 'verbose'
});

// Test analytics in React components
import { AnalyticsEventTracker } from '../components/AnalyticsComponents';

function DevTestPage() {
  return (
    <div>
      <h1>Analytics Testing</h1>
      <AnalyticsEventTracker />
    </div>
  );
}
```

## Future Enhancements

### Planned Features

1. **Machine Learning**: Predictive analytics and user behavior modeling
2. **Real-time Alerts**: Automated alerts for anomalies and trends
3. **Advanced Segmentation**: AI-powered user segmentation
4. **Custom Dashboards**: User-configurable analytics dashboards
5. **Data Export**: CSV/Excel export functionality
6. **A/B Test Integration**: Deeper integration with A/B testing results

### Integration Opportunities

1. **CRM Integration**: Sync analytics data with customer management systems
2. **Email Marketing**: Behavioral triggers for email campaigns
3. **Business Intelligence**: Integration with Tableau, Power BI, etc.
4. **Mobile Analytics**: Native mobile app tracking
5. **Voice Analytics**: Voice interaction tracking and analysis

## Best Practices

### Implementation Guidelines

1. **Event Naming**: Use consistent, descriptive event names
2. **Property Structure**: Keep event properties flat and meaningful
3. **Privacy First**: Always respect user privacy and consent
4. **Performance**: Batch events and use async processing
5. **Testing**: Thoroughly test analytics in development environments

### Data Quality

1. **Validation**: Validate event data before processing
2. **Deduplication**: Implement mechanisms to prevent duplicate events
3. **Consistency**: Maintain consistent data formats across platforms
4. **Documentation**: Document all tracked events and their purposes