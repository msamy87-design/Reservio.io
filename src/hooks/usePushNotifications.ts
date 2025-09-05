import { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';

export interface NotificationPermission {
  state: 'default' | 'granted' | 'denied';
  isSupported: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
}

interface PushNotificationContextValue {
  isSupported: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
  showNotification: (options: NotificationOptions) => Promise<void>;
  clearError: () => void;
}

const PushNotificationContext = createContext<PushNotificationContextValue | null>(null);

// Provider component
export interface PushNotificationProviderProps {
  children: ReactNode;
  apiBaseUrl?: string;
  vapidPublicKey?: string;
  enableAutoRequest?: boolean;
  enableServiceWorker?: boolean;
  serviceWorkerPath?: string;
}

export const PushNotificationProvider: React.FC<PushNotificationProviderProps> = ({
  children,
  apiBaseUrl = '/api/push',
  vapidPublicKey,
  enableAutoRequest = false,
  enableServiceWorker = true,
  serviceWorkerPath = '/sw.js'
}) => {
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 
           'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
  });

  const [permission, setPermission] = useState<NotificationPermission>({
    state: isSupported ? Notification.permission as any : 'denied',
    isSupported
  });

  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(vapidPublicKey || null);

  // Initialize service worker
  useEffect(() => {
    if (!isSupported || !enableServiceWorker) return;

    const initServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(serviceWorkerPath);
        setServiceWorkerRegistration(registration);
        
        // Wait for service worker to be ready
        const readyRegistration = await navigator.serviceWorker.ready;
        setServiceWorkerRegistration(readyRegistration);
      } catch (err) {
        console.error('Service Worker registration failed:', err);
        setError('Failed to initialize service worker');
      }
    };

    initServiceWorker();
  }, [isSupported, enableServiceWorker, serviceWorkerPath]);

  // Load VAPID public key if not provided
  useEffect(() => {
    if (!publicKey && isSupported) {
      fetch(`${apiBaseUrl}/vapid-public-key`)
        .then(res => res.json())
        .then(data => setPublicKey(data.publicKey))
        .catch(err => console.error('Failed to load VAPID key:', err));
    }
  }, [apiBaseUrl, publicKey, isSupported]);

  // Check existing subscription
  useEffect(() => {
    if (!serviceWorkerRegistration || !publicKey) return;

    const checkSubscription = async () => {
      try {
        const existingSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription({
            endpoint: existingSubscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(existingSubscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(existingSubscription.getKey('auth')!)
            }
          });
        }
      } catch (err) {
        console.error('Failed to check existing subscription:', err);
      }
    };

    checkSubscription();
  }, [serviceWorkerRegistration, publicKey]);

  // Auto-request permission if enabled
  useEffect(() => {
    if (enableAutoRequest && permission.state === 'default' && isSupported) {
      requestPermission();
    }
  }, [enableAutoRequest, permission.state, isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications not supported');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission({
        state: result as any,
        isSupported
      });

      return result === 'granted';
    } catch (err) {
      const errorMsg = 'Failed to request notification permission';
      setError(errorMsg);
      console.error(errorMsg, err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !serviceWorkerRegistration || !publicKey) {
      setError('Push notifications not available');
      return false;
    }

    if (permission.state !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create push subscription
      const pushSubscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      const subscriptionData: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      };

      // Send subscription to server
      const response = await fetch(`${apiBaseUrl}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      setSubscription(subscriptionData);
      return true;

    } catch (err) {
      const errorMsg = `Failed to subscribe: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      console.error('Push subscription failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, serviceWorkerRegistration, publicKey, permission.state, apiBaseUrl, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!serviceWorkerRegistration) return;

    setIsLoading(true);
    setError(null);

    try {
      // Unsubscribe from push manager
      const pushSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      // Notify server
      await fetch(`${apiBaseUrl}/subscribe`, {
        method: 'DELETE',
        credentials: 'include'
      });

      setSubscription(null);
    } catch (err) {
      const errorMsg = `Failed to unsubscribe: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      console.error('Push unsubscription failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [serviceWorkerRegistration, apiBaseUrl]);

  const showNotification = useCallback(async (options: NotificationOptions): Promise<void> => {
    if (!isSupported) {
      throw new Error('Notifications not supported');
    }

    if (permission.state !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    if (serviceWorkerRegistration) {
      // Use service worker to show notification
      await serviceWorkerRegistration.showNotification(options.title, {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        image: options.image,
        actions: options.actions,
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
        data: options.data
      });
    } else {
      // Fallback to browser notification
      new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
        data: options.data
      });
    }
  }, [isSupported, permission.state, serviceWorkerRegistration]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: PushNotificationContextValue = {
    isSupported,
    permission,
    subscription,
    isSubscribed: subscription !== null,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    clearError
  };

  return (
    <PushNotificationContext.Provider value={contextValue}>
      {children}
    </PushNotificationContext.Provider>
  );
};

// Main hook
export const usePushNotifications = () => {
  const context = useContext(PushNotificationContext);
  
  if (!context) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider');
  }

  return context;
};

// Specific hooks for different use cases
export const useNotificationPermission = () => {
  const { permission, requestPermission, isLoading } = usePushNotifications();
  return { permission, requestPermission, isLoading };
};

export const usePushSubscription = () => {
  const { subscription, isSubscribed, subscribe, unsubscribe, isLoading, error } = usePushNotifications();
  return { subscription, isSubscribed, subscribe, unsubscribe, isLoading, error };
};

export const useNotificationSender = () => {
  const { showNotification, isSupported, permission } = usePushNotifications();
  
  const canSend = isSupported && permission.state === 'granted';
  
  const sendBookingConfirmation = useCallback(async (bookingData: {
    serviceName: string;
    businessName: string;
    dateTime: Date;
    bookingId: string;
  }) => {
    if (!canSend) return;
    
    await showNotification({
      title: 'Booking Confirmed! 🎉',
      body: `Your appointment for ${bookingData.serviceName} at ${bookingData.businessName} is confirmed`,
      icon: '/icons/booking-confirmed.png',
      tag: `booking-${bookingData.bookingId}`,
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'calendar', title: 'Add to Calendar' }
      ],
      data: { type: 'booking_confirmed', bookingId: bookingData.bookingId }
    });
  }, [canSend, showNotification]);

  const sendBookingReminder = useCallback(async (bookingData: {
    serviceName: string;
    businessName: string;
    dateTime: Date;
    bookingId: string;
  }) => {
    if (!canSend) return;
    
    await showNotification({
      title: 'Upcoming Appointment Reminder ⏰',
      body: `Your appointment for ${bookingData.serviceName} is coming up soon`,
      icon: '/icons/reminder.png',
      tag: `reminder-${bookingData.bookingId}`,
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'reschedule', title: 'Reschedule' }
      ],
      data: { type: 'booking_reminder', bookingId: bookingData.bookingId }
    });
  }, [canSend, showNotification]);

  return {
    canSend,
    showNotification,
    sendBookingConfirmation,
    sendBookingReminder
  };
};

// Service Worker Message Hook
export const useServiceWorkerMessages = (onMessage?: (data: any) => void) => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_NOTIFICATION_CLICKED') {
        onMessage?.(event.data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [onMessage]);
};

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}