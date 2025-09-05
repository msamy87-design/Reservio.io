import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BusinessIcon, EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '../components/Icons';
import { useToast } from '../contexts/ToastContext';

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'business'>('business');
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      addToast('Please enter your email address', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual implementation
      const response = await fetch(`/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          userType 
        }),
      });

      const data: ForgotPasswordResponse = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        addToast('Password reset email sent successfully', 'success');
      } else {
        addToast(data.message || 'Failed to send reset email', 'error');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    try {
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BusinessIcon className="h-10 w-10"/>
              <span className="ml-3 text-3xl font-bold tracking-wider text-gray-900 dark:text-gray-100">Reservio</span>
            </div>
            
            <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                The link will expire in 1 hour for security reasons.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleResendEmail}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Resend email'}
                </button>
                
                <Link
                  to={userType === 'business' ? '/biz/login' : '/customer/login'}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BusinessIcon className="h-10 w-10"/>
            <span className="ml-3 text-3xl font-bold tracking-wider text-gray-900 dark:text-gray-100">Reservio</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* User Type Selection */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          <button
            type="button"
            onClick={() => setUserType('business')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              userType === 'business'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Business Account
          </button>
          <button
            type="button"
            onClick={() => setUserType('customer')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              userType === 'customer'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Customer Account
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Security Notice
                </h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  For your security, the reset link will expire in 1 hour. Check your spam folder if you don't see the email.
                </p>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to={userType === 'business' ? '/biz/login' : '/customer/login'}
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;