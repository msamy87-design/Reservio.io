
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentAdmin, loading } = useAdminAuth();
  const location = ReactRouterDOM.useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading Admin Portal...</div>
      </div>
    );
  }

  if (!currentAdmin) {
    return <ReactRouterDOM.Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
