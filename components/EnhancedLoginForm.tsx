import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BusinessIcon, EyeIcon, EyeSlashIcon, DevicePhoneMobileIcon, ExclamationTriangleIcon } from './Icons';

interface EnhancedLoginFormProps {
  onSubmit: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  userType: 'customer' | 'business';
  isSubmitting?: boolean;
  error?: string | null;
}

interface LoginAttempt {
  count: number;
  lastAttempt: number;
}

const EnhancedLoginForm: React.FC<EnhancedLoginFormProps> = ({
  onSubmit,
  userType,
  isSubmitting = false,
  error = null
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt>({ count: 0, lastAttempt: 0 });
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);
  const [showBiometric, setShowBiometric] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus email input on mount
    emailRef.current?.focus();

    // Load saved email if remember me was enabled
    const savedEmail = localStorage.getItem(`reservio_${userType}_remember_email`);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      // Focus password if email is pre-filled
      setTimeout(() => passwordRef.current?.focus(), 100);
    }

    // Check for biometric availability
    checkBiometricSupport();

    // Load login attempts from localStorage
    const attempts = localStorage.getItem(`reservio_${userType}_login_attempts`);
    if (attempts) {
      const parsedAttempts = JSON.parse(attempts) as LoginAttempt;
      setLoginAttempts(parsedAttempts);
      
      // Check if user is still blocked (5 attempts, 15-minute block)
      const timeSinceLastAttempt = Date.now() - parsedAttempts.lastAttempt;
      const blockDuration = 15 * 60 * 1000; // 15 minutes
      
      if (parsedAttempts.count >= 5 && timeSinceLastAttempt < blockDuration) {
        setIsBlocked(true);
        setBlockTimeLeft(Math.ceil((blockDuration - timeSinceLastAttempt) / 1000));
      }
    }
  }, [userType]);

  useEffect(() => {
    // Block timer countdown
    let interval: NodeJS.Timeout;
    if (blockTimeLeft > 0) {
      interval = setInterval(() => {
        setBlockTimeLeft(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            // Reset login attempts after block expires
            localStorage.removeItem(`reservio_${userType}_login_attempts`);
            setLoginAttempts({ count: 0, lastAttempt: 0 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [blockTimeLeft, userType]);

  const checkBiometricSupport = async () => {
    // Check if biometric authentication is available
    if ('credentials' in navigator && 'create' in navigator.credentials) {
      try {
        // Check if WebAuthn is supported and user has registered
        const savedCredentials = localStorage.getItem(`reservio_${userType}_webauthn`);
        if (savedCredentials) {
          setShowBiometric(true);
        }
      } catch (error) {
        console.log('Biometric not available:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      return;
    }

    const currentTime = Date.now();
    
    try {
      await onSubmit(email, password, rememberMe);
      
      // Success - reset login attempts and save email if remember me is checked
      localStorage.removeItem(`reservio_${userType}_login_attempts`);
      setLoginAttempts({ count: 0, lastAttempt: 0 });
      
      if (rememberMe) {
        localStorage.setItem(`reservio_${userType}_remember_email`, email);
      } else {
        localStorage.removeItem(`reservio_${userType}_remember_email`);
      }
      
    } catch (error) {
      // Failed login - increment attempts
      const newAttempts = {
        count: loginAttempts.count + 1,
        lastAttempt: currentTime
      };
      
      setLoginAttempts(newAttempts);
      localStorage.setItem(`reservio_${userType}_login_attempts`, JSON.stringify(newAttempts));
      
      // Block user after 5 failed attempts
      if (newAttempts.count >= 5) {
        setIsBlocked(true);
        setBlockTimeLeft(15 * 60); // 15 minutes
      }
    }
  };

  const handleBiometricLogin = async () => {
    try {
      // Simulate biometric authentication
      // In real implementation, use WebAuthn API
      const result = await new Promise((resolve) => {
        setTimeout(() => resolve(true), 1000);
      });
      
      if (result) {
        // Get saved credentials for biometric user
        const savedCredentials = localStorage.getItem(`reservio_${userType}_webauthn`);
        if (savedCredentials) {
          const { email: savedEmail } = JSON.parse(savedCredentials);
          await onSubmit(savedEmail, '', false); // Password not needed for biometric
        }
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to submit
    if (e.key === 'Enter' && !isSubmitting && !isBlocked) {
      handleSubmit(e as any);
    }
    
    // Tab navigation enhancement
    if (e.key === 'Tab' && e.target === emailRef.current) {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };

  const formatBlockTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTitle = () => {
    return userType === 'business' ? 'Business Login' : 'Customer Login';
  };

  const getSignupLink = () => {
    return userType === 'business' ? '/biz/signup' : '/customer/signup';
  };

  const getSignupText = () => {
    return userType === 'business' ? 'create a business account' : 'create a customer account';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BusinessIcon className="h-10 w-10"/>
            <span className="ml-3 text-3xl font-bold tracking-wider text-gray-900 dark:text-gray-100">Reservio</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {getTitle()}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link to={getSignupLink()} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
              {getSignupText()}
            </Link>
          </p>
        </div>

        {/* Account Blocked Warning */}
        {isBlocked && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Account Temporarily Locked
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  Too many failed login attempts. Try again in {formatBlockTime(blockTimeLeft)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !isBlocked && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
            {loginAttempts.count > 0 && loginAttempts.count < 5 && (
              <p className="text-xs text-red-500 dark:text-red-400 text-center mt-1">
                {5 - loginAttempts.count} attempts remaining before temporary lock
              </p>
            )}
          </div>
        )}

        {/* Biometric Login Option */}
        {showBiometric && !isBlocked && (
          <div className="text-center">
            <button
              onClick={handleBiometricLogin}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-indigo-300 dark:border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-50 transition-colors"
            >
              <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
              Use Biometric Login
            </button>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              or sign in with your password below
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isBlocked}
                className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isBlocked}
                  className="block w-full px-3 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isBlocked}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isBlocked}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || isBlocked}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : isBlocked ? (
                `Locked - Try again in ${formatBlockTime(blockTimeLeft)}`
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Additional Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              to={getSignupLink()}
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            >
              Sign up now
            </Link>
          </p>
          
          {userType === 'business' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Looking for customer login?{' '}
              <Link
                to="/customer/login"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
              >
                Click here
              </Link>
            </p>
          )}
          
          {userType === 'customer' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Business owner?{' '}
              <Link
                to="/biz/login"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
              >
                Business login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginForm;