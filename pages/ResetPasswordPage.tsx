import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BusinessIcon, EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '../components/Icons';
import { useToast } from '../contexts/ToastContext';

interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const ResetPasswordPage: React.FC = () => {
  const { token, userType } = useParams<{ token: string; userType: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [tokenUser, setTokenUser] = useState<{ email: string } | null>(null);

  const [criteria, setCriteria] = useState<PasswordCriteria>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  useEffect(() => {
    // Validate reset token on component mount
    validateResetToken();
  }, [token, userType]);

  useEffect(() => {
    // Update password criteria in real-time
    setCriteria({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password)
    });
  }, [password]);

  const validateResetToken = async () => {
    if (!token || !userType) {
      setIsValidToken(false);
      return;
    }

    try {
      const response = await fetch(`/api/auth/verify-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, userType }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsValidToken(true);
        setTokenUser(data.user);
      } else {
        setIsValidToken(false);
        addToast(data.message || 'Invalid or expired reset token', 'error');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setIsValidToken(false);
      addToast('Network error. Please try again.', 'error');
    }
  };

  const isPasswordValid = Object.values(criteria).every(Boolean);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      addToast('Please meet all password requirements', 'error');
      return;
    }

    if (!passwordsMatch) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userType,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast('Password reset successfully! Please log in with your new password.', 'success');
        
        // Redirect to appropriate login page
        const loginPath = userType === 'customer' ? '/customer/login' : '/biz/login';
        navigate(loginPath);
      } else {
        addToast(data.message || 'Failed to reset password', 'error');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Validating reset token...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-12 w-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BusinessIcon className="h-10 w-10"/>
            <span className="ml-3 text-3xl font-bold tracking-wider text-gray-900 dark:text-gray-100">Reservio</span>
          </div>
          
          <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <XMarkIcon className="mx-auto h-12 w-12 text-red-600 dark:text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This password reset link is invalid or has expired. Reset links expire after 1 hour for security.
            </p>
            
            <div className="space-y-4">
              <Link
                to="/forgot-password"
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Request New Reset Link
              </Link>
              
              <Link
                to={userType === 'customer' ? '/customer/login' : '/biz/login'}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Login
              </Link>
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
            Set New Password
          </h2>
          {tokenUser && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Setting new password for <strong>{tokenUser.email}</strong>
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Password Criteria */}
          {password && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Password Requirements:</h4>
              <div className="space-y-1">
                {Object.entries({
                  minLength: 'At least 8 characters',
                  hasUppercase: 'One uppercase letter',
                  hasLowercase: 'One lowercase letter',
                  hasNumber: 'One number',
                  hasSpecialChar: 'One special character (@$!%*?&)'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center">
                    {criteria[key as keyof PasswordCriteria] ? (
                      <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                    ) : (
                      <XMarkIcon className="h-4 w-4 text-gray-400 mr-2" />
                    )}
                    <span className={`text-sm ${criteria[key as keyof PasswordCriteria] 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`block w-full pr-10 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  confirmPassword && !passwordsMatch 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                )}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Passwords do not match
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to={userType === 'customer' ? '/customer/login' : '/biz/login'}
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

export default ResetPasswordPage;