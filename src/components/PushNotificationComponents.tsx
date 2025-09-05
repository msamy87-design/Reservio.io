import React, { useState, useEffect } from 'react';
import { usePushNotifications, useNotificationPermission, usePushSubscription, useNotificationSender } from '../hooks/usePushNotifications';

// Notification Permission Banner
export const NotificationPermissionBanner: React.FC<{
  onDismiss?: () => void;
  autoShow?: boolean;
  className?: string;
}> = ({ onDismiss, autoShow = true, className = '' }) => {
  const { permission, requestPermission, isLoading } = useNotificationPermission();
  const [isDismissed, setIsDismissed] = useState(false);

  const shouldShow = autoShow && 
                   permission.state === 'default' && 
                   !isDismissed && 
                   permission.isSupported;

  const handleRequest = async () => {
    const granted = await requestPermission();
    if (granted || !granted) {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (!shouldShow) return null;

  return (
    <div className={`
      bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
      border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 ${className}
    `}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM2 7h18M2 12h15M2 17h10" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Get notified about your bookings
          </h3>
          <p className="mt-1 text-sm text-blue-600 dark:text-blue-300">
            Enable push notifications to receive instant updates about booking confirmations, reminders, and important updates.
          </p>
          
          <div className="mt-3 flex space-x-3">
            <button
              onClick={handleRequest}
              disabled={isLoading}
              className="
                inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 
                font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Enabling...
                </>
              ) : (
                'Enable Notifications'
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              className="
                inline-flex items-center px-3 py-2 border border-blue-300 dark:border-blue-600 
                text-sm leading-4 font-medium rounded-md text-blue-700 dark:text-blue-300 
                bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/50
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                transition-colors duration-200
              "
            >
              Maybe Later
            </button>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="
              rounded-md text-blue-400 hover:text-blue-500 focus:outline-none 
              focus:ring-2 focus:ring-blue-500 transition-colors duration-200
            "
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Notification Settings Panel
export const NotificationSettings: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { permission, isSupported } = usePushNotifications();
  const { isSubscribed, subscribe, unsubscribe, isLoading, error } = usePushSubscription();
  const [settings, setSettings] = useState({
    bookingConfirmations: true,
    bookingReminders: true,
    promotions: false,
    newsletter: false
  });

  if (!isSupported) {
    return (
      <div className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Push notifications not supported
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your browser or device doesn't support push notifications.
          </p>
        </div>
      </div>
    );
  }

  const handleToggleSubscription = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
    }
  };

  const handleSettingChange = (setting: keyof typeof settings, enabled: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: enabled }));
    // In a real app, you'd save this to your backend
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Push Notification Settings
        </h3>
        
        {/* Permission Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Notification Permission
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {permission.state === 'granted' ? 'Notifications are allowed' :
                 permission.state === 'denied' ? 'Notifications are blocked' :
                 'Permission not requested yet'}
              </p>
            </div>
            <div className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${permission.state === 'granted' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                permission.state === 'denied' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}
            `}>
              {permission.state === 'granted' ? 'Granted' :
               permission.state === 'denied' ? 'Denied' : 'Default'}
            </div>
          </div>
        </div>

        {/* Subscription Toggle */}
        {permission.state === 'granted' && (
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Push Notifications
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isSubscribed ? 'You are subscribed to push notifications' : 'Subscribe to receive push notifications'}
                </p>
              </div>
              
              <button
                onClick={handleToggleSubscription}
                disabled={isLoading}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 
                  focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                  ${isSubscribed ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}
                `}
              >
                <span className="sr-only">Toggle push notifications</span>
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
            
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
        )}

        {/* Notification Type Settings */}
        {isSubscribed && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Notification Types
            </h4>
            
            {Object.entries(settings).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm text-gray-900 dark:text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getNotificationDescription(key as keyof typeof settings)}
                  </p>
                </div>
                
                <button
                  onClick={() => handleSettingChange(key as keyof typeof settings, !enabled)}
                  className={`
                    relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 
                    focus:ring-indigo-500 focus:ring-offset-2
                    ${enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${enabled ? 'translate-x-4' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Notification Test Component (for development/testing)
export const NotificationTester: React.FC = () => {
  const { canSend, showNotification, sendBookingConfirmation, sendBookingReminder } = useNotificationSender();
  const [isLoading, setIsLoading] = useState(false);

  const testNotifications = [
    {
      name: 'Basic Notification',
      action: () => showNotification({
        title: 'Test Notification',
        body: 'This is a test notification from Reservio',
        icon: '/icon-192x192.png'
      })
    },
    {
      name: 'Booking Confirmation',
      action: () => sendBookingConfirmation({
        serviceName: 'Haircut & Style',
        businessName: 'Elite Hair Salon',
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        bookingId: 'test-booking-123'
      })
    },
    {
      name: 'Booking Reminder',
      action: () => sendBookingReminder({
        serviceName: 'Massage Therapy',
        businessName: 'Zen Spa',
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        bookingId: 'test-booking-456'
      })
    },
    {
      name: 'Rich Notification',
      action: () => showNotification({
        title: 'Special Offer! 🎉',
        body: 'Get 20% off your next booking at participating salons',
        icon: '/icon-192x192.png',
        image: '/images/promotion-banner.jpg',
        actions: [
          { action: 'book', title: 'Book Now' },
          { action: 'learn', title: 'Learn More' }
        ],
        tag: 'promotion',
        requireInteraction: true,
        data: { type: 'promotion', offerId: 'SAVE20' }
      })
    }
  ];

  const handleTest = async (testAction: () => Promise<void>) => {
    if (!canSend) return;
    
    setIsLoading(true);
    try {
      await testAction();
    } catch (err) {
      console.error('Test notification failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canSend) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          Push notifications are not available. Please enable notifications first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Test Notifications
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {testNotifications.map((test, index) => (
          <button
            key={index}
            onClick={() => handleTest(test.action)}
            disabled={isLoading}
            className="
              p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg
              hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {test.name}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Click to test this notification type
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

// Notification Status Indicator
export const NotificationStatusIndicator: React.FC<{
  showLabel?: boolean;
  className?: string;
}> = ({ showLabel = true, className = '' }) => {
  const { permission, isSupported, isSubscribed } = usePushNotifications();

  const getStatus = () => {
    if (!isSupported) return { status: 'unsupported', color: 'gray', label: 'Unsupported' };
    if (permission.state === 'denied') return { status: 'blocked', color: 'red', label: 'Blocked' };
    if (!isSubscribed) return { status: 'disabled', color: 'yellow', label: 'Disabled' };
    return { status: 'enabled', color: 'green', label: 'Enabled' };
  };

  const { status, color, label } = getStatus();

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className={`
        w-2 h-2 rounded-full mr-2
        ${color === 'green' ? 'bg-green-500' :
          color === 'yellow' ? 'bg-yellow-500' :
          color === 'red' ? 'bg-red-500' : 'bg-gray-400'}
      `} />
      {showLabel && (
        <span className={`
          text-xs font-medium
          ${color === 'green' ? 'text-green-700 dark:text-green-400' :
            color === 'yellow' ? 'text-yellow-700 dark:text-yellow-400' :
            color === 'red' ? 'text-red-700 dark:text-red-400' : 
            'text-gray-500 dark:text-gray-400'}
        `}>
          Notifications {label}
        </span>
      )}
    </div>
  );
};

// Helper function
function getNotificationDescription(type: string): string {
  const descriptions = {
    bookingConfirmations: 'Receive confirmations when bookings are made',
    bookingReminders: 'Get reminded about upcoming appointments',
    promotions: 'Receive special offers and promotions',
    newsletter: 'Get updates about new features and tips'
  };
  return descriptions[type as keyof typeof descriptions] || '';
}

export default {
  NotificationPermissionBanner,
  NotificationSettings,
  NotificationTester,
  NotificationStatusIndicator
};