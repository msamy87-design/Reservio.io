import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingService, SeasonalHighlight, SeasonType } from '../types';
import { TrendingUpIcon, FireIcon, BoltIcon, ScissorsIcon, SparklesIcon, PaintBrushIcon, EyeIcon } from './Icons';

// Mock data for trending services
const getCurrentSeason = (): SeasonType => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
};

const mockTrendingServices: TrendingService[] = [
    {
        id: '1',
        name: 'Balayage Hair Color',
        icon: ScissorsIcon,
        query: 'balayage',
        booking_count: 1250,
        growth_percentage: 35,
        average_price: 180,
        average_duration: 150,
        popular_times: ['10:00 AM', '2:00 PM', '4:00 PM'],
        trending_period: 'week'
    },
    {
        id: '2',
        name: 'Gel Manicure',
        icon: PaintBrushIcon,
        query: 'gel manicure',
        booking_count: 980,
        growth_percentage: 28,
        average_price: 45,
        average_duration: 60,
        popular_times: ['11:00 AM', '1:00 PM', '6:00 PM'],
        trending_period: 'week'
    },
    {
        id: '3',
        name: 'Deep Tissue Massage',
        icon: SparklesIcon,
        query: 'deep tissue massage',
        booking_count: 720,
        growth_percentage: 42,
        average_price: 120,
        average_duration: 90,
        popular_times: ['9:00 AM', '3:00 PM', '7:00 PM'],
        trending_period: 'month'
    },
    {
        id: '4',
        name: 'Beard Trim & Style',
        icon: ScissorsIcon,
        query: 'beard trim',
        booking_count: 650,
        growth_percentage: 18,
        average_price: 35,
        average_duration: 30,
        popular_times: ['8:00 AM', '12:00 PM', '5:00 PM'],
        trending_period: 'week'
    }
];

const mockSeasonalHighlights: SeasonalHighlight[] = [
    {
        id: '1',
        title: 'Winter Skin Revival',
        description: 'Combat dry winter skin with our hydrating facial packages',
        services: ['Hydrating Facial', 'Winter Skin Treatment', 'Moisture Therapy'],
        image_url: '/images/winter-facial.jpg',
        season: 'winter',
        discount_percentage: 20,
        cta_text: 'Book Winter Treatment',
        cta_link: '/search?service=facial'
    },
    {
        id: '2',
        title: 'Holiday Glam Ready',
        description: 'Get party-ready with our holiday beauty packages',
        services: ['Holiday Makeup', 'Hair Styling', 'Manicure'],
        image_url: '/images/holiday-glam.jpg',
        season: 'winter',
        discount_percentage: 15,
        cta_text: 'Book Holiday Package',
        cta_link: '/search?service=holiday makeup'
    }
];

interface TrendingServiceCardProps {
    service: TrendingService;
    onClick: (query: string) => void;
}

const TrendingServiceCard: React.FC<TrendingServiceCardProps> = ({ service, onClick }) => (
    <div 
        onClick={() => onClick(service.query)}
        className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
    >
        {/* Trending Badge */}
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <FireIcon className="h-3 w-3" />
            <span className="font-semibold">+{service.growth_percentage}%</span>
        </div>

        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <service.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 group-hover:text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {service.name}
                </h3>
                
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <EyeIcon className="h-4 w-4" />
                        <span>{service.booking_count.toLocaleString()} bookings</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <span className="font-medium">${service.average_price}</span>
                        <span>avg</span>
                    </div>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-1">
                    {service.popular_times.slice(0, 3).map((time, index) => (
                        <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                            {time}
                        </span>
                    ))}
                </div>
            </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUpIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Trending {service.trending_period}</span>
            </div>
            
            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm">
                Book Now →
            </button>
        </div>
    </div>
);

interface SeasonalHighlightCardProps {
    highlight: SeasonalHighlight;
    onClick: (link: string) => void;
}

const SeasonalHighlightCard: React.FC<SeasonalHighlightCardProps> = ({ highlight, onClick }) => (
    <div 
        onClick={() => onClick(highlight.cta_link)}
        className="group relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300"
    >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full translate-y-6 -translate-x-6"></div>
        </div>
        
        <div className="relative z-10">
            {highlight.discount_percentage && (
                <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold mb-3">
                    <BoltIcon className="h-4 w-4" />
                    {highlight.discount_percentage}% OFF
                </div>
            )}
            
            <h3 className="text-xl font-bold mb-2">{highlight.title}</h3>
            <p className="text-indigo-100 mb-4 text-sm">{highlight.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
                {highlight.services.slice(0, 2).map((service, index) => (
                    <span key={index} className="text-xs bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                        {service}
                    </span>
                ))}
                {highlight.services.length > 2 && (
                    <span className="text-xs text-indigo-200">
                        +{highlight.services.length - 2} more
                    </span>
                )}
            </div>
            
            <button className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors">
                {highlight.cta_text}
            </button>
        </div>
    </div>
);

const TrendingServices: React.FC = () => {
    const navigate = useNavigate();
    const [currentSeason] = useState<SeasonType>(getCurrentSeason());
    const [trendingServices] = useState<TrendingService[]>(mockTrendingServices);
    const [seasonalHighlights] = useState<SeasonalHighlight[]>(
        mockSeasonalHighlights.filter(h => h.season === currentSeason)
    );

    const handleServiceClick = (query: string) => {
        const queryParams = new URLSearchParams();
        queryParams.append('service', query);
        navigate(`/search?${queryParams.toString()}`);
    };

    const handleHighlightClick = (link: string) => {
        navigate(link);
    };

    return (
        <div className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Trending Services */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUpIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Trending This Week
                                </h2>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Most popular services right now
                            </p>
                        </div>
                        
                        <button 
                            onClick={() => navigate('/search')}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                        >
                            View All →
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {trendingServices.map(service => (
                            <TrendingServiceCard 
                                key={service.id} 
                                service={service}
                                onClick={handleServiceClick}
                            />
                        ))}
                    </div>
                </div>

                {/* Seasonal Highlights */}
                {seasonalHighlights.length > 0 && (
                    <div>
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <SparklesIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Seasonal Favorites
                                </h2>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Perfect treatments for the {currentSeason} season
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {seasonalHighlights.map(highlight => (
                                <SeasonalHighlightCard 
                                    key={highlight.id}
                                    highlight={highlight}
                                    onClick={handleHighlightClick}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrendingServices;