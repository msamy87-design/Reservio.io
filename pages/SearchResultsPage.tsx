
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchBusinesses } from '../services/marketplaceApi';
import { PublicBusinessProfile } from '../types';
import BusinessCard from '../components/BusinessCard';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import { FilterIcon, StarIcon } from '../components/Icons';

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [businesses, setBusinesses] = useState<PublicBusinessProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFiltersOnMobile, setShowFiltersOnMobile] = useState(false);

    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        minRating: 0,
    });

    const serviceQuery = searchParams.get('service') || '';
    const locationQuery = searchParams.get('location') || '';

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const results = await searchBusinesses(locationQuery, serviceQuery);
                setBusinesses(results);
            } catch (err) {
                setError('Failed to fetch search results. The backend server might not be running.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [locationQuery, serviceQuery]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRatingChange = (rating: number) => {
        setFilters(prev => ({ ...prev, minRating: prev.minRating === rating ? 0 : rating }));
    };

    const clearFilters = () => {
        setFilters({ minPrice: '', maxPrice: '', minRating: 0 });
    };

    const displayedBusinesses = useMemo(() => {
        if (loading) return [];
        return businesses.filter(business => {
            const { minPrice, maxPrice, minRating } = filters;

            const ratingMatch = minRating === 0 || business.average_rating >= minRating;
            if (!ratingMatch) return false;

            const min = parseFloat(minPrice) || 0;
            const max = parseFloat(maxPrice) || Infinity;
            const isPriceFilterActive = minPrice !== '' || maxPrice !== '';
            
            if (isPriceFilterActive) {
                const priceMatch = business.services.some(service => service.price >= min && service.price <= max);
                if (!priceMatch) return false;
            }

            return true;
        });
    }, [businesses, filters, loading]);


    const renderContent = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
                            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                            <div className="p-6">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (error) {
            return <div className="text-center py-10 px-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">{error}</div>;
        }

        if (displayedBusinesses.length === 0) {
            return <div className="text-center py-10 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg"><p className="text-gray-600 dark:text-gray-400">No businesses found matching your criteria.</p></div>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {displayedBusinesses.map(business => (
                    <BusinessCard key={business.id} business={business} />
                ))}
            </div>
        );
    };
    
    const FilterSidebar = () => (
         <form className="space-y-6">
            <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Price Range</h3>
                <div className="flex items-center gap-2">
                    <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Min" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm" />
                    <span>-</span>
                    <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Max" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm" />
                </div>
            </div>
            <div>
                 <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">By Rating</h3>
                 <div className="flex flex-wrap gap-2">
                    {[4, 3].map(rating => (
                         <button type="button" key={rating} onClick={() => handleRatingChange(rating)} className={`px-3 py-1.5 text-sm rounded-full border ${filters.minRating === rating ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
                           {rating} <StarIcon className="h-4 w-4 inline-block mb-0.5" /> & up
                         </button>
                    ))}
                 </div>
            </div>
            <button type="button" onClick={clearFilters} className="w-full text-sm text-center py-2 text-indigo-600 dark:text-indigo-400 hover:underline">
                Clear All Filters
            </button>
        </form>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <MarketplaceHeader initialService={serviceQuery} initialLocation={locationQuery} />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
                 <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filter Sidebar */}
                    <aside className="lg:w-1/4 xl:w-1/5">
                        <div className="flex justify-between items-center mb-4 lg:mb-0">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Filters</h2>
                            <button onClick={() => setShowFiltersOnMobile(!showFiltersOnMobile)} className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <FilterIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md lg:shadow-none lg:bg-transparent lg:dark:bg-transparent lg:p-0 ${showFiltersOnMobile ? 'block' : 'hidden'} lg:block`}>
                            <FilterSidebar />
                        </div>
                    </aside>

                    {/* Results */}
                    <div className="lg:w-3/4 xl:w-4/5">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                           Showing {displayedBusinesses.length} results
                        </h1>
                        {renderContent()}
                    </div>
                </div>
            </main>
            <MarketplaceFooter />
        </div>
    );
};

export default SearchResultsPage;
