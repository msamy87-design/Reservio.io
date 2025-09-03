
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as ReactRouterDOM from 'react-router-dom';
import { Staff } from '../types';

const PAGE_PERMISSIONS: { [key: string]: Staff['role'][] } = {
  '/biz/dashboard': ['Owner', 'Manager', 'Assistant', 'Stylist'],
  '/biz/bookings': ['Owner', 'Manager', 'Assistant', 'Stylist'],
  '/biz/customers': ['Owner', 'Manager'],
  '/biz/staff': ['Owner', 'Manager'],
  '/biz/services': ['Owner', 'Manager'],
  '/biz/inventory': ['Owner', 'Manager'],
  '/biz/marketing': ['Owner', 'Manager'],
  '/biz/reviews': ['Owner', 'Manager'],
  '/biz/reports': ['Owner', 'Manager'],
  '/biz/developer/api-keys': ['Owner'],
  '/biz/settings': ['Owner'],
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = ReactRouterDOM.useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading your portal...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <ReactRouterDOM.Navigate to="/biz/login" state={{ from: location }} replace />;
  }

  // Role-Based Access Control Logic
  const currentPath = location.pathname;
  let isAllowed = false;

  // Find a matching route pattern, including dynamic ones like /customers/:id
  const matchedRoute = Object.keys(PAGE_PERMISSIONS).find(path => {
    const regex = new RegExp(`^${path.replace(/:\w+/g, '[^/]+')}(\/|$)`);
    return regex.test(currentPath);
  });

  if (matchedRoute) {
    const allowedRoles = PAGE_PERMISSIONS[matchedRoute];
    if (allowedRoles.includes(currentUser.role)) {
      isAllowed = true;
    }
  } else if (currentPath.startsWith('/biz/customers/')) { // Handle dynamic customer detail route
    if (PAGE_PERMISSIONS['/biz/customers'].includes(currentUser.role)) {
      isAllowed = true;
    }
  }


  if (!isAllowed) {
    // If not allowed, redirect to a safe page (dashboard)
    // This prevents users from accessing URLs they shouldn't
    return <ReactRouterDOM.Navigate to="/biz/dashboard" state={{ from: location }} replace />;
  }


  return <>{children}</>;
};

export default ProtectedRoute;