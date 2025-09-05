import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonalizedRecommendation, RecentlyViewed, TrendingNearYou, UserPreferences } from '../types';
import { SparkleIcon, BookmarkIcon, EyeIcon, TrendingUpIcon, StarIcon, MapPinIcon, ClockIcon, HeartIcon, BoltIcon, GiftIcon, AdjustmentsHorizontalIcon } from './Icons';

// Mock user preferences (in real app, this would come from user context/auth)
const mockUserPreferences: UserPreferences = {
    id: '1',
    preferred_services: ['haircut', 'massage', 'manicure'],
    preferred_locations: ['downtown', 'soho'],
    budget_range: { min: 50, max: 200 },
    preferred_times: ['10:00 AM', '2:00 PM', '6:00 PM'],
    favorite_businesses: ['1', '3', '7'],
    booking_history: ['haircut', 'facial', 'massage', 'pedicure'],
    notification_preferences: {
        email: true,
        sms: true,
        push: true
    }
};

// Mock recommendations
const mockRecommendations: PersonalizedRecommendation[] = [
    {
        id: '1',
        type: 'service',
        title: 'Perfect Match: Deep Tissue Massage',
        description: 'Based on your recent bookings and preferences',
        confidence_score: 95,
        reasoning: 'You\'ve booked 3 massages in the last month',
        service_name: 'Deep Tissue Massage',
        price: 120,
        rating: 4.9,
        distance: 0.8,
        available_slots: ['Today 3:00 PM', 'Tomorrow 10:00 AM']
    },
    {
        id: '2',
        type: 'business',
        title: 'New Salon Near You: Luxe Hair Studio',
        description: 'Top-rated salon just opened in your neighborhood',
        confidence_score: 88,
        reasoning: 'Matches your location and service preferences',
        business_id: '12',
        price: 85,
        rating: 4.8,
        distance: 0.3,
        available_slots: ['This week']
    },
    {
        id: '3',
        type: 'offer',
        title: 'Special Offer: 30% Off Facials',
        description: 'Limited time offer at your favorite spa',
        confidence_score: 92,
        reasoning: 'You love facial treatments at this location',
        offer_id: 'FACIAL30',
        price: 70,
        rating: 4.7,
        available_slots: ['Weekend slots available']
    }
];

const mockRecentlyViewed: RecentlyViewed[] = [
    {
        id: '1',
        business_id: '5',
        business_name: 'Serenity Day Spa',
        service_name: 'Swedish Massage',
        rating: 4.8,
        price_range: '$80-120',
        viewed_at: '2024-01-15T14:30:00Z',
        booking_url: '/business/5'
    },
    {
        id: '2',
        business_id: '8',
        business_name: 'Elite Hair Salon',
        service_name: 'Balayage Color',
        rating: 4.9,
        price_range: '$150-200',
        viewed_at: '2024-01-14T11:20:00Z',
        booking_url: '/business/8'
    },
    {
        id: '3',
        business_id: '12',
        business_name: 'Perfect Nails',
        service_name: 'Gel Manicure',
        rating: 4.6,
        price_range: '$35-50',
        viewed_at: '2024-01-14T09:45:00Z',
        booking_url: '/business/12'
    }
];

const mockTrendingNearYou: TrendingNearYou[] = [
    {
        id: '1',
        business_name: 'The Hair Loft',
        service_name: 'Keratin Treatment',
        trending_reason: 'Booked 15 times this week',
        booking_velocity: 85,
        rating: 4.9,
        price: 180,
        distance_miles: 1.2,
        next_available: 'Tomorrow 2:00 PM'
    },
    {
        id: '2',
        business_name: 'Zen Wellness Spa',
        service_name: 'Hot Stone Massage',
        trending_reason: 'Popular this season',
        booking_velocity: 72,
        rating: 4.8,
        price: 140,
        distance_miles: 0.9,
        next_available: 'Today 6:00 PM'
    }
];

