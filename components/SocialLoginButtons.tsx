import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

interface SocialProvider {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  hoverColor: string;
  textColor: string;
}

interface SocialLoginButtonsProps {
  userType: 'customer' | 'business';
  onSuccess: (user: any, token: string) => void;
  disabled?: boolean;
}

// Social provider icons (simplified SVG components)
const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const AppleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const LinkedInIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const MicrosoftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
  </svg>
);

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  userType,
  onSuccess,
  disabled = false
}) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const { addToast } = useToast();

  // Define available social providers based on user type
  const providers: SocialProvider[] = [
    {
      id: 'google',
      name: 'Google',
      icon: GoogleIcon,
      color: 'bg-white border-gray-300',
      hoverColor: 'hover:bg-gray-50',
      textColor: 'text-gray-700'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: FacebookIcon,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      textColor: 'text-white'
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: AppleIcon,
      color: 'bg-black',
      hoverColor: 'hover:bg-gray-900',
      textColor: 'text-white'
    }
  ];

  // Add business-specific providers
  if (userType === 'business') {
    providers.push(
      {
        id: 'microsoft',
        name: 'Microsoft',
        icon: MicrosoftIcon,
        color: 'bg-blue-500',
        hoverColor: 'hover:bg-blue-600',
        textColor: 'text-white'
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: LinkedInIcon,
        color: 'bg-blue-700',
        hoverColor: 'hover:bg-blue-800',
        textColor: 'text-white'
      }
    );
  }

  const handleSocialLogin = async (providerId: string) => {
    if (disabled) return;

    setLoadingProvider(providerId);
    
    try {
      // Simulate OAuth flow - replace with actual implementation
      const authWindow = window.open(
        `/api/auth/social/${providerId}?userType=${userType}&redirect=${encodeURIComponent(window.location.origin)}/auth/callback`,
        'social-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }

      // Listen for auth completion
      const authPromise = new Promise<{ user: any; token: string }>((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            reject(new Error('Authentication was cancelled'));
          }
        }, 1000);

        // Listen for message from popup
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'SOCIAL_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            authWindow.close();
            resolve(event.data.payload);
          } else if (event.data.type === 'SOCIAL_AUTH_ERROR') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            authWindow.close();
            reject(new Error(event.data.error || 'Authentication failed'));
          }
        };

        window.addEventListener('message', messageHandler);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          if (!authWindow.closed) {
            authWindow.close();
          }
          reject(new Error('Authentication timeout'));
        }, 5 * 60 * 1000);
      });

      const result = await authPromise;
      
      // Call success handler
      onSuccess(result.user, result.token);
      
      addToast(`Successfully signed in with ${providers.find(p => p.id === providerId)?.name}!`, 'success');
      
    } catch (error) {
      console.error(`${providerId} auth error:`, error);
      const message = error instanceof Error ? error.message : `Failed to sign in with ${providerId}`;
      addToast(message, 'error');
    } finally {
      setLoadingProvider(null);
    }
  };

  if (providers.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {providers.map((provider) => {
          const IconComponent = provider.icon;
          const isLoading = loadingProvider === provider.id;
          
          return (
            <button
              key={provider.id}
              onClick={() => handleSocialLogin(provider.id)}
              disabled={disabled || isLoading}
              className={`
                w-full inline-flex justify-center items-center px-4 py-3 border text-sm font-medium rounded-lg
                transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                ${provider.color} ${provider.hoverColor} ${provider.textColor}
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <IconComponent className="h-5 w-5 mr-3" />
                  Continue with {provider.name}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Privacy Notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default SocialLoginButtons;