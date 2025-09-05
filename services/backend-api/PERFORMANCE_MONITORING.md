# Performance Monitoring Setup

This document describes the performance monitoring implementation for the Reservio Backend API using New Relic APM.

## Overview

The application includes comprehensive performance monitoring that tracks:
- API response times and throughput
- Database query performance
- Authentication events
- Business metrics
- Error tracking and alerting
- Custom application metrics

## Configuration

### Environment Variables

```bash
# Required for New Relic monitoring
NEW_RELIC_LICENSE_KEY=your_license_key_here

# Optional configuration
NEW_RELIC_LOG_FILE=newrelic_agent.log
NODE_ENV=production
```

### New Relic Configuration

The New Relic agent is configured in `newrelic.js` with the following features:

- **Transaction Tracing**: Detailed traces for slow transactions
- **Database Monitoring**: SQL query performance tracking
- **Error Collection**: Automatic error tracking and alerting
- **Custom Attributes**: Request headers and user context
- **Distributed Tracing**: Cross-service request tracking

## Tracked Metrics

### Authentication Metrics
- Login/signup success/failure rates
- User authentication patterns
- Password reset requests

### Business Metrics
- Booking creation, confirmation, cancellation rates
- Revenue tracking
- Service duration averages
- Business performance indicators

### API Performance
- Response times by endpoint
- Request success/error rates
- Rate limiting effectiveness
- Database query performance

### Custom Events

#### BookingEvent
```javascript
{
  event: 'created' | 'confirmed' | 'cancelled' | 'completed',
  bookingId: string,
  businessId: string,
  customerId: string,
  serviceId: string,
  price: number,
  duration: number,
  timestamp: ISO date
}
```

#### AuthEvent
```javascript
{
  event: 'login' | 'signup' | 'logout' | 'password_reset',
  userType: 'customer' | 'business' | 'admin',
  success: boolean,
  userId: string,
  timestamp: ISO date
}
```

#### APIPerformance
```javascript
{
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  timestamp: ISO date
}
```

## Usage Examples

### Tracking Custom Metrics

```typescript
import { performanceMonitoring } from '../services/performanceMonitoringService';

// Track business metric
performanceMonitoring.trackBusinessMetric(
  businessId, 
  'daily_bookings', 
  totalBookings
);

// Track booking event
performanceMonitoring.trackBookingEvent('created', {
  bookingId: booking.id,
  businessId: booking.businessId,
  customerId: booking.customerId,
  serviceId: booking.serviceId,
  price: booking.pricing.total,
  duration: booking.duration
});

// Track custom timing
const endTiming = performanceMonitoring.startTiming('complex_operation');
// ... perform operation
endTiming(); // Records duration automatically
```

### Error Tracking

```typescript
try {
  // risky operation
} catch (error) {
  performanceMonitoring.trackError(error, {
    userId: req.user?.id,
    endpoint: req.originalUrl,
    userType: req.user?.role,
    additionalData: { customField: 'value' }
  });
  throw error;
}
```

## Middleware Integration

The application automatically includes performance monitoring middleware that:

1. **Request Tracking**: Captures all incoming requests with timing
2. **User Context**: Associates requests with authenticated users
3. **Error Handling**: Automatically reports uncaught exceptions
4. **Database Monitoring**: Tracks MongoDB query performance

## Monitoring Dashboard

When properly configured with New Relic, you can access:

### Key Performance Indicators
- **Apdex Score**: User satisfaction metric (target: 0.5s)
- **Response Time**: 95th percentile response times
- **Throughput**: Requests per minute
- **Error Rate**: Percentage of failed requests

### Custom Dashboards
- Authentication success rates by user type
- Booking conversion funnel
- Revenue tracking and trends
- Database performance metrics
- Cache hit/miss ratios

### Alerts
- Response time > 2 seconds
- Error rate > 5%
- Database query time > 1 second
- Memory usage > 80%

## Development vs Production

### Development Mode
- Detailed logging enabled
- Raw SQL queries recorded
- Lower transaction thresholds
- More verbose error reporting

### Production Mode
- High security mode enabled
- SQL queries obfuscated
- Optimized for performance
- Error details sanitized

## Troubleshooting

### Common Issues

1. **Monitoring Disabled**
   ```
   Performance monitoring disabled: NEW_RELIC_LICENSE_KEY not provided
   ```
   **Solution**: Set the `NEW_RELIC_LICENSE_KEY` environment variable

2. **High Memory Usage**
   - Check New Relic agent overhead in production
   - Adjust logging levels if necessary
   - Review custom metric frequency

3. **Missing Metrics**
   - Verify middleware is properly installed
   - Check error logs for New Relic connection issues
   - Ensure proper user context is set

### Debug Mode

Enable debug logging:
```bash
NEW_RELIC_LOG_LEVEL=trace npm start
```

## Best Practices

1. **Custom Metrics**: Don't over-instrument; focus on business-critical metrics
2. **User Privacy**: Ensure no PII is included in custom attributes
3. **Performance Impact**: Monitor the monitoring overhead in production
4. **Alert Fatigue**: Set appropriate thresholds to avoid false positives
5. **Dashboard Maintenance**: Regularly review and update custom dashboards

## Integration with Other Tools

The performance monitoring service is designed to work alongside:
- **Redis Caching**: Cache hit/miss tracking
- **Database**: MongoDB query performance
- **Authentication**: JWT token usage patterns
- **Business Logic**: Domain-specific metrics

## Cost Considerations

New Relic pricing is based on:
- Data ingestion volume
- Number of monitored services
- Custom events and attributes
- Retention period

Optimize costs by:
- Filtering out unnecessary data
- Using appropriate sampling rates
- Cleaning up unused custom metrics
- Setting proper data retention policies