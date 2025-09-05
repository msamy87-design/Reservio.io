import React, { useState, useEffect } from 'react';
import { QrCodeIcon, KeyIcon, CheckCircleIcon, XMarkIcon, DevicePhoneMobileIcon, ShieldCheckIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface TwoFactorSetupProps {
  userId: string;
  userType: 'admin' | 'business' | 'customer';
  isEnabled?: boolean;
  onSetupComplete?: (enabled: boolean) => void;
}

interface QRCodeData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  userId,
  userType,
  isEnabled = false,
  onSetupComplete
}) => {
  const [currentStep, setCurrentStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [method, setMethod] = useState<'app' | 'sms'>('app');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    if (isEnabled) {
      setCurrentStep('complete');
    }
  }, [isEnabled]);

  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ 
          userId,
          userType,
          method 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setQrData(data);
        setCurrentStep('verify');
      } else {
        addToast(data.message || 'Failed to generate 2FA setup', 'error');
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      addToast('Please enter a valid 6-digit code', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          userId,
          userType,
          code: verificationCode,
          secret: qrData?.secret
        })
      });

      const data = await response.json();

      if (response.ok) {
        addToast('2FA enabled successfully!', 'success');
        setCurrentStep('backup');
        onSetupComplete?.(true);
      } else {
        addToast(data.message || 'Invalid verification code', 'error');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const disable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ userId, userType })
      });

      if (response.ok) {
        addToast('2FA disabled successfully', 'info');
        setCurrentStep('setup');
        onSetupComplete?.(false);
      } else {
        const data = await response.json();
        addToast(data.message || 'Failed to disable 2FA', 'error');
      }
    } catch (error) {
      console.error('2FA disable error:', error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    if (!qrData?.backupCodes) return;

    const content = [
      'Reservio Two-Factor Authentication Backup Codes',
      '='.repeat(50),
      'Keep these codes safe and secure.',
      'Each code can only be used once.',
      '',
      ...qrData.backupCodes.map((code, index) => `${index + 1}. ${code}`),
      '',
      'Generated on: ' + new Date().toLocaleString()
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reservio-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Enable Two-Factor Authentication
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Add an extra layer of security to your account
        </p>
      </div>

      {/* Method Selection */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setMethod('app')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              method === 'app'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start">
              <DevicePhoneMobileIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mt-1 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Authenticator App
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use Google Authenticator, Authy, or similar app
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMethod('sms')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              method === 'sms'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start">
              <DevicePhoneMobileIcon className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  SMS Text Message
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Receive codes via text message
                </p>
              </div>
            </div>
          </button>
        </div>

        {method === 'sms' && (
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        )}
      </div>

      <button
        onClick={generateQRCode}
        disabled={isLoading || (method === 'sms' && !phoneNumber)}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Setting up...
          </>
        ) : (
          `Set up ${method === 'app' ? 'Authenticator App' : 'SMS'} 2FA`
        )}
      </button>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <QrCodeIcon className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          {method === 'app' ? 'Scan QR Code' : 'Verify Phone Number'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {method === 'app' 
            ? 'Scan this QR code with your authenticator app'
            : 'Enter the code sent to your phone'
          }
        </p>
      </div>

      {method === 'app' && qrData && (
        <>
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <img 
                src={qrData.qrCodeUrl} 
                alt="2FA QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>

          {/* Manual Entry Option */}
          <div className="text-center">
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
            >
              Can't scan? Enter code manually
            </button>
          </div>

          {showManualEntry && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Manual entry key:
              </p>
              <code className="block p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded text-sm font-mono break-all">
                {qrData.manualEntryKey}
              </code>
            </div>
          )}
        </>
      )}

      {/* Verification Code Input */}
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {method === 'app' ? 'Enter the 6-digit code from your app' : 'Enter the code from SMS'}
        </label>
        <input
          type="text"
          id="code"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          maxLength={6}
          className="block w-full px-3 py-3 text-center text-2xl font-mono border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white tracking-widest"
        />
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => setCurrentStep('setup')}
          className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back
        </button>
        <button
          onClick={verifyCode}
          disabled={isVerifying || verificationCode.length !== 6}
          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isVerifying ? 'Verifying...' : 'Verify & Enable'}
        </button>
      </div>
    </div>
  );

  const renderBackupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <KeyIcon className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Save Your Backup Codes
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Keep these backup codes safe. You can use them to access your account if you lose your device.
        </p>
      </div>

      {qrData?.backupCodes && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Important: Save these backup codes
              </h4>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Each code can only be used once. Store them in a secure place.
              </p>
            </div>
          </div>
        </div>
      )}

      {qrData?.backupCodes && (
        <>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {showBackupCodes ? (
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {qrData.backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded">
                    {index + 1}. {code}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <button
                  onClick={() => setShowBackupCodes(true)}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
                >
                  Click to reveal backup codes
                </button>
              </div>
            )}
          </div>

          {showBackupCodes && (
            <div className="flex space-x-4">
              <button
                onClick={downloadBackupCodes}
                className="flex-1 py-2 px-4 border border-indigo-600 dark:border-indigo-400 rounded-md shadow-sm text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Download Codes
              </button>
              <button
                onClick={() => setCurrentStep('complete')}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                I've Saved Them
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Two-Factor Authentication Enabled
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Your account is now protected with two-factor authentication
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center">
          <ShieldCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Enhanced security active
          </span>
        </div>
      </div>

      <button
        onClick={disable2FA}
        disabled={isLoading}
        className="w-full py-2 px-4 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
      >
        {isLoading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        {currentStep === 'setup' && renderSetupStep()}
        {currentStep === 'verify' && renderVerifyStep()}
        {currentStep === 'backup' && renderBackupStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </div>
    </div>
  );
};

export default TwoFactorSetup;