import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartBarIcon, ClockIcon, StarIcon, TrendingUpIcon, BoltIcon, CheckBadgeIcon, EyeIcon, UserGroupIcon, CalendarIcon, CurrencyDollarIcon } from './Icons';

interface QualityIndicator {
    id: string;
    business_id: string;
    business_name: string;
    response_time_minutes: number;
    booking_success_rate: number;
    cancellation_rate: number;
    on_time_rate: number;
    customer_satisfaction: number;
    total_bookings: number;
    repeat_customer_rate: number;
    quality_score: number;
    badges: string[];
    trending_direction: 'up' | 'down' | 'stable';
}

interface BookingTrend {
    id: string;
    service_name: string;
    business_count: number;
    weekly_bookings: number;
    growth_rate: number;
    peak_hours: string[];
    average_price: number;
    satisfaction_rate: number;
    availability_score: number;
}

interface RealTimeMetric {
    id: string;
    metric_name: string;
    current_value: number;
    previous_value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    description: string;
}

const mockQualityIndicators: QualityIndicator[] = [
    {
        id: '1',
        business_id: '1',
        business_name: 'Elite Hair Studio',
        response_time_minutes: 8,
        booking_success_rate: 95,
        cancellation_rate: 3,
        on_time_rate: 97,
        customer_satisfaction: 4.9,
        total_bookings: 1247,
        repeat_customer_rate: 78,
        quality_score: 98,
        badges: ['Top Performer', 'Quick Response', 'Punctual'],
        trending_direction: 'up'
    },
    {
        id: '2',
        business_id: '2',
        business_name: 'Serenity Day Spa',
        response_time_minutes: 12,
        booking_success_rate: 92,
        cancellation_rate: 5,
        on_time_rate: 94,
        customer_satisfaction: 4.8,
        total_bookings: 856,
        repeat_customer_rate: 85,
        quality_score: 94,
        badges: ['Customer Favorite', 'Reliable'],
        trending_direction: 'up'
    },
    {
        id: '3',
        business_id: '3',
        business_name: 'Perfect Nails Boutique',
        response_time_minutes: 15,
        booking_success_rate: 88,
        cancellation_rate: 7,
        on_time_rate: 91,
        customer_satisfaction: 4.7,
        total_bookings: 634,
        repeat_customer_rate: 72,
        quality_score: 89,
        badges: ['Rising Star'],
        trending_direction: 'stable'
    }
];

const mockBookingTrends: BookingTrend[] = [
    {
        id: '1',
        service_name: 'Deep Tissue Massage',
        business_count: 45,
        weekly_bookings: 312,
        growth_rate: 23,
        peak_hours: ['10:00 AM', '2:00 PM', '6:00 PM'],
        average_price: 120,
        satisfaction_rate: 94,
        availability_score: 78
    },
    {
        id: '2',
        service_name: 'Balayage Hair Color',
        business_count: 38,
        weekly_bookings: 278,
        growth_rate: 18,
        peak_hours: ['11:00 AM', '3:00 PM', '7:00 PM'],
        average_price: 180,
        satisfaction_rate: 96,
        availability_score: 65
    },
    {
        id: '3',
        service_name: 'Gel Manicure',
        business_count: 52,
        weekly_bookings: 445,
        growth_rate: 15,
        peak_hours: ['12:00 PM', '4:00 PM', '8:00 PM'],
        average_price: 45,
        satisfaction_rate: 91,
        availability_score: 82
    }
];

const mockRealTimeMetrics: RealTimeMetric[] = [
    {
        id: '1',
        metric_name: 'Active Bookings',
        current_value: 1247,
        previous_value: 1156,
        unit: '',
        trend: 'up',
        icon: CalendarIcon,
        color: 'text-blue-600',
        description: 'Bookings made in the last 24 hours'
    },
    {
        id: '2',
        metric_name: 'Average Response',
        current_value: 11,
        previous_value: 14,
        unit: 'min',
        trend: 'up',
        icon: ClockIcon,
        color: 'text-green-600',
        description: 'Average business response time'
    },
    {
        id: '3',
        metric_name: 'Customer Satisfaction',
        current_value: 4.8,
        previous_value: 4.7,
        unit: '/5',
        trend: 'up',
        icon: StarIcon,
        color: 'text-yellow-600',
        description: 'Platform-wide satisfaction rating'
    },
    {
        id: '4',
        metric_name: 'Revenue Generated',
        current_value: 156000,
        previous_value: 142000,
        unit: '$',
        trend: 'up',
        icon: CurrencyDollarIcon,
        color: 'text-purple-600',
        description: 'Total revenue in the last week'
    }
];

interface QualityIndicatorCardProps {
    indicator: QualityIndicator;
    onViewBusiness: (businessId: string) => void;
}

