import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { CalendarIcon, UsersIcon, TagIcon, StarIcon, LightBulbIcon, CurrencyDollarIcon, SquaresPlusIcon } from '../components/Icons';
import { AIGrowthInsight } from '../types';
import { fetchAIGrowthInsights } from '../services/api';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; isLoading: boolean }> = ({ title, value, icon, isLoading }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
      {isLoading ? (
         <div className="mt-1 h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      ) : (
         <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      )}
    </div>
  </div>
);

const InsightCard: React.FC<{ insight: AIGrowthInsight }> = ({ insight }) => {
    const Icon = {
        pricing: CurrencyDollarIcon,
        bundling: SquaresPlusIcon,
    }[insight.type] || LightBulbIcon;

    return (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg flex items-start gap-4">
            <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
                <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-200">{insight.title}</h4>
                <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80">{insight.description}</p>
            </div>
        </div>
    );
};


const DashboardPage: React.FC = () => {
    const { bookings, customers, services, reviews, loading } = useData();
    const [insights, setInsights] = useState<AIGrowthInsight[]>([]);
    const [insightsLoading, setInsightsLoading] = useState(true);

    useEffect(() => {
        const loadInsights = async () => {
            setInsightsLoading(true);
            try {
                const fetchedInsights = await fetchAIGrowthInsights();
                setInsights(fetchedInsights);
            } catch (error) {
                console.error("Failed to fetch AI insights:", error);
            } finally {
                setInsightsLoading(false);
            }
        };
        loadInsights();
    }, []);

    const stats = useMemo(() => {
        const upcomingBookings = bookings.filter(b => new Date(b.start_at) >= new Date() && b.status === 'confirmed');
        const pendingReviews = reviews.filter(r => r.status === 'Pending');
        
        return {
            upcomingCount: upcomingBookings.length,
            totalCustomers: customers.length,
            totalServices: services.length,
            pendingReviews: pendingReviews.length
        };
    }, [bookings, customers, services, reviews]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome back! Here's a quick overview of your business.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Upcoming Bookings" value={stats.upcomingCount} icon={<CalendarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400"/>} isLoading={loading} />
            <StatCard title="Total Customers" value={stats.totalCustomers} icon={<UsersIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400"/>} isLoading={loading} />
            <StatCard title="Services Offered" value={stats.totalServices} icon={<TagIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400"/>} isLoading={loading} />
            <StatCard title="Pending Reviews" value={stats.pendingReviews} icon={<StarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400"/>} isLoading={loading} />
        </div>
        
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
                 <LightBulbIcon className="h-6 w-6 text-yellow-500" />
                 <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">AI Growth Insights</h3>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Actionable advice powered by AI to help you grow your revenue.</p>
            <div className="mt-4 space-y-3">
                {insightsLoading ? (
                    <div className="space-y-3">
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                    </div>
                ) : insights.length > 0 ? (
                    insights.map(insight => <InsightCard key={insight.id} insight={insight} />)
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No new insights right now. Check back later!</p>
                )}
            </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Revenue Overview</h3>
                <div className="mt-4 h-64 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">Revenue chart coming soon</p>
                </div>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Upcoming Appointments</h3>
                 <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                    {loading ? <p>Loading...</p> : 
                        bookings.filter(b => new Date(b.start_at) >= new Date() && b.status === 'confirmed').slice(0, 5).map(booking => (
                            <div key={booking.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{booking.customer.full_name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(booking.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300">{booking.service.name} with {booking.staff.full_name}</p>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>

    </div>
  );
};

export default DashboardPage;
