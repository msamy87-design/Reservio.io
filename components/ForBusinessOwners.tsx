import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessIcon, ChartBarIcon, UserGroupIcon, CalendarIcon, StarIcon, CurrencyDollarIcon, BoltIcon, CheckBadgeIcon, TrendingUpIcon, ShieldCheckIcon } from './Icons';

interface BusinessBenefit {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    stats?: string;
}

interface BusinessTestimonial {
    id: string;
    business_name: string;
    owner_name: string;
    business_type: string;
    testimonial: string;
    results: {
        bookings_increase: number;
        revenue_increase: number;
        time_saved_hours: number;
    };
    image_url?: string;
}

interface PricingTier {
    id: string;
    name: string;
    price: number;
    billing: 'month' | 'year';
    features: string[];
    is_popular?: boolean;
    savings?: string;
}

const businessBenefits: BusinessBenefit[] = [
    {
        id: '1',
        icon: TrendingUpIcon,
        title: 'Grow Your Business',
        description: 'Reach new customers and increase bookings with our growing marketplace',
        stats: '40% average increase in bookings'
    },
    {
        id: '2',
        icon: CalendarIcon,
        title: 'Automated Scheduling',
        description: 'Let customers book 24/7 with automatic confirmations and reminders',
        stats: 'Save 10+ hours per week'
    },
    {
        id: '3',
        icon: CurrencyDollarIcon,
        title: 'Increase Revenue',
        description: 'Reduce no-shows and maximize your calendar with optimized booking times',
        stats: 'Average 25% revenue increase'
    },
    {
        id: '4',
        icon: ChartBarIcon,
        title: 'Business Analytics',
        description: 'Track performance with detailed insights and customer feedback',
        stats: 'Real-time dashboard included'
    },
    {
        id: '5',
        icon: UserGroupIcon,
        title: 'Customer Management',
        description: 'Build lasting relationships with customer profiles and history',
        stats: '90% customer retention rate'
    },
    {
        id: '6',
        icon: ShieldCheckIcon,
        title: 'Professional Verification',
        description: 'Stand out with our verification badge and quality assurance',
        stats: 'Verified businesses get 3x more bookings'
    }
];

const mockTestimonials: BusinessTestimonial[] = [
    {
        id: '1',
        business_name: 'Serenity Spa',
        owner_name: 'Maria Rodriguez',
        business_type: 'Day Spa',
        testimonial: 'Reservio transformed our booking process! We went from constant phone calls to automated scheduling, and our revenue increased by 35% in just 3 months.',
        results: {
            bookings_increase: 65,
            revenue_increase: 35,
            time_saved_hours: 15
        }
    },
    {
        id: '2',
        business_name: 'Urban Hair Studio',
        owner_name: 'David Chen',
        business_type: 'Hair Salon',
        testimonial: 'The marketplace exposure brought us so many new clients! The automated reminders reduced our no-shows by 80%. Best investment we\'ve made.',
        results: {
            bookings_increase: 45,
            revenue_increase: 28,
            time_saved_hours: 12
        }
    },
    {
        id: '3',
        business_name: 'Bliss Nails',
        owner_name: 'Sophie Taylor',
        business_type: 'Nail Salon',
        testimonial: 'Managing appointments used to be a nightmare. Now everything is automated and we can focus on what we do best - making our clients happy!',
        results: {
            bookings_increase: 55,
            revenue_increase: 42,
            time_saved_hours: 20
        }
    }
];

const pricingTiers: PricingTier[] = [
    {
        id: '1',
        name: 'Starter',
        price: 29,
        billing: 'month',
        features: [
            'Unlimited online bookings',
            'Customer management',
            'Basic analytics',
            'Email support',
            'Mobile app access'
        ]
    },
    {
        id: '2',
        name: 'Professional',
        price: 59,
        billing: 'month',
        is_popular: true,
        features: [
            'Everything in Starter',
            'Marketplace listing',
            'Advanced analytics',
            'SMS notifications',
            'Priority support',
            'Custom branding'
        ]
    },
    {
        id: '3',
        name: 'Enterprise',
        price: 99,
        billing: 'month',
        features: [
            'Everything in Professional',
            'Multi-location support',
            'API access',
            'Dedicated account manager',
            'Custom integrations',
            'White-label options'
        ]
    }
];