const QualityIndicatorCard: React.FC<QualityIndicatorCardProps> = ({ indicator, onViewBusiness }) => {
    const getScoreColor = (score: number) => {
        if (score >= 95) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50';
        if (score >= 85) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50';
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50';
    };

    const getTrendIcon = () => {
        switch (indicator.trending_direction) {
            case 'up': return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
            case 'down': return <TrendingUpIcon className="h-4 w-4 text-red-500 transform rotate-180" />;
            default: return <div className="w-4 h-1 bg-gray-400 rounded"></div>;
        }
    };

    return (
        <div 
            onClick={() => onViewBusiness(indicator.business_id)}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        {indicator.business_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(indicator.quality_score)}`}>
                            Quality Score: {indicator.quality_score}%
                        </div>
                        {getTrendIcon()}
                    </div>
                </div>
                
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    {indicator.total_bookings.toLocaleString()} bookings
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {indicator.response_time_minutes}m
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Response Time
                    </div>
                </div>
                
                <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {indicator.on_time_rate}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        On-Time Rate
                    </div>
                </div>
                
                <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {indicator.customer_satisfaction}★
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Satisfaction
                    </div>
                </div>
                
                <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {indicator.repeat_customer_rate}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Repeat Customers
                    </div>
                </div>
            </div>

            {/* Badges */}
            {indicator.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {indicator.badges.map((badge, index) => (
                        <span key={index} className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-full">
                            {badge}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

interface BookingTrendCardProps {
    trend: BookingTrend;
    onExplore: (serviceName: string) => void;
}

const BookingTrendCard: React.FC<BookingTrendCardProps> = ({ trend, onExplore }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
            <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                    {trend.service_name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trend.business_count} businesses offering
                </p>
            </div>
            
            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                <TrendingUpIcon className="h-3 w-3" />
                +{trend.growth_rate}%
            </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-sm mb-3">
            <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">{trend.weekly_bookings}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">This Week</div>
            </div>
            <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">${trend.average_price}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Price</div>
            </div>
            <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">{trend.satisfaction_rate}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Satisfaction</div>
            </div>
        </div>
        
        <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
                Peak: {trend.peak_hours.slice(0, 2).join(', ')}
            </div>
            <button 
                onClick={() => onExplore(trend.service_name)}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
            >
                Explore →
            </button>
        </div>
    </div>
);

interface RealTimeMetricCardProps {
    metric: RealTimeMetric;
}

const RealTimeMetricCard: React.FC<RealTimeMetricCardProps> = ({ metric }) => {
    const getTrendIndicator = () => {
        const percentChange = ((metric.current_value - metric.previous_value) / metric.previous_value * 100);
        const isPositive = metric.trend === 'up';
        
        return (
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <TrendingUpIcon className={`h-4 w-4 ${!isPositive ? 'rotate-180' : ''}`} />
                <span>{Math.abs(percentChange).toFixed(1)}%</span>
            </div>
        );
    };

    const formatValue = (value: number, unit: string) => {
        if (unit === '$') {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `${value.toLocaleString()}${unit}`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700`}>
                    <metric.icon className={`h-6 w-6 ${metric.color} dark:${metric.color.replace('text-', 'text-')}`} />
                </div>
                {getTrendIndicator()}
            </div>
            
            <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatValue(metric.current_value, metric.unit)}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {metric.metric_name}
                </div>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {metric.description}
            </p>
        </div>
    );
};

const BusinessInsights: React.FC = () => {
    const [qualityIndicators] = useState<QualityIndicator[]>(mockQualityIndicators);
    const [bookingTrends] = useState<BookingTrend[]>(mockBookingTrends);
    const [realTimeMetrics] = useState<RealTimeMetric[]>(mockRealTimeMetrics);
    const [isLiveUpdate, setIsLiveUpdate] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (isLiveUpdate) {
            const interval = setInterval(() => {
                // Simulate real-time updates (in real app, this would fetch fresh data)
                console.log('Real-time metrics updated');
            }, 30000); // Update every 30 seconds

            return () => clearInterval(interval);
        }
    }, [isLiveUpdate]);

    const handleViewBusiness = (businessId: string) => {
        navigate(`/business/${businessId}`);
    };

    const handleExploreService = (serviceName: string) => {
        const params = new URLSearchParams();
        params.append('service', serviceName);
        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <ChartBarIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Business Insights
                        </h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
                        Real-time quality metrics and booking trends to help you make informed decisions
                    </p>
                    
                    <div className="flex items-center justify-center gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                            isLiveUpdate 
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${
                                isLiveUpdate ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                            }`}></div>
                            {isLiveUpdate ? 'Live Updates' : 'Static Data'}
                        </div>
                        <button
                            onClick={() => setIsLiveUpdate(!isLiveUpdate)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
                        >
                            {isLiveUpdate ? 'Pause' : 'Resume'}
                        </button>
                    </div>
                </div>

                {/* Real-Time Metrics */}
                <div className="mb-16">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <BoltIcon className="h-6 w-6 text-yellow-500" />
                        Real-Time Platform Metrics
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {realTimeMetrics.map(metric => (
                            <RealTimeMetricCard key={metric.id} metric={metric} />
                        ))}
                    </div>
                </div>

                {/* Quality Indicators */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckBadgeIcon className="h-6 w-6 text-green-500" />
                            Quality Leaders
                        </h3>
                        <button 
                            onClick={() => navigate('/businesses')}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                        >
                            View All →
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {qualityIndicators.map(indicator => (
                            <QualityIndicatorCard 
                                key={indicator.id}
                                indicator={indicator}
                                onViewBusiness={handleViewBusiness}
                            />
                        ))}
                    </div>
                </div>

                {/* Booking Trends */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUpIcon className="h-6 w-6 text-blue-500" />
                            Trending Services
                        </h3>
                        <button 
                            onClick={() => navigate('/trends')}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                        >
                            See All Trends →
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookingTrends.map(trend => (
                            <BookingTrendCard 
                                key={trend.id}
                                trend={trend}
                                onExplore={handleExploreService}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessInsights;