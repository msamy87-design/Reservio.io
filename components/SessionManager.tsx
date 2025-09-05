import React, { useState, useEffect } from 'react';
import { 
  DevicePhoneMobileIcon, 
  ComputerDesktopIcon, 
  DeviceTabletIcon,
  MapPinIcon,
  ClockIcon,
  XMarkIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon
} from './Icons';
import { useToast } from '../contexts/ToastContext';

interface SessionInfo {
  id: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceName: string;
  browser: string;
  os: string;
  location: {
    city?: string;
    country?: string;
    ip: string;
  };
  lastActive: string;
  isCurrent: boolean;
  isSuspicious?: boolean;
  loginTime: string;
}

interface SessionManagerProps {
  userType: 'customer' | 'business' | 'admin';
  userId: string;
}

const SessionManager: React.FC<SessionManagerProps> = ({ userType, userId }) => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);
  const [showSessionTimeoutWarning, setShowSessionTimeoutWarning] = useState(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState(0);
  const { addToast } = useToast();

  useEffect(() => {
    fetchSessions();
    
    // Set up session monitoring
    const sessionCheckInterval = setInterval(() => {
      checkSessionStatus();
    }, 30000); // Check every 30 seconds

    // Listen for session timeout warnings
    const timeoutWarningInterval = setInterval(() => {
      checkForSessionTimeout();
    }, 60000); // Check every minute

    return () => {
      clearInterval(sessionCheckInterval);
      clearInterval(timeoutWarningInterval);
    };
  }, [userId, userType]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/sessions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        throw new Error('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Session fetch error:', error);
      addToast('Failed to load session information', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSessionStatus = async () => {
    try {
      const response = await fetch(`/api/auth/session/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        // Session expired or invalid
        handleSessionExpired();
      }
    } catch (error) {
      console.error('Session status check error:', error);
    }
  };

  const checkForSessionTimeout = async () => {
    try {
      const response = await fetch(`/api/auth/session/timeout-check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.warningNeeded) {
          setTimeoutCountdown(data.timeRemaining);
          setShowSessionTimeoutWarning(true);
        }
      }
    } catch (error) {
      console.error('Session timeout check error:', error);
    }
  };

  const handleSessionExpired = () => {
    addToast('Your session has expired. Please log in again.', 'error');
    // Redirect to login
    window.location.href = `/${userType === 'customer' ? 'customer' : userType === 'admin' ? 'admin' : 'biz'}/login`;
  };

  const terminateSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to end this session?')) {
      return;
    }

    setTerminatingSession(sessionId);
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        addToast('Session terminated successfully', 'success');
      } else {
        const data = await response.json();
        addToast(data.message || 'Failed to terminate session', 'error');
      }
    } catch (error) {
      console.error('Session termination error:', error);
      addToast('Failed to terminate session', 'error');
    } finally {
      setTerminatingSession(null);
    }
  };

  const terminateAllOtherSessions = async () => {
    if (!window.confirm('Are you sure you want to end all other sessions? You will remain logged in on this device.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/sessions/terminate-others`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchSessions();
        addToast('All other sessions terminated successfully', 'success');
      } else {
        const data = await response.json();
        addToast(data.message || 'Failed to terminate sessions', 'error');
      }
    } catch (error) {
      console.error('Bulk session termination error:', error);
      addToast('Failed to terminate sessions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const extendSession = async () => {
    try {
      const response = await fetch(`/api/auth/session/extend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowSessionTimeoutWarning(false);
        setTimeoutCountdown(0);
        addToast('Session extended successfully', 'success');
      } else {
        addToast('Failed to extend session', 'error');
      }
    } catch (error) {
      console.error('Session extension error:', error);
      addToast('Failed to extend session', 'error');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return DevicePhoneMobileIcon;
      case 'tablet':
        return DeviceTabletIcon;
      default:
        return ComputerDesktopIcon;
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatTimeoutCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Timeout Warning Modal */}
      {showSessionTimeoutWarning && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Session Timeout Warning
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your session will expire in <strong>{formatTimeoutCountdown(timeoutCountdown)}</strong>.
                        Would you like to extend your session?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={extendSession}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Extend Session
                </button>
                <button
                  type="button"
                  onClick={() => setShowSessionTimeoutWarning(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Active Sessions
        </h3>
        {sessions.filter(s => !s.isCurrent).length > 0 && (
          <button
            onClick={terminateAllOtherSessions}
            className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            End All Other Sessions
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session) => {
          const DeviceIcon = getDeviceIcon(session.deviceType);
          
          return (
            <div
              key={session.id}
              className={`p-4 border rounded-lg ${
                session.isCurrent
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : session.isSuspicious
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <DeviceIcon className={`h-6 w-6 ${
                      session.isCurrent ? 'text-green-600 dark:text-green-400' :
                      session.isSuspicious ? 'text-red-600 dark:text-red-400' :
                      'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {session.deviceName}
                      </p>
                      {session.isCurrent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                          Current
                        </span>
                      )}
                      {session.isSuspicious && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200">
                          <ShieldExclamationIcon className="h-3 w-3 mr-1" />
                          Suspicious
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {session.browser} on {session.os}
                    </p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        {session.location.city && session.location.country 
                          ? `${session.location.city}, ${session.location.country}`
                          : session.location.ip
                        }
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatLastActive(session.lastActive)}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Signed in {formatLastActive(session.loginTime)}
                    </p>
                  </div>
                </div>
                
                {!session.isCurrent && (
                  <button
                    onClick={() => terminateSession(session.id)}
                    disabled={terminatingSession === session.id}
                    className="ml-3 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    title="End this session"
                  >
                    {terminatingSession === session.id ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <XMarkIcon className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-8">
          <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No active sessions found
          </p>
        </div>
      )}

      {/* Security Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Security Tips
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Regularly review your active sessions</li>
          <li>• End sessions on devices you no longer use</li>
          <li>• Report any suspicious or unrecognized sessions</li>
          <li>• Always log out from shared or public devices</li>
        </ul>
      </div>
    </div>
  );
};

export default SessionManager;