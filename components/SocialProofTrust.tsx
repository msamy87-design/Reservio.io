import React, { useState, useEffect } from 'react';
import { CustomerReview } from '../types';
import { StarIcon, CheckBadgeIcon, UserGroupIcon, HeartIcon, EyeIcon, ShieldCheckIcon, BoltIcon } from './Icons';

// Mock data for customer reviews
const mockReviews: CustomerReview[] = [
    {
        id: '1',
        customer_name: 'Sarah Johnson',
        customer_image: '/images/customer1.jpg',
        business_name: 'Elite Hair Studio',
        service_name: 'Balayage Hair Color',
        rating: 5,
        comment: 'Absolutely amazing transformation! The stylist understood exactly what I wanted and delivered beyond my expectations. The salon is clean, modern, and the staff is incredibly professional.',
        before_image: '/images/before1.jpg',
        after_image: '/images/after1.jpg',
        date: '2024-01-15',
        is_featured: true,
        helpful_count: 24
    },
    {
        id: '2',
        customer_name: 'Michael Chen',
        customer_image: '/images/customer2.jpg',
        business_name: 'Zen Day Spa',
        service_name: 'Deep Tissue Massage',
        rating: 5,
        comment: 'Best massage I\'ve ever had! The therapist was skilled and attentive to my problem areas. Left feeling completely relaxed and rejuvenated.',
        date: '2024-01-12',
        is_featured: true,
        helpful_count: 18
    },
    {
        id: '3',
        customer_name: 'Emily Rodriguez',
        customer_image: '/images/customer3.jpg',
        business_name: 'Nail Artistry',
        service_name: 'Gel Manicure',
        rating: 5,
        comment: 'The attention to detail is incredible! My nails looked perfect for weeks. The nail art was exactly what I showed them in the photo.',
        date: '2024-01-10',
        is_featured: true,
        helpful_count: 31
    }
];

interface PlatformStats {
    total_customers: number;
    total_businesses: number;
    total_bookings: number;
    average_rating: number;
    countries_served: number;
    satisfaction_rate: number;
}

const mockPlatformStats: PlatformStats = {
    total_customers: 150000,
    total_businesses: 2500,
    total_bookings: 500000,
    average_rating: 4.8,
    countries_served: 5,
    satisfaction_rate: 96
};

interface ReviewCardProps {
    review: CustomerReview;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {review.customer_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                        {review.customer_name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {review.service_name} at {review.business_name}
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <StarIcon 
                        key={i} 
                        className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
                    />
                ))}
            </div>
        </div>
        
        {/* Review Content */}
        <blockquote className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
            "{review.comment}"
        </blockquote>
        
        {/* Before/After Images */}
        {(review.before_image || review.after_image) && (
            <div className="flex gap-4 mb-4">
                {review.before_image && (
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Before</p>
                        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Before Image</span>
                        </div>
                    </div>
                )}
                {review.after_image && (
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">After</p>
                        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">After Image</span>
                        </div>
                    </div>
                )}
            </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
                {new Date(review.date).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <HeartIcon className="h-4 w-4" />
                <span>{review.helpful_count}</span>
            </div>
        </div>
    </div>
);

interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    label: string;
    subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, subtext }) => (
    <div className="text-center">
        <div className="flex justify-center mb-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                <Icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
        </div>
        <div className="text-gray-600 dark:text-gray-400 font-medium mb-1">
            {label}
        </div>
        {subtext && (
            <div className="text-sm text-gray-500 dark:text-gray-500">
                {subtext}
            </div>
        )}
    </div>
);

interface TrustBadgeProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ icon: Icon, title, description }) => (
    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
                {description}
            </p>
        </div>
    </div>
);

const SocialProofTrust: React.FC = () => {
    const [reviews] = useState<CustomerReview[]>(mockReviews);
    const [stats] = useState<PlatformStats>(mockPlatformStats);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

    // Auto-rotate reviews every 5 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
        }, 5000);
        
        return () => clearInterval(timer);
    }, [reviews.length]);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
        return num.toString();
    };

    return (
        <div className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Platform Statistics */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Trusted by Thousands
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Join our growing community of satisfied customers and top-rated businesses across the globe
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                        <StatCard 
                            icon={UserGroupIcon}
                            value={formatNumber(stats.total_customers)}
                            label="Happy Customers"
                            subtext="and counting"
                        />
                        <StatCard 
                            icon={CheckBadgeIcon}
                            value={formatNumber(stats.total_businesses)}
                            label="Verified Businesses"
                            subtext="background checked"
                        />
                        <StatCard 
                            icon={BoltIcon}
                            value={formatNumber(stats.total_bookings)}
                            label="Bookings Made"
                            subtext="successfully completed"
                        />
                        <StatCard 
                            icon={StarIcon}
                            value={stats.average_rating.toFixed(1)}
                            label="Average Rating"
                            subtext="out of 5 stars"
                        />
                        <StatCard 
                            icon={EyeIcon}
                            value={stats.countries_served.toString()}
                            label="Countries Served"
                            subtext="and expanding"
                        />
                        <StatCard 
                            icon={HeartIcon}
                            value={`${stats.satisfaction_rate}%`}
                            label="Satisfaction Rate"
                            subtext="would recommend"
                        />
                    </div>
                </div>

                {/* Customer Reviews */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            What Our Customers Say
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Real reviews from real customers sharing their experiences
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reviews.map(review => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                    
                    <div className="text-center mt-8">
                        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                            Read More Reviews →
                        </button>
                    </div>
                </div>

                {/* Trust & Safety */}
                <div>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Your Trust & Safety
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            We're committed to providing a safe and secure platform for everyone
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <TrustBadge 
                            icon={ShieldCheckIcon}
                            title="Verified Businesses"
                            description="All businesses undergo background checks and verification processes before joining our platform."
                        />
                        <TrustBadge 
                            icon={CheckBadgeIcon}
                            title="Quality Guarantee"
                            description="We stand behind every booking with our satisfaction guarantee and 24/7 customer support."
                        />
                        <TrustBadge 
                            icon={BoltIcon}
                            title="Instant Confirmation"
                            description="Get immediate booking confirmations with automated reminders and easy rescheduling options."
                        />
                        <TrustBadge 
                            icon={HeartIcon}
                            title="Customer Protection"
                            description="Your payments are secure and protected. Full refunds available for unsatisfactory services."
                        />
                        <TrustBadge 
                            icon={UserGroupIcon}
                            title="Community Standards"
                            description="Our community guidelines ensure professional standards and respectful interactions."
                        />
                        <TrustBadge 
                            icon={EyeIcon}
                            title="Transparent Reviews"
                            description="All reviews are verified and authentic, helping you make informed booking decisions."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialProofTrust;