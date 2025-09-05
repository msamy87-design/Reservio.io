import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import EnhancedLoginForm from '../components/EnhancedLoginForm';
import SocialLoginButtons from '../components/SocialLoginButtons';

const CustomerLoginPage: React.FC = () => {
  const { login } = useCustomerAuth();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    await login(email, password);
    // Navigation is handled by the CustomerAuthContext
  };

  const handleSocialSuccess = (user: any, token: string) => {
    // Handle social login success
    // Set user in context and navigate
    navigate('/customer/bookings');
  };

  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side - Login Form */}
        <div className="flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            <EnhancedLoginForm
              onSubmit={handleLogin}
              userType="customer"
            />
            
            {/* Social Login */}
            <SocialLoginButtons
              userType="customer"
              onSuccess={handleSocialSuccess}
            />
          </div>
        </div>

        {/* Right Side - Marketing Content */}
        <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white">
          <div className="max-w-md text-center">
            <h2 className="text-3xl font-bold mb-6">
              Welcome Back!
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Book your next appointment with just a few taps. Find the best salons, spas, and beauty professionals near you.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <p className="text-left">
                  <strong>Quick Booking</strong><br />
                  <span className="opacity-75">Book in seconds, not minutes</span>
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⭐</span>
                </div>
                <p className="text-left">
                  <strong>Verified Reviews</strong><br />
                  <span className="opacity-75">Real reviews from real customers</span>
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💳</span>
                </div>
                <p className="text-left">
                  <strong>Secure Payments</strong><br />
                  <span className="opacity-75">Your payment info is always safe</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoginPage;