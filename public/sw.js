// Service Worker for Push Notifications
const CACHE_NAME = 'reservio-push-v1';
const urlsToCache = [
  '/icons/booking-confirmed.png',
  '/icons/reminder.png',
  '/icons/booking-cancelled.png',
  '/icons/payment-received.png',
  '/icon-192x192.png',
  '/badge-72x72.png'
];

// Install event - cache notification assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching notification assets');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[SW] Failed to cache assets:', error);
      })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Push event - show notification
self.addEventListener('push', event => {
  console.log('[SW] Push received:', event);

  if (!event.data) {
    console.log('[SW] No push data received');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      image: data.image,
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
      timestamp: Date.now(),
      actions: data.actions || [],
      data: {
        url: data.data?.url || '/',
        ...data.data
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => {
          console.log('[SW] Notification shown successfully');
          // Track notification display
          return trackNotificationEvent('displayed', data);
        })
        .catch(error => {
          console.error('[SW] Failed to show notification:', error);
        })
    );

  } catch (error) {
    console.error('[SW] Error processing push data:', error);
    
    // Show fallback notification
    event.waitUntil(
      self.registration.showNotification('New Notification', {
        body: 'You have a new notification from Reservio',
        icon: '/icon-192x192.png',
        tag: 'fallback'
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event);

  const notification = event.notification;
  const data = notification.data;
  const action = event.action;

  // Close the notification
  notification.close();

  // Handle different actions
  if (action) {
    console.log('[SW] Action clicked:', action);
    event.waitUntil(handleNotificationAction(action, data));
  } else {
    // Default action - open the app
    event.waitUntil(handleDefaultClick(data));
  }

  // Track click event
  trackNotificationEvent('clicked', { action, data });
});

// Notification close event
self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification closed:', event);
  const notification = event.notification;
  
  // Track dismiss event
  trackNotificationEvent('dismissed', { tag: notification.tag });
});

// Handle notification action clicks
async function handleNotificationAction(action, data) {
  console.log('[SW] Handling action:', action, data);

  try {
    switch (action) {
      case 'view':
        return openOrFocusApp(data.url || '/');
      
      case 'book':
        return openOrFocusApp('/book');
      
      case 'calendar':
        if (data.bookingId) {
          // Add to calendar functionality
          return openOrFocusApp(`/bookings/${data.bookingId}/calendar`);
        }
        return openOrFocusApp('/calendar');
      
      case 'reschedule':
        if (data.bookingId) {
          return openOrFocusApp(`/bookings/${data.bookingId}/reschedule`);
        }
        return openOrFocusApp('/bookings');
      
      case 'learn':
        return openOrFocusApp(data.learnMoreUrl || '/promotions');
      
      case 'dismiss':
        // Just close, no action needed
        return Promise.resolve();
      
      default:
        return openOrFocusApp(data.url || '/');
    }
  } catch (error) {
    console.error('[SW] Error handling notification action:', error);
    return openOrFocusApp('/');
  }
}

// Handle default notification click
async function handleDefaultClick(data) {
  console.log('[SW] Handling default click:', data);
  
  let targetUrl = '/';
  
  try {
    // Determine target URL based on notification type
    if (data.type === 'booking_confirmed' && data.bookingId) {
      targetUrl = `/bookings/${data.bookingId}`;
    } else if (data.type === 'booking_reminder' && data.bookingId) {
      targetUrl = `/bookings/${data.bookingId}`;
    } else if (data.type === 'promotion') {
      targetUrl = '/promotions';
    } else if (data.url) {
      targetUrl = data.url;
    }
    
    return openOrFocusApp(targetUrl);
  } catch (error) {
    console.error('[SW] Error handling default click:', error);
    return openOrFocusApp('/');
  }
}

// Open app or focus existing window
async function openOrFocusApp(url = '/') {
  console.log('[SW] Opening/focusing app:', url);

  try {
    // Get all window clients
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    // Check if app is already open
    for (const client of clients) {
      if (client.url.includes(self.location.origin)) {
        console.log('[SW] Focusing existing window');
        
        // Navigate to the target URL if different
        if (url !== '/' && !client.url.includes(url)) {
          client.navigate?.(new URL(url, self.location.origin).href);
        }
        
        // Focus the window
        return client.focus();
      }
    }

    // Open new window if none exists
    console.log('[SW] Opening new window');
    return self.clients.openWindow(new URL(url, self.location.origin).href);

  } catch (error) {
    console.error('[SW] Error opening/focusing app:', error);
    // Fallback - just open the root
    return self.clients.openWindow('/');
  }
}

// Track notification events
async function trackNotificationEvent(eventType, data) {
  console.log('[SW] Tracking event:', eventType, data);

  try {
    // Send tracking data to analytics endpoint
    const response = await fetch('/api/push/delivery-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        timestamp: Date.now(),
        data
      })
    });

    if (!response.ok) {
      console.warn('[SW] Failed to track notification event:', response.status);
    }
  } catch (error) {
    console.error('[SW] Error tracking notification event:', error);
  }
}

// Background sync for offline notification handling
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event);
  
  if (event.tag === 'notification-queue') {
    event.waitUntil(processOfflineNotifications());
  }
});

// Process queued notifications when back online
async function processOfflineNotifications() {
  console.log('[SW] Processing offline notifications');
  
  try {
    // Get queued notifications from IndexedDB or cache
    const cache = await caches.open(CACHE_NAME);
    const queuedNotifications = await cache.match('notification-queue');
    
    if (queuedNotifications) {
      const notifications = await queuedNotifications.json();
      
      for (const notification of notifications) {
        await self.registration.showNotification(notification.title, notification.options);
      }
      
      // Clear the queue
      await cache.delete('notification-queue');
    }
  } catch (error) {
    console.error('[SW] Error processing offline notifications:', error);
  }
}

// Message handling from main thread
self.addEventListener('message', event => {
  console.log('[SW] Received message:', event);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Send response back to main thread
  event.ports[0]?.postMessage({
    type: 'SW_RESPONSE',
    success: true
  });
});

// Fetch event - serve cached assets when offline
self.addEventListener('fetch', event => {
  // Only handle requests for notification assets
  if (event.request.url.includes('/icons/') || 
      event.request.url.includes('icon-') || 
      event.request.url.includes('badge-')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('[SW] Serving cached asset:', event.request.url);
            return response;
          }
          
          // Fetch from network if not in cache
          return fetch(event.request)
            .then(response => {
              // Cache successful responses
              if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return response;
            });
        })
        .catch(error => {
          console.error('[SW] Error serving asset:', error);
          // Return a fallback icon if available
          return caches.match('/icon-192x192.png');
        })
    );
  }
});

// Periodic background sync for cleaning up old notifications
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cleanup-notifications') {
    event.waitUntil(cleanupOldNotifications());
  }
});

// Clean up old cached data
async function cleanupOldNotifications() {
  console.log('[SW] Cleaning up old notifications');
  
  try {
    // Clean up notification history older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // This would typically involve clearing IndexedDB or other storage
    // For now, just log the cleanup
    console.log('[SW] Cleanup completed for notifications older than:', new Date(thirtyDaysAgo));
  } catch (error) {
    console.error('[SW] Error during cleanup:', error);
  }
}

console.log('[SW] Service worker script loaded successfully');