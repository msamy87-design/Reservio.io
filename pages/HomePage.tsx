

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, BusinessIcon, ScissorsIcon, SparklesIcon, PaintBrushIcon, UserGroupIcon, CalendarDaysIcon, CheckBadgeIcon } from '../components/Icons';
import MarketplaceHeader from '../components/MarketplaceHeader';
import SearchInput from '../components/SearchInput';
import { searchBusinesses } from '../services/marketplaceApi';
import { PublicBusinessProfile } from '../types';
import BusinessCard from '../components/BusinessCard';
import MarketplaceFooter from '../components/MarketplaceFooter';
import { BusinessCardSkeleton } from '../components/SkeletonLoader';
import TrendingServices from '../components/TrendingServices';
import LocationBasedFeatures from '../components/LocationBasedFeatures';
import SocialProofTrust from '../components/SocialProofTrust';
import ValuePropositions from '../components/ValuePropositions';
import ForBusinessOwners from '../components/ForBusinessOwners';
import PersonalizedExperience from '../components/PersonalizedExperience';
import InteractiveElements from '../components/InteractiveElements';
import BusinessInsights from '../components/BusinessInsights';
import EnhancedSearchDiscovery from '../components/EnhancedSearchDiscovery';
import SmartFeatures from '../components/SmartFeatures';

const categories = [
    { name: 'Hair Salons', icon: ScissorsIcon, query: 'haircut' },
    { name: 'Nail Studios', icon: PaintBrushIcon, query: 'nails' },
    { name: 'Barbershops', icon: ScissorsIcon, query: 'barber' },
    { name: 'Spas & Massage', icon: SparklesIcon, query: 'spa' },
];

const howItWorksSteps = [
    {
        icon: SearchIcon,
        title: 'Discover',
        description: 'Find top-rated professionals for any service you need, right in your area.',
    },
    {
        icon: CalendarDaysIcon,
        title: 'Choose a Time',
        description: 'Select a date and time that works for you from the real-time availability calendar.',
    },
    {
        icon: CheckBadgeIcon,
        title: 'Book Instantly',
        description: 'Confirm your appointment in seconds. It\'s that easy!',
    },
];

const CategoryCard: React.FC<{ category: typeof categories[0], onClick: (query: string) => void }> = ({ category, onClick }) => (
    <button
        onClick={() => onClick(category.query)}
        className="group flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg text-center transition-all duration-300 hover:bg-indigo-500 hover:shadow-lg dark:hover:bg-indigo-600 transform hover:-translate-y-1"
    >
        <category.icon className="h-10 w-10 text-indigo-600 dark:text-indigo-400 transition-colors group-hover:text-white" />
        <h3 className="mt-4 text-md font-semibold text-gray-800 dark:text-gray-200 transition-colors group-hover:text-white">{category.name}</h3>
    </button>
);


const HomePage: React.FC = () => {
    const [service, setService] = useState('');
    const [location, setLocation] = useState('');
    const [featuredBusinesses, setFeaturedBusinesses] = useState<PublicBusinessProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFeatured = async () => {
            setIsLoading(true);
            try {
                // FIX: Added an empty object for the filters argument.
                const results = await searchBusinesses('', '', {}); 
                setFeaturedBusinesses(results.slice(0, 3));
            } catch (error) {
                console.error("Failed to fetch featured businesses:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeatured();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const queryParams = new URLSearchParams();
        if (service) queryParams.append('service', service);
        if (location) queryParams.append('location', location);
        
        navigate(`/search?${queryParams.toString()}`);
    };

    const handleCategoryClick = (query: string) => {
        const queryParams = new URLSearchParams();
        queryParams.append('service', query);
        navigate(`/search?${queryParams.toString()}`);
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900">
            {/* Hero Section */}
            <div className="relative flex flex-col items-center">
                <MarketplaceHeader />
                <main className="flex-grow flex items-center justify-center p-4 min-h-[70vh]">
                    <div className="text-center z-10">
                        <div className="mx-auto h-16 w-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <BusinessIcon className="h-14 w-14" />
                            <span className="ml-4 text-5xl font-bold tracking-wider text-gray-900 dark:text-gray-100">Reservio</span>
                        </div>
                        <h1 className="mt-8 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                            Find and book your next appointment
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                            Discover top-rated salons, barbers, and spas near you.
                        </p>

                        <form onSubmit={handleSearch} className="mt-10 flex flex-col sm:flex-row items-center w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-3 rounded-lg shadow-2xl gap-2">
                            <div className="flex-1 w-full">
                                <label htmlFor="service-search" className="sr-only">Service</label>
                                <SearchInput
                                    value={service}
                                    onChange={setService}
                                    placeholder="Service (e.g., haircut, manicure)"
                                    type="service"
                                />
                            </div>
                            <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <div className="flex-1 w-full">
                                <label htmlFor="location-search" className="sr-only">Location</label>
                                <SearchInput
                                    value={location}
                                    onChange={setLocation}
                                    placeholder="Location (e.g., New York, NY)"
                                    type="location"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <SearchIcon className="h-5 w-5" />
                                Search
                            </button>
                        </form>
                    </div>
                </main>
                <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]" aria-hidden="true">
                    <div className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
                </div>
            </div>

            {/* Categories Section */}
            <div className="py-16 sm:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold tracking-tight text-center text-gray-900 dark:text-white">Explore by Category</h2>
                    <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
                        {categories.map((cat) => (
                            <CategoryCard key={cat.name} category={cat} onClick={handleCategoryClick} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Trending Services Section */}
            <TrendingServices />

            {/* Location-Based Features Section */}
            <LocationBasedFeatures />

            {/* Value Propositions Section */}
            <ValuePropositions />

            {/* Personalized Experience Section */}
            <PersonalizedExperience />

            {/* How It Works Section */}
            <div className="bg-gray-50 dark:bg-gray-900 py-16 sm:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold tracking-tight text-center text-gray-900 dark:text-white">Book in 3 Easy Steps</h2>
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        {howItWorksSteps.map((step, index) => (
                            <div key={step.title} className="flex flex-col items-center">
                                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300">
                                    <step.icon className="h-8 w-8" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{index + 1}. {step.title}</h3>
                                <p className="mt-2 text-base text-gray-600 dark:text-gray-400">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Social Proof & Trust Section */}
            <SocialProofTrust />

            {/* Interactive Elements Section */}
            <InteractiveElements />

            {/* Business Insights Section */}
            <BusinessInsights />

            {/* Enhanced Search & Discovery Section */}
            <EnhancedSearchDiscovery />

            {/* Smart Features Section */}
            <SmartFeatures />

            {/* Featured Businesses Section */}
            <div className="py-16 sm:py-24 bg-white dark:bg-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold tracking-tight text-center text-gray-900 dark:text-white">Featured Salons & Barbers</h2>
                     {isLoading ? (
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <BusinessCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredBusinesses.map(business => (
                                <BusinessCard 
                                    key={business.id} 
                                    business={business}
                                    showActions={false}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* For Business Owners Section */}
            <ForBusinessOwners />
            
            <MarketplaceFooter />
        </div>
    );
};

export default HomePage;