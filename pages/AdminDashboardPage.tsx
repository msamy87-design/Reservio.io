
import React, { useState, useEffect } from 'react';
import { fetchStats } from '../services/adminApi';
import { PlatformStats } from '../types';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const StatCard: React.FC<{ title: string; value: string | number; isLoading: boolean }> = ({ title, value, isLoading }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
    {isLoading ? (
      <div className="mt-2 h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    ) : (
      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{value}</p>
    )}
  </div>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const AdminDashboardPage: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!adminToken) return;
      setIsLoading(true);
      try {
        const data = await fetchStats(adminToken);
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch platform stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, [adminToken]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">High-level overview of the Reservio platform.</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue (Platform)" value={stats ? formatCurrency(stats.total_revenue) : '...'} isLoading={isLoading} />
        <StatCard title="Total Businesses" value={stats ? stats.total_businesses : '...'} isLoading={isLoading} />
        <StatCard title="Total Customers" value={stats ? stats.total_customers : '...'} isLoading={isLoading} />
        <StatCard title="Total Bookings" value={stats ? stats.total_bookings : '...'} isLoading={isLoading} />
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Platform Health</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Additional charts and reports will be displayed here.</p>
        {/* Placeholder for future charts */}
        <div className="mt-4 h-64 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Chart Area</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
