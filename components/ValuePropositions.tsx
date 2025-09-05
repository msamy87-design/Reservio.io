import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoltIcon, CurrencyDollarIcon, ClockIcon, CheckBadgeIcon, HeartIcon, ShieldCheckIcon, CalendarIcon, StarIcon } from './Icons';

interface SpecialOffer {
    id: string;
    title: string;
    description: string;
    discount_percentage: number;
    valid_until: string;
    code: string;
    terms: string;
    category: 'new_customer' | 'seasonal' | 'limited_time';
    background_color: string;
}

interface ValueProposition {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    benefits: string[];
}

const mockOffers: SpecialOffer[] = [
    {
        id: '1',
        title: 'New Customer Special',
        description: 'Get 25% off your first booking with any verified business on our platform',
        discount_percentage: 25,
        valid_until: '2024-12-31',
        code: 'WELCOME25',
        terms: 'Valid for first-time customers only. Cannot be combined with other offers.',
        category: 'new_customer',
        background_color: 'from-blue-500 to-indigo-600'
    },
    {
        id: '2',
        title: 'Weekend Warrior',
        description: 'Save 15% on weekend appointments - perfect for your self-care Saturday',
        discount_percentage: 15,
        valid_until: '2024-12-31',
        code: 'WEEKEND15',
        terms: 'Valid for Saturday and Sunday appointments only.',
        category: 'limited_time',
        background_color: 'from-purple-500 to-pink-600'
    },
    {
        id: '3',
        title: 'Bundle & Save',
        description: 'Book 3 services and get the 3rd one FREE! Mix and match any services you love',
        discount_percentage: 33,
        valid_until: '2024-12-31',
        code: 'BUNDLE3',
        terms: 'Must book all 3 services within 30 days. Lowest priced service is free.',
        category: 'seasonal',
        background_color: 'from-emerald-500 to-teal-600'
    }
];

const valuePropositions: ValueProposition[] = [
    {
        id: '1',
        icon: BoltIcon,
        title: 'Instant Booking',
        description: 'Book appointments in seconds, not minutes',
        benefits: [
            'Real-time availability',
            'Instant confirmations',
            'No phone calls needed',
            'Auto-reminders sent'
        ]
    },
    {
        id: '2',
        icon: CurrencyDollarIcon,
        title: 'Transparent Pricing',
        description: 'No hidden fees or surprise charges ever',
        benefits: [
            'Upfront pricing',
            'No booking fees',
            'Price comparison tools',
            'Special discounts'
        ]
    },
    {
        id: '3',
        icon: ShieldCheckIcon,
        title: 'Quality Guaranteed',
        description: 'Every business is verified and reviewed',
        benefits: [
            'Background checked providers',
            'Authentic reviews only',
            'Satisfaction guarantee',
            '24/7 customer support'
        ]
    },
    {
        id: '4',
        icon: ClockIcon,
        title: 'Flexible Scheduling',
        description: 'Easy rescheduling and cancellation policies',
        benefits: [
            'Free cancellations',
            'Easy rescheduling',
            'Multiple time slots',
            'Calendar integration'
        ]
    }
];

interface OfferCardProps {
    offer: SpecialOffer;
    onClaim: (offer: SpecialOffer) => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onClaim }) => {
    const timeLeft = Math.ceil((new Date(offer.valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
        <div className={`relative bg-gradient-to-br ${offer.background_color} rounded-xl p-6 text-white overflow-hidden group hover:shadow-lg transition-all duration-300`}>
            {/* Background Elements */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-white opacity-10 rounded-full"></div>
            
            <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold mb-4">
                    <BoltIcon className="h-4 w-4" />
                    {offer.discount_percentage}% OFF
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                <p className="text-white/90 mb-4 text-sm">{offer.description}</p>
                
                {/* Code */}
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-white/70 mb-1">Use code:</p>
                            <p className="font-mono font-bold text-lg">{offer.code}</p>
                        </div>
                        <button 
                            onClick={() => navigator.clipboard.writeText(offer.code)}
                            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
                        >
                            Copy
                        </button>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="text-xs text-white/70">
                        {timeLeft > 0 ? `${timeLeft} days left` : 'Expires soon'}
                    </div>
                    <button 
                        onClick={() => onClaim(offer)}
                        className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
                    >
                        Claim Now
                    </button>
                </div>
                
                {/* Terms */}
                <p className="text-xs text-white/60 mt-3">{offer.terms}</p>
            </div>
        </div>
    );
};

interface ValuePropCardProps {
    proposition: ValueProposition;
}

const ValuePropCard: React.FC<ValuePropCardProps> = ({ proposition }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <proposition.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {proposition.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {proposition.description}
                </p>
                
                <ul className="space-y-2">
                    {proposition.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckBadgeIcon className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                            <span>{benefit}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);

const ValuePropositions: React.FC = () => {
    const [offers] = useState<SpecialOffer[]>(mockOffers);
    const [showAllOffers, setShowAllOffers] = useState(false);
    const navigate = useNavigate();

    const handleClaimOffer = (offer: SpecialOffer) => {
        // Store the offer code in localStorage for later use during booking
        localStorage.setItem('promo_code', offer.code);
        localStorage.setItem('promo_discount', offer.discount_percentage.toString());
        
        // Navigate to search page
        navigate('/search');
    };

    const displayedOffers = showAllOffers ? offers : offers.slice(0, 2);

    return (
        <div className="py-16 sm:py-24 bg-white dark:bg-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Special Offers */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <BoltIcon className="h-8 w-8 text-yellow-500" />
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Special Offers
                            </h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Limited-time deals and exclusive discounts for our community members
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {displayedOffers.map(offer => (
                            <OfferCard 
                                key={offer.id}
                                offer={offer}
                                onClaim={handleClaimOffer}
                            />
                        ))}
                        
                        {!showAllOffers && offers.length > 2 && (
                            <div 
                                onClick={() => setShowAllOffers(true)}
                                className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group"
                            >
                                <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-full mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                    <BoltIcon className="h-8 w-8 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    More Offers
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                    Discover {offers.length - 2} more exclusive deals
                                </p>
                                <button className="mt-3 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm">
                                    View All →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Why Choose Us */}
                <div>
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <StarIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Why Choose Reservio?
                            </h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            We're committed to making your booking experience simple, safe, and satisfying
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {valuePropositions.map(prop => (
                            <ValuePropCard key={prop.id} proposition={prop} />
                        ))}
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-16 text-center">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12">
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            Ready to Get Started?
                        </h3>
                        <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
                            Join thousands of happy customers who've discovered their new favorite services through Reservio
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={() => navigate('/search')}
                                className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Book Your First Service
                            </button>
                            <button 
                                onClick={() => navigate('/signup')}
                                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
                            >
                                Create Free Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ValuePropositions;