interface BenefitCardProps {
    benefit: BusinessBenefit;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ benefit }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <benefit.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {benefit.description}
                </p>
                {benefit.stats && (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                        {benefit.stats}
                    </div>
                )}
            </div>
        </div>
    </div>
);

interface TestimonialCardProps {
    testimonial: BusinessTestimonial;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {testimonial.owner_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.owner_name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.business_name} • {testimonial.business_type}
                </p>
            </div>
        </div>
        
        {/* Testimonial */}
        <blockquote className="text-gray-700 dark:text-gray-300 mb-4 italic">
            "{testimonial.testimonial}"
        </blockquote>
        
        {/* Results */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +{testimonial.results.bookings_increase}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Bookings
                </div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    +{testimonial.results.revenue_increase}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Revenue
                </div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {testimonial.results.time_saved_hours}h
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Time Saved
                </div>
            </div>
        </div>
    </div>
);

interface PricingCardProps {
    tier: PricingTier;
    onSelect: (tier: PricingTier) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ tier, onSelect }) => (
    <div className={`relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 transition-all duration-300 hover:shadow-md ${
        tier.is_popular 
            ? 'border-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/50' 
            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
    }`}>
        {tier.is_popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                </div>
            </div>
        )}
        
        <div className="text-center mb-6">
            <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-2">
                {tier.name}
            </h3>
            <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${tier.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                    /{tier.billing}
                </span>
            </div>
            {tier.savings && (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    {tier.savings}
                </div>
            )}
        </div>
        
        <ul className="space-y-3 mb-8">
            {tier.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckBadgeIcon className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                </li>
            ))}
        </ul>
        
        <button 
            onClick={() => onSelect(tier)}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                tier.is_popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
            Start Free Trial
        </button>
    </div>
);

const ForBusinessOwners: React.FC = () => {
    const [selectedTestimonial, setSelectedTestimonial] = useState(0);
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/signup');
    };

    const handlePricingSelect = (tier: PricingTier) => {
        // Store selected tier and navigate to signup
        localStorage.setItem('selected_plan', tier.id);
        navigate('/signup');
    };

    return (
        <div className="py-16 sm:py-24 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <BusinessIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                            Grow Your Business
                        </h1>
                    </div>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
                        Join thousands of successful salon owners, barbers, and spa professionals who've transformed their businesses with Reservio
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={handleGetStarted}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors"
                        >
                            Start Free 30-Day Trial
                        </button>
                        <button className="bg-transparent border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors">
                            Watch Demo Video
                        </button>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        No credit card required • Setup in 5 minutes • Cancel anytime
                    </p>
                </div>

                {/* Benefits Section */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Why Business Owners Choose Reservio
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Everything you need to streamline operations, attract customers, and grow your revenue
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {businessBenefits.map(benefit => (
                            <BenefitCard key={benefit.id} benefit={benefit} />
                        ))}
                    </div>
                </div>

                {/* Success Stories */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Success Stories
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Real results from real business owners
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {mockTestimonials.map(testimonial => (
                            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                        ))}
                    </div>
                </div>

                {/* Pricing Section */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Choose the plan that fits your business size and needs
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {pricingTiers.map(tier => (
                            <PricingCard 
                                key={tier.id}
                                tier={tier}
                                onSelect={handlePricingSelect}
                            />
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                <div className="text-center">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-lg">
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Ready to Transform Your Business?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                            Join the thousands of businesses already growing with Reservio. Start your free trial today and see the difference.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button 
                                onClick={handleGetStarted}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                Start Free Trial
                            </button>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                                <span>4.9/5 from 1,200+ business reviews</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForBusinessOwners;