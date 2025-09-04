import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, KeyIcon, SettingsIcon, BusinessIcon, UsersIcon, CalendarIcon, TagIcon, BriefcaseIcon, ChartBarIcon, UserCircleIcon, ArrowRightOnRectangleIcon, MegaphoneIcon, StarIcon, ArchiveBoxIcon, SunIcon, MoonIcon, ComputerDesktopIcon, CheckIcon, ShoppingCartIcon, ClipboardDocumentListIcon } from './Icons';
import ToastContainer from './ToastContainer';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Staff } from '../types';
import StandalonePosModal from './StandalonePosModal';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-indigo-600 text-white shadow-md'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`
    }
  >
    {icon}
    <span className="ml-4">{label}</span>
  </NavLink>
);

const navConfig: { to: string; icon: React.FC<any>; label: string; roles: Staff['role'][] }[] = [
    { to: '/biz/dashboard', icon: DashboardIcon, label: 'Dashboard', roles: ['Owner', 'Manager', 'Assistant', 'Stylist'] },
    { to: '/biz/bookings', icon: CalendarIcon, label: 'Bookings', roles: ['Owner', 'Manager', 'Assistant', 'Stylist'] },
    { to: '/biz/customers', icon: UsersIcon, label: 'Customers', roles: ['Owner', 'Manager'] },
    { to: '/biz/staff', icon: BriefcaseIcon, label: 'Staff', roles: ['Owner', 'Manager'] },
    { to: '/biz/services', icon: TagIcon, label: 'Services', roles: ['Owner', 'Manager'] },
    { to: '/biz/inventory', icon: ArchiveBoxIcon, label: 'Inventory', roles: ['Owner', 'Manager'] },
    { to: '/biz/marketing', icon: MegaphoneIcon, label: 'Marketing', roles: ['Owner', 'Manager'] },
    { to: '/biz/reviews', icon: StarIcon, label: 'Reviews', roles: ['Owner', 'Manager'] },
    { to: '/biz/waitlist', icon: ClipboardDocumentListIcon, label: 'Waitlist', roles: ['Owner', 'Manager'] },
    { to: '/biz/reports', icon: ChartBarIcon, label: 'Reports', roles: ['Owner', 'Manager'] },
];

const developerNavConfig = [
    { to: '/biz/developer/api-keys', icon: KeyIcon, label: 'API Keys', roles: ['Owner'] }
];

const settingsNavConfig = [
    { to: '/biz/settings', icon: SettingsIcon, label: 'Settings', roles: ['Owner'] }
];


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const userRole = currentUser?.role;

  const visibleNavItems = navConfig.filter(item => userRole && item.roles.includes(userRole));
  const visibleDeveloperItems = developerNavConfig.filter(item => userRole && item.roles.includes(userRole));
  const visibleSettingsItems = settingsNavConfig.filter(item => userRole && item.roles.includes(userRole));

  return (
    <>
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-800 dark:bg-gray-900 text-white flex flex-col border-r border-gray-700">
        <div className="h-16 flex items-center justify-center px-4 border-b border-gray-700">
          <BusinessIcon className="h-8 w-8 text-indigo-400" />
          <span className="ml-2 text-xl font-bold tracking-wider">Reservio</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {visibleNavItems.map(item => (
              <NavItem key={item.to} to={item.to} icon={<item.icon className="h-5 w-5" />} label={item.label} />
          ))}
          
          {visibleDeveloperItems.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-700">
                <h3 className="px-4 text-xs font-semibold uppercase text-gray-500 tracking-wider">Developer</h3>
                <div className="mt-2 space-y-2">
                    {visibleDeveloperItems.map(item => (
                        <NavItem key={item.to} to={item.to} icon={<item.icon className="h-5 w-5" />} label={item.label} />
                    ))}
                </div>
            </div>
          )}
        </nav>
        {visibleSettingsItems.length > 0 && (
            <div className="px-4 py-4 border-t border-gray-700">
                {visibleSettingsItems.map(item => (
                    <NavItem key={item.to} to={item.to} icon={<item.icon className="h-5 w-5" />} label={item.label} />
                ))}
            </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Business Portal</h1>
          <div className="flex items-center gap-4">
            <button
                onClick={() => setIsPosModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <ShoppingCartIcon className="h-5 w-5" />
                <span className="hidden sm:inline">POS</span>
            </button>
            <div className="relative" ref={profileMenuRef}>
                <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-9 h-9 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                >
                {currentUser?.businessName.charAt(0).toUpperCase()}
                </button>
                {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{currentUser?.businessName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
                    </div>
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <div className="px-4 pt-3 pb-1">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Theme</p>
                        </div>
                        <div className="py-1">
                        <button onClick={() => setTheme('light')} className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <span className="flex items-center"><SunIcon className="mr-3 h-5 w-5" /> Light</span>
                            {theme === 'light' && <CheckIcon className="h-5 w-5 text-indigo-600" />}
                        </button>
                        <button onClick={() => setTheme('dark')} className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <span className="flex items-center"><MoonIcon className="mr-3 h-5 w-5" /> Dark</span>
                            {theme === 'dark' && <CheckIcon className="h-5 w-5 text-indigo-600" />}
                        </button>
                        <button onClick={() => setTheme('system')} className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <span className="flex items-center"><ComputerDesktopIcon className="mr-3 h-5 w-5" /> System</span>
                            {theme === 'system' && <CheckIcon className="h-5 w-5 text-indigo-600" />}
                        </button>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Logout
                    </button>
                    </div>
                </div>
                )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/95">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
    <StandalonePosModal isOpen={isPosModalOpen} onClose={() => setIsPosModalOpen(false)} />
    </>
  );
};

export default Layout;