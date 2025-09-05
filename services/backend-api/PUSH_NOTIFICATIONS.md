# Push Notifications System

This document describes the comprehensive push notification system implemented for Reservio to provide real-time booking confirmations, reminders, and user engagement features.

## Overview

The push notification infrastructure provides:
- **Web Push Notifications**: Browser-based push notifications using VAPID
- **Mobile Push Notifications**: Firebase Cloud Messaging (FCM) for iOS/Android
- **Real-time Booking Updates**: Instant confirmations and reminders
- **Template Management**: Configurable notification templates
- **User Segmentation**: Targeted notifications based on user criteria
- **Analytics & Tracking**: Delivery reports and engagement metrics
- **Graceful Degradation**: Fallback handling when services unavailable

## Architecture

### Backend Services

#### PushNotificationService (`pushNotificationService.ts`)
Core push notification functionality:
- User subscription management (Web Push + FCM tokens)
- Template-based notification sending
- Multi-platform delivery (web, iOS, Android)
- Event tracking and analytics
- Booking-specific notification helpers

#### PushNotificationMiddleware (`pushNotificationMiddleware.ts`)
Express middleware for push notifications:
- Request-level notification helpers
- API endpoints for subscription management
- Automatic booking notification integration
- Admin panel for notification management

### Frontend Integration

#### React Hooks (`usePushNotifications.ts`)
- `usePushNotifications()`: Main hook for notification management
- `useNotificationPermission()`: Permission handling
- `usePushSubscription()`: Subscription management
- `useNotificationSender()`: Sending notifications

#### React Components (`PushNotificationComponents.tsx`)
Pre-built components for notification features:
- `NotificationPermissionBanner`: Permission request UI
- `NotificationSettings`: User preference management
- `NotificationTester`: Development testing tools
- `NotificationStatusIndicator`: Status display

#### Service Worker (`sw.js`)
Background service worker for:
- Push event handling
- Notification display
- Click event processing
- Offline notification queuing

## Configuration

### Environment Variables

```bash
# Web Push (VAPID)
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:admin@reservio.com

# Firebase Cloud Messaging
FCM_SERVICE_ACCOUNT_PATH=/path/to/service-account-key.json
FCM_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
FCM_PROJECT_ID=your-firebase-project-id
```

### Generating VAPID Keys

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys

# Output:
# Public Key: BEl62iUYg...
# Private Key: mdHbs6xK...
```

## Usage Examples

### Backend Implementation

#### 1. Basic Notification Sending

```typescript
import { pushNotificationService } from '../services/pushNotificationService';

// Send notification to specific user
await pushNotificationService.sendNotification('user123', {
  title: 'Booking Confirmed! 🎉',
  body: 'Your appointment is confirmed for tomorrow at 2:00 PM',
  icon: '/icons/booking-confirmed.png',
  url: '/bookings/abc123',
  actions: [
    { action: 'view', title: 'View Details' },
    { action: 'calendar', title: 'Add to Calendar' }
  ]
});
```

#### 2. Booking-Specific Notifications

```typescript
// Send booking confirmation
await pushNotificationService.sendBookingConfirmation('user123', {
  id: 'booking123',
  serviceName: 'Haircut & Style',
  businessName: 'Elite Hair Salon',
  dateTime: new Date('2025-09-06T14:00:00Z'),
  duration: 60,
  price: 65.00
});

// Send booking reminder
await pushNotificationService.sendBookingReminder('user123', {
  id: 'booking123',
  serviceName: 'Haircut & Style', 
  businessName: 'Elite Hair Salon',
  dateTime: new Date('2025-09-06T14:00:00Z')
});
```

#### 3. Template Management

```typescript
// Create custom template
const template = await pushNotificationService.createTemplate({
  name: 'Promotion Alert',
  type: 'promotion',
  title: 'Special Offer! {{discount}}% Off',
  body: 'Get {{discount}}% off your next booking at {{businessName}}',
  icon: '/icons/promotion.png',
  actions: [
    { action: 'book', title: 'Book Now' },
    { action: 'learn', title: 'Learn More' }
  ]
});
```

### Frontend Implementation

#### 1. App-Level Setup

```tsx
import { PushNotificationProvider } from './hooks/usePushNotifications';

function App() {
  return (
    <PushNotificationProvider
      apiBaseUrl="/api/push"
      enableAutoRequest={true}
      enableServiceWorker={true}
    >
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </PushNotificationProvider>
  );
}
```

#### 2. Permission Management

```tsx
import { NotificationPermissionBanner } from '../components/PushNotificationComponents';

function HomePage() {
  return (
    <div>
      <NotificationPermissionBanner 
        autoShow={true}
        onDismiss={() => console.log('Banner dismissed')}
      />
      <main>
        {/* Your app content */}
      </main>
    </div>
  );
}
```

#### 3. Settings Page

```tsx
import { NotificationSettings } from '../components/PushNotificationComponents';

function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      <NotificationSettings />
    </div>
  );
}
```

#### 4. Custom Notification Handling

```tsx
import { usePushNotifications, useNotificationSender } from '../hooks/usePushNotifications';

function BookingConfirmationPage({ booking }) {
  const { sendBookingConfirmation } = useNotificationSender();
  
  useEffect(() => {
    // Send notification when booking is confirmed
    if (booking.status === 'confirmed') {
      sendBookingConfirmation({
        serviceName: booking.service.name,
        businessName: booking.business.name,
        dateTime: new Date(booking.scheduledFor),
        bookingId: booking.id
      });
    }
  }, [booking.status]);
  
  return (
    <div>
      <h1>Booking Confirmed!</h1>
      {/* Booking details */}
    </div>
  );
}
```

## API Endpoints

### Subscription Management

```http
# Subscribe to web push notifications
POST /api/push/subscribe
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BEl62iUYg...",
    "auth": "mdHbs6xK..."
  }
}

# Unsubscribe from notifications
DELETE /api/push/subscribe/[subscriptionId]

# Add FCM token (mobile)
POST /api/push/fcm-token
Content-Type: application/json

{
  "token": "fcm_token_here",
  "platform": "android",
  "deviceId": "device_123"
}
```

### Notification Sending

```http
# Send custom notification (admin)
POST /api/push/send
Content-Type: application/json

{
  "userIds": ["user123", "user456"],
  "payload": {
    "title": "Special Announcement",
    "body": "We have exciting news to share!",
    "icon": "/icons/announcement.png"
  },
  "options": {
    "platforms": ["web", "android", "ios"]
  }
}

# Send booking confirmation
POST /api/push/booking/confirmed
Content-Type: application/json

{
  "id": "booking123",
  "serviceName": "Massage Therapy",
  "businessName": "Zen Spa",
  "dateTime": "2025-09-06T15:00:00Z",
  "price": 80.00
}
```

### Analytics and Management

```http
# Get notification templates
GET /api/push/templates

# Create notification template (admin)
POST /api/push/templates
Content-Type: application/json

{
  "name": "Weekly Digest",
  "type": "newsletter",
  "title": "Your Weekly Beauty Update",
  "body": "Discover {{weeklyOfferCount}} new offers this week!"
}

# Get notification history
GET /api/push/history?limit=50

# Get notification stats (admin)
GET /api/push/stats

