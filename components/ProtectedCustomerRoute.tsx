
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';

const ProtectedCustomerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentCustomer, loading } = useCustomerAuth();
  const location = ReactRouterDOM.useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!currentCustomer) {
    return <ReactRouterDOM.Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedCustomerRoute;
