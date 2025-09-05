import React, { useState, useEffect, useCallback } from 'react';
import { 
    MagnifyingGlassIcon, 
    FunnelIcon, 
    MapPinIcon, 
    ClockIcon, 
    CurrencyDollarIcon,
    StarIcon,
    AdjustmentsHorizontalIcon,
    XMarkIcon,
    CheckIcon,
    ChevronDownIcon,
    SparklesIcon
} from './Icons';
import { PriceTier, BusinessAmenity } from '../types';

interface SearchFilters {
    priceRange: PriceTier[];
    distance: number;
    rating: number;
    amenities: BusinessAmenity[];
    availability: 'any' | 'today' | 'this_week' | 'flexible';
    sortBy: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'distance';
}

interface SmartSuggestion {
    id: string;
    text: string;
    type: 'popular' | 'trending' | 'nearby' | 'recent';
    category?: string;
    icon?: React.ComponentType<any>;
}

const EnhancedSearchDiscovery: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        priceRange: [],
        distance: 25,
        rating: 0,
        amenities: [],
        availability: 'any',
        sortBy: 'relevance'
    });

    const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Mock smart suggestions data
    const mockSuggestions: SmartSuggestion[] = [
        { id: '1', text: 'Hair coloring near me', type: 'trending', category: 'Hair', icon: SparklesIcon },
        { id: '2', text: 'Massage therapy', type: 'popular', category: 'Wellness' },
        { id: '3', text: 'Nail art', type: 'trending', category: 'Nails' },
        { id: '4', text: 'Men\'s haircut', type: 'popular', category: 'Hair' },
        { id: '5', text: 'Facial treatment', type: 'nearby', category: 'Skincare' },
        { id: '6', text: 'Eyebrow threading', type: 'recent', category: 'Beauty' }
    ];

    const amenityOptions: { value: BusinessAmenity; label: string }[] = [
        { value: 'wifi', label: 'WiFi' },
        { value: 'parking', label: 'Parking' },
        { value: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
        { value: 'credit_cards', label: 'Credit Cards' },
        { value: 'walk_ins', label: 'Walk-ins Welcome' },
        { value: 'online_booking', label: 'Online Booking' }
    ];

    const priceOptions: { value: PriceTier; label: string; description: string }[] = [
        { value: '$', label: '$', description: 'Budget-friendly' },
        { value: '$$', label: '$$', description: 'Moderate' },
        { value: '$$$', label: '$$$', description: 'Premium' }
    ];

    useEffect(() => {
        // Load recent searches from localStorage
        const stored = localStorage.getItem('recent_searches');
        if (stored) {
            setRecentSearches(JSON.parse(stored));
        }
        setSmartSuggestions(mockSuggestions);
    }, []);

    const saveRecentSearch = useCallback((query: string) => {
        if (!query.trim()) return;
        
        const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recent_searches', JSON.stringify(updated));
    }, [recentSearches]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            saveRecentSearch(searchQuery.trim());
        }
        // Implement actual search logic here
        console.log('Search:', { query: searchQuery, location, filters });
    };

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const toggleAmenity = (amenity: BusinessAmenity) => {
        setFilters(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const togglePriceRange = (price: PriceTier) => {
        setFilters(prev => ({
            ...prev,
            priceRange: prev.priceRange.includes(price)
                ? prev.priceRange.filter(p => p !== price)
                : [...prev.priceRange, price]
        }));
    };

    const clearFilters = () => {
        setFilters({
            priceRange: [],
            distance: 25,
            rating: 0,
            amenities: [],
            availability: 'any',
            sortBy: 'relevance'
        });
    };

    const getFilterCount = () => {
        let count = 0;
        if (filters.priceRange.length > 0) count++;
        if (filters.distance !== 25) count++;
        if (filters.rating > 0) count++;
        if (filters.amenities.length > 0) count++;
        if (filters.availability !== 'any') count++;
        if (filters.sortBy !== 'relevance') count++;
        return count;
    };

    const getSuggestionIcon = (type: SmartSuggestion['type']) => {
        switch (type) {
            case 'trending': return '🔥';
            case 'popular': return '⭐';
            case 'nearby': return '📍';
            case 'recent': return '🕒';
            default: return '🔍';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 py-16 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Smart Search & Discovery
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                        Find exactly what you're looking for with intelligent search and personalized recommendations
                    </p>
                </div>

                {/* Enhanced Search Bar */}
                <div className="mt-12 max-w-4xl mx-auto">
                    <div className="relative">
                        <div className="flex flex-col lg:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl shadow-lg">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="What service are you looking for?"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Location Input */}
                            <div className="flex-1 relative">
                                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Where?"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Filter Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`relative px-6 py-3 rounded-lg font-medium transition-colors ${
                                    showFilters 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <FunnelIcon className="h-5 w-5 mr-2 inline" />
                                Filters
                                {getFilterCount() > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {getFilterCount()}
                                    </span>
                                )}
                            </button>

                            {/* Search Button */}
                            <button
                                onClick={handleSearch}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>

                        {/* Smart Suggestions Dropdown */}
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                                <div className="p-6">
                                    {/* Smart Suggestions */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                            Smart Suggestions
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {smartSuggestions.map(suggestion => (
                                                <button
                                                    key={suggestion.id}
                                                    onClick={() => {
                                                        setSearchQuery(suggestion.text);
                                                        setShowSuggestions(false);
                                                    }}
                                                    className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                                >
                                                    <span className="mr-3 text-lg">{getSuggestionIcon(suggestion.type)}</span>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {suggestion.text}
                                                        </div>
                                                        {suggestion.category && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {suggestion.category}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Searches */}
                                    {recentSearches.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                                Recent Searches
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {recentSearches.map((search, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            setSearchQuery(search);
                                                            setShowSuggestions(false);
                                                        }}
                                                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                    >
                                                        {search}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowSuggestions(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="mt-8 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Advanced Filters
                            </h3>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            >
                                Clear all
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Price Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Price Range
                                </label>
                                <div className="space-y-2">
                                    {priceOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => togglePriceRange(option.value)}
                                            className={`w-full p-3 rounded-lg border-2 transition-all ${
                                                filters.priceRange.includes(option.value)
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="text-left">
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {option.label}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {option.description}
                                                    </div>
                                                </div>
                                                {filters.priceRange.includes(option.value) && (
                                                    <CheckIcon className="h-5 w-5 text-indigo-600" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Distance */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Distance: {filters.distance} miles
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={filters.distance}
                                    onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                                />
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span>1 mi</span>
                                    <span>50+ mi</span>
                                </div>
                            </div>

                            {/* Minimum Rating */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Minimum Rating
                                </label>
                                <div className="space-y-2">
                                    {[0, 3, 4, 4.5].map(rating => (
                                        <button
                                            key={rating}
                                            onClick={() => handleFilterChange('rating', rating)}
                                            className={`w-full p-2 rounded-lg flex items-center ${
                                                filters.rating === rating
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            {rating === 0 ? (
                                                'Any rating'
                                            ) : (
                                                <>
                                                    {Array.from({ length: Math.floor(rating) }).map((_, i) => (
                                                        <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                                    ))}
                                                    {rating % 1 !== 0 && (
                                                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current opacity-50" />
                                                    )}
                                                    <span className="ml-2">{rating}+ stars</span>
                                                </>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amenities */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Amenities
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {amenityOptions.map(amenity => (
                                        <button
                                            key={amenity.value}
                                            onClick={() => toggleAmenity(amenity.value)}
                                            className={`w-full p-2 rounded-lg flex items-center justify-between text-left ${
                                                filters.amenities.includes(amenity.value)
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            <span className="text-sm">{amenity.label}</span>
                                            {filters.amenities.includes(amenity.value) && (
                                                <CheckIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Availability */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Availability
                                </label>
                                <select
                                    value={filters.availability}
                                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="any">Any time</option>
                                    <option value="today">Available today</option>
                                    <option value="this_week">This week</option>
                                    <option value="flexible">Flexible</option>
                                </select>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Sort by
                                </label>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="relevance">Relevance</option>
                                    <option value="rating">Highest rated</option>
                                    <option value="price_low">Price: Low to high</option>
                                    <option value="price_high">Price: High to low</option>
                                    <option value="distance">Distance</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Filter Tags */}
                <div className="mt-8 max-w-4xl mx-auto">
                    <div className="flex flex-wrap gap-3 justify-center">
                        {['Hair Color', 'Massage', 'Manicure', 'Facial', 'Eyebrows', 'Beard Trim'].map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSearchQuery(tag)}
                                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Click outside to close suggestions */}
            {showSuggestions && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSuggestions(false)}
                />
            )}
        </div>
    );
};

export default EnhancedSearchDiscovery;