# Get VAPID public key
GET /api/push/vapid-public-key
```

## Notification Types

### Booking Notifications

1. **Booking Confirmed**
   - Triggered: When booking is successfully created
   - Template: Confirmation with appointment details
   - Actions: View Details, Add to Calendar

2. **Booking Reminder**
   - Triggered: 24 hours before appointment
   - Template: Reminder with appointment time
   - Actions: View Details, Reschedule

3. **Booking Cancelled**
   - Triggered: When booking is cancelled
   - Template: Cancellation notice with apology
   - Actions: Rebook, Contact Support

4. **Payment Received**
   - Triggered: When payment is processed
   - Template: Payment confirmation with amount
   - Actions: View Receipt, View Booking

### Marketing Notifications

1. **Promotions**
   - Triggered: Based on campaigns or user behavior
   - Template: Offer details with discount code
   - Actions: Book Now, Learn More

2. **Newsletter**
   - Triggered: Weekly/monthly digest
   - Template: Updates and tips
   - Actions: Read More, Update Preferences

## Service Worker Integration

### Basic Service Worker (`sw.js`)

```javascript
// Handle push events
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    actions: data.actions || [],
    data: data.data,
    tag: data.tag,
    requireInteraction: data.requireInteraction
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Focus existing window or open new one
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
```

## Advanced Features

### User Segmentation

```typescript
// Send notifications to specific user segments
await pushNotificationService.sendNotification(['user1', 'user2'], payload, {
  targeting: {
    userTypes: ['customer'],
    platforms: ['web', 'android'],
    countries: ['US', 'CA'],
    deviceTypes: ['mobile']
  }
});
```

### Scheduled Notifications

```typescript
// Schedule notification for later
await pushNotificationService.sendNotification('user123', payload, {
  scheduling: {
    delay: 24 * 60 * 60 * 1000, // 24 hours
    timezone: 'America/New_York'
  }
});
```

### Rich Notifications

```typescript
// Rich notification with image and actions
const richPayload = {
  title: 'Don\'t Miss Your Appointment! 💄',
  body: 'Your spa appointment is in 2 hours at Zen Wellness Spa',
  icon: '/icons/spa.png',
  image: '/images/spa-banner.jpg',
  badge: '/badge-72x72.png',
  actions: [
    {
      action: 'directions',
      title: 'Get Directions',
      icon: '/icons/map.png'
    },
    {
      action: 'reschedule',
      title: 'Reschedule',
      icon: '/icons/calendar.png'
    },
    {
      action: 'cancel',
      title: 'Cancel',
      icon: '/icons/cancel.png'
    }
  ],
  requireInteraction: true,
  data: {
    bookingId: 'booking123',
    businessId: 'business456',
    url: '/bookings/booking123'
  }
};
```

## Analytics and Monitoring

### Tracked Metrics

- **Subscription Metrics**: Total subscriptions, platform breakdown
- **Delivery Metrics**: Sent, delivered, failed notifications
- **Engagement Metrics**: Click-through rates, action clicks
- **Performance Metrics**: Delivery times, error rates

### Monitoring Integration

```typescript
// Automatic performance tracking
const stats = await pushNotificationService.getNotificationStats();

console.log('Push Notification Stats:', {
  totalSubscriptions: stats.totalSubscriptions,
  deliveryRate: (stats.totalDelivered / stats.totalSent) * 100,
  clickThroughRate: (stats.totalClicked / stats.totalDelivered) * 100,
  platformBreakdown: stats.platformBreakdown
});
```

## Error Handling and Fallbacks

### Graceful Degradation

```typescript
try {
  await pushNotificationService.sendNotification(userId, payload);
} catch (error) {
  console.error('Push notification failed:', error);
  
  // Fallback to email notification
  await emailService.sendNotificationEmail(userId, payload);
  
  // Or in-app notification
  await inAppNotificationService.create(userId, payload);
}
```

### Common Error Scenarios

1. **Invalid Subscription**: Remove expired subscriptions
2. **VAPID Configuration**: Provide clear setup instructions
3. **FCM Errors**: Handle token refresh and invalid tokens
4. **Permission Denied**: Guide users to re-enable permissions
5. **Network Issues**: Queue notifications for retry

## Testing

### Manual Testing

```typescript
// Test notification components
import { NotificationTester } from '../components/PushNotificationComponents';

function DevTestPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Notification Testing</h1>
      <NotificationTester />
    </div>
  );
}
```

### Unit Tests

```typescript
describe('PushNotificationService', () => {
  it('should send web push notifications', async () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: { p256dh: 'test', auth: 'test' }
    };
    
    const result = await pushNotificationService.sendNotification(
      'user123',
      { title: 'Test', body: 'Test message' }
    );
    
    expect(result.success).toBe(1);
    expect(result.failed).toBe(0);
  });
});
```

### Integration Tests

```typescript
describe('Push Notification API', () => {
  it('should subscribe users to push notifications', async () => {
    const response = await request(app)
      .post('/api/push/subscribe')
      .send({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test', auth: 'test' }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Security Considerations

### Data Privacy
- User subscription data encrypted in transit
- VAPID keys securely stored
- FCM tokens properly managed
- Minimal user data in notification payloads

### Access Control
- Admin-only endpoints for mass notifications
- User-specific subscription management
- Rate limiting on notification endpoints
- Input validation and sanitization

### VAPID Security
- Keep private keys secure and rotated regularly
- Use environment variables for sensitive data
- Monitor for unauthorized key usage
- Implement proper key backup procedures

## Deployment

### Production Configuration

```bash
# Required environment variables
VAPID_PUBLIC_KEY=your_production_vapid_public_key
VAPID_PRIVATE_KEY=your_production_vapid_private_key
VAPID_SUBJECT=mailto:support@yourapp.com

# FCM configuration
FCM_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
FCM_PROJECT_ID=your-production-firebase-project

# Optional settings
PUSH_NOTIFICATION_RATE_LIMIT=1000
PUSH_NOTIFICATION_QUEUE_SIZE=10000
```

### Service Worker Registration

```javascript
// Register service worker in your main app
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('SW registered:', registration);
    })
    .catch(error => {
      console.error('SW registration failed:', error);
    });
}
```

### Firebase Project Setup

1. Create Firebase project
2. Enable Cloud Messaging
3. Generate service account key
4. Configure web app credentials
5. Add domain to authorized origins

## Performance Optimization

### Batching and Queuing

```typescript
// Batch notifications for efficiency
const users = ['user1', 'user2', 'user3'];
const result = await pushNotificationService.sendNotification(users, payload);
```

### Caching and Storage

- Cache user subscriptions in Redis
- Store notification templates efficiently
- Minimize payload sizes
- Use CDN for notification assets

### Background Processing

- Queue notifications for async processing
- Handle rate limiting gracefully
- Retry failed deliveries
- Monitor system performance

## Troubleshooting

### Common Issues

1. **Notifications Not Appearing**
   - Check browser/OS notification permissions
   - Verify service worker registration
   - Confirm VAPID key configuration

2. **High Failure Rates**
   - Monitor expired subscriptions
   - Check FCM token validity
   - Review notification payload sizes

3. **Poor Engagement**
   - A/B test notification content
   - Optimize timing and frequency
   - Improve notification relevance

### Debug Tools

```typescript
// Enable debug logging
const notificationService = new PushNotificationService();
notificationService.setDebugMode(true);

// Test individual components
const { isSupported, permission } = usePushNotifications();
console.log('Push support:', { isSupported, permission });
```

## Future Enhancements

### Planned Features
1. **Rich Media**: Image/video notifications
2. **Interactive Notifications**: Inline replies and actions
3. **Geolocation Triggers**: Location-based notifications
4. **Machine Learning**: Personalized timing optimization
5. **Multi-language**: Internationalized notification content

### Integration Opportunities
1. **Calendar Integration**: Automatic calendar entries
2. **Voice Notifications**: Text-to-speech for accessibility
3. **Wearable Devices**: Apple Watch, Android Wear support
4. **Social Media**: Share booking confirmations
5. **Analytics Platforms**: Advanced user behavior tracking