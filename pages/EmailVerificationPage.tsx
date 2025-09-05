import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { BusinessIcon, CheckCircleIcon, XMarkIcon, EnvelopeIcon } from '../components/Icons';
import { useToast } from '../contexts/ToastContext';

interface VerificationState {
  status: 'loading' | 'success' | 'error' | 'expired';
  message: string;
  userEmail?: string;
}

const EmailVerificationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: 'loading',
    message: 'Verifying your email...'
  });
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const userType = searchParams.get('type') || 'customer';
  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setVerificationState({
        status: 'error',
        message: 'Invalid verification link'
      });
    }
  }, [token]);

  useEffect(() => {
    // Resend cooldown timer
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const verifyEmail = async () => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          userType 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationState({
          status: 'success',
          message: 'Email verified successfully!',
          userEmail: data.email
        });
        
        addToast('Email verified successfully! You can now log in.', 'success');
        
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          const loginPath = userType === 'customer' ? '/customer/login' : '/biz/login';
          navigate(loginPath);
        }, 3000);
      } else {
        const isExpired = data.code === 'TOKEN_EXPIRED' || data.message.includes('expired');
        setVerificationState({
          status: isExpired ? 'expired' : 'error',
          message: data.message || 'Email verification failed',
          userEmail: data.email
        });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setVerificationState({
        status: 'error',
        message: 'Network error. Please try again.'
      });
    }
  };

  const handleResendVerification = async () => {
    if (!verificationState.userEmail && !email) {
      addToast('Unable to resend - email address not found', 'error');
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: verificationState.userEmail || email,
          userType
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast('Verification email sent successfully!', 'success');
        setResendCooldown(60); // 60 second cooldown
      } else {
        addToast(data.message || 'Failed to resend verification email', 'error');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationState.status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying Email
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we verify your email address...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {verificationState.message}
              </p>
              {verificationState.userEmail && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Verified email: <strong>{verificationState.userEmail}</strong>
                </p>
              )}
              
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Redirecting to login in 3 seconds...
                </div>
                
                <Link
                  to={userType === 'customer' ? '/customer/login' : '/biz/login'}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Continue to Login
                </Link>
              </div>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-yellow-600 dark:text-yellow-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verification Link Expired
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This verification link has expired. Email verification links are valid for 24 hours.
              </p>
              {verificationState.userEmail && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Email: <strong>{verificationState.userEmail}</strong>
                </p>
              )}
              
              <div className="space-y-4">
                <button
                  onClick={handleResendVerification}
                  disabled={isResending || resendCooldown > 0}
                  className="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? 'Sending...' : 
                   resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 
                   'Send New Verification Email'}
                </button>
                
                <Link
                  to={userType === 'customer' ? '/customer/login' : '/biz/login'}
                  className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        );

      case 'error':
      default:
        return (
          <div className="text-center">
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <XMarkIcon className="mx-auto h-12 w-12 text-red-600 dark:text-red-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {verificationState.message}
              </p>
              
              <div className="space-y-4">
                {(verificationState.userEmail || email) && (
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || resendCooldown > 0}
                    className="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    {isResending ? 'Sending...' : 
                     resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 
                     'Send New Verification Email'}
                  </button>
                )}
                
                <Link
                  to={userType === 'customer' ? '/customer/signup' : '/biz/signup'}
                  className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Create New Account
                </Link>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BusinessIcon className="h-10 w-10"/>
            <span className="ml-3 text-3xl font-bold tracking-wider text-gray-900 dark:text-gray-100">Reservio</span>
          </div>
        </div>

        {renderContent()}

        {/* Help Text */}
        <div className="text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p>Need help?</p>
            <div className="space-x-4">
              <Link
                to="/contact"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
              >
                Contact Support
              </Link>
              <span>•</span>
              <Link
                to="/help"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
              >
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;