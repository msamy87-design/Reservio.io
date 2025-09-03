
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { DashboardIcon, BusinessIcon, UsersIcon, ArrowRightOnRectangleIcon, ShieldCheckIcon } from './Icons';
import ToastContainer from './ToastContainer';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <ReactRouterDOM.NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-red-600 text-white shadow-md'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`
    }
  >
    {icon}
    <span className="ml-4">{label}</span>
  </ReactRouterDOM.NavLink>
);

const navConfig = [
    { to: '/admin/dashboard', icon: DashboardIcon, label: 'Dashboard' },
    { to: '/admin/businesses', icon: BusinessIcon, label: 'Businesses' },
    // { to: '/admin/users', icon: UsersIcon, label: 'Users' }, // Future enhancement
];

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentAdmin, logout } = useAdminAuth();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <aside className="w-64 flex-shrink-0 bg-gray-800 dark:bg-gray-900 text-white flex flex-col border-r border-gray-700">
        <div className="h-16 flex items-center justify-center px-4 border-b border-gray-700">
          <ShieldCheckIcon className="h-8 w-8 text-red-400" />
          <span className="ml-2 text-xl font-bold tracking-wider">Admin</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navConfig.map(item => (
              <NavItem key={item.to} to={item.to} icon={<item.icon className="h-5 w-5" />} label={item.label} />
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Platform Management</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{currentAdmin?.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentAdmin?.email}</p>
            </div>
            <button
                onClick={logout}
                title="Logout"
                className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/95">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AdminLayout;