interface RecommendationCardProps {
    recommendation: PersonalizedRecommendation;
    onBook: (recommendation: PersonalizedRecommendation) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, onBook }) => {
    const getTypeIcon = () => {
        switch (recommendation.type) {
            case 'service': return SparkleIcon;
            case 'business': return StarIcon;
            case 'offer': return GiftIcon;
            case 'time_slot': return ClockIcon;
            default: return SparkleIcon;
        }
    };

    const TypeIcon = getTypeIcon();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 group">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <TypeIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 group-hover:text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {recommendation.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {recommendation.description}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                    <BoltIcon className="h-3 w-3" />
                    {recommendation.confidence_score}% match
                </div>
            </div>
            
            {/* Details */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {recommendation.rating && (
                    <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{recommendation.rating}</span>
                    </div>
                )}
                
                {recommendation.price && (
                    <div className="flex items-center gap-1">
                        <span className="font-medium">${recommendation.price}</span>
                    </div>
                )}
                
                {recommendation.distance && (
                    <div className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{recommendation.distance} mi</span>
                    </div>
                )}
            </div>
            
            {/* Availability */}
            {recommendation.available_slots && (
                <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Available:</p>
                    <div className="flex flex-wrap gap-2">
                        {recommendation.available_slots.slice(0, 2).map((slot, index) => (
                            <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                                {slot}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Reasoning */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg mb-4">
                <p className="text-xs text-indigo-700 dark:text-indigo-400">
                    <strong>Why we recommend this:</strong> {recommendation.reasoning}
                </p>
            </div>
            
            {/* Action */}
            <button 
                onClick={() => onBook(recommendation)}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
                Book Now
            </button>
        </div>
    );
};

interface RecentlyViewedCardProps {
    item: RecentlyViewed;
    onView: (item: RecentlyViewed) => void;
}

const RecentlyViewedCard: React.FC<RecentlyViewedCardProps> = ({ item, onView }) => (
    <div 
        onClick={() => onView(item)}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 cursor-pointer group"
    >
        <div className="flex items-start gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                {item.business_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {item.business_name}
                </h4>
                {item.service_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {item.service_name}
                    </p>
                )}
                
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <StarIcon className="h-3 w-3 text-yellow-400 fill-current" />
                        <span>{item.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{item.price_range}</span>
                </div>
            </div>
        </div>
    </div>
);

interface TrendingNearYouCardProps {
    item: TrendingNearYou;
    onBook: (item: TrendingNearYou) => void;
}

const TrendingNearYouCard: React.FC<TrendingNearYouCardProps> = ({ item, onBook }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
            <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                    {item.service_name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    at {item.business_name}
                </p>
            </div>
            
            <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                <TrendingUpIcon className="h-3 w-3" />
                Hot
            </div>
        </div>
        
        <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">
            {item.trending_reason}
        </p>
        
        <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-2">
                <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-gray-700 dark:text-gray-300">{item.rating}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-700 dark:text-gray-300">{item.distance_miles} mi</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">${item.price}</span>
        </div>
        
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <ClockIcon className="h-3 w-3" />
                {item.next_available}
            </div>
            <button 
                onClick={() => onBook(item)}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm"
            >
                Book Now →
            </button>
        </div>
    </div>
);

const PersonalizedExperience: React.FC = () => {
    const [recommendations] = useState<PersonalizedRecommendation[]>(mockRecommendations);
    const [recentlyViewed] = useState<RecentlyViewed[]>(mockRecentlyViewed);
    const [trendingNearYou] = useState<TrendingNearYou[]>(mockTrendingNearYou);
    const [userPreferences] = useState<UserPreferences>(mockUserPreferences);
    const [showPersonalization, setShowPersonalization] = useState(false);
    const navigate = useNavigate();

    // Check if user has any browsing history or preferences
    useEffect(() => {
        const hasHistory = recentlyViewed.length > 0;
        const hasPreferences = userPreferences.booking_history.length > 0;
        setShowPersonalization(hasHistory || hasPreferences);
    }, [recentlyViewed, userPreferences]);

    const handleBookRecommendation = (recommendation: PersonalizedRecommendation) => {
        // Store recommendation context for analytics
        localStorage.setItem('recommendation_source', recommendation.id);
        
        if (recommendation.business_id) {
            navigate(`/business/${recommendation.business_id}`);
        } else if (recommendation.service_name) {
            const params = new URLSearchParams();
            params.append('service', recommendation.service_name);
            navigate(`/search?${params.toString()}`);
        } else {
            navigate('/search');
        }
    };

    const handleViewRecentlyViewed = (item: RecentlyViewed) => {
        navigate(item.booking_url);
    };

    const handleBookTrending = (item: TrendingNearYou) => {
        const params = new URLSearchParams();
        params.append('service', item.service_name);
        navigate(`/search?${params.toString()}`);
    };

    const handleCustomizePreferences = () => {
        navigate('/preferences');
    };

    // Don't show personalization section if user has no data
    if (!showPersonalization) {
        return null;
    }

    return (
        <div className="py-16 sm:py-24 bg-white dark:bg-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <SparkleIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Just for You
                            </h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Personalized recommendations based on your preferences and activity
                        </p>
                    </div>
                    
                    <button 
                        onClick={handleCustomizePreferences}
                        className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                    >
                        <AdjustmentsHorizontalIcon className="h-5 w-5" />
                        Customize
                    </button>
                </div>

                {/* AI Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center gap-2 mb-8">
                            <BoltIcon className="h-6 w-6 text-yellow-500" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                AI Recommendations
                            </h3>
                            <div className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
                                Powered by AI
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendations.map(recommendation => (
                                <RecommendationCard 
                                    key={recommendation.id}
                                    recommendation={recommendation}
                                    onBook={handleBookRecommendation}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Recently Viewed */}
                    {recentlyViewed.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <EyeIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Recently Viewed
                                </h3>
                            </div>
                            
                            <div className="space-y-4">
                                {recentlyViewed.slice(0, 4).map(item => (
                                    <RecentlyViewedCard 
                                        key={item.id}
                                        item={item}
                                        onView={handleViewRecentlyViewed}
                                    />
                                ))}
                            </div>
                            
                            {recentlyViewed.length > 4 && (
                                <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm mt-4">
                                    View All History →
                                </button>
                            )}
                        </div>
                    )}

                    {/* Trending Near You */}
                    {trendingNearYou.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUpIcon className="h-6 w-6 text-red-500 dark:text-red-400" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Trending Near You
                                </h3>
                            </div>
                            
                            <div className="space-y-4">
                                {trendingNearYou.map(item => (
                                    <TrendingNearYouCard 
                                        key={item.id}
                                        item={item}
                                        onBook={handleBookTrending}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Personalization CTA */}
                <div className="mt-16 text-center">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
                        <SparkleIcon className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-4">
                            Get Even Better Recommendations
                        </h3>
                        <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                            Sign up or complete your profile to receive more personalized suggestions based on your unique preferences
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={() => navigate('/signup')}
                                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Create Account
                            </button>
                            <button 
                                onClick={handleCustomizePreferences}
                                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
                            >
                                Update Preferences
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalizedExperience;