import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import EnhancedLoginForm from '../components/EnhancedLoginForm';
import SocialLoginButtons from '../components/SocialLoginButtons';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    await login(email, password);
    // Navigation is handled by the AuthContext
  };

  const handleSocialSuccess = (user: any, token: string) => {
    // Handle social login success for business users
    navigate('/biz/bookings');
  };

  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side - Login Form */}
        <div className="flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            <EnhancedLoginForm
              onSubmit={handleLogin}
              userType="business"
            />
            
            {/* Social Login */}
            <SocialLoginButtons
              userType="business"
              onSuccess={handleSocialSuccess}
            />
          </div>
        </div>

        {/* Right Side - Marketing Content */}
        <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 p-8 text-white">
          <div className="max-w-md text-center">
            <h2 className="text-3xl font-bold mb-6">
              Grow Your Business
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of beauty professionals who trust Reservio to manage their bookings and grow their client base.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
                <p className="text-left">
                  <strong>Smart Scheduling</strong><br />
                  <span className="opacity-75">Automated booking management</span>
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-left">
                  <strong>Increase Revenue</strong><br />
                  <span className="opacity-75">25% average revenue growth</span>
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <p className="text-left">
                  <strong>Mobile Ready</strong><br />
                  <span className="opacity-75">Manage from anywhere</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;