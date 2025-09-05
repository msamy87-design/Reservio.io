import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { searchBusinesses, SearchFilters } from '../services/marketplaceApi';
import { PublicBusinessProfile } from '../types';
import MarketplaceHeader from '../components/MarketplaceHeader';
import BusinessCard from '../components/BusinessCard';
import MapView from '../components/MapView';
import MarketplaceFooter from '../components/MarketplaceFooter';
import { StarIcon, MapIcon, ListBulletIcon } from '../components/Icons';

const SearchResultsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [businesses, setBusinesses] = useState<PublicBusinessProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'map'>('list');
    
    const initialFilters = {
        minPrice: Number(searchParams.get('minPrice')) || undefined,
        maxPrice: Number(searchParams.get('maxPrice')) || undefined,
        minRating: Number(searchParams.get('minRating')) || undefined,
        date: searchParams.get('date') || undefined,
    };
    const [filters, setFilters] = useState<Omit<SearchFilters, 'lat'|'lon'>>(initialFilters);
    
    const searchOptions = useMemo(() => ({
        service: searchParams.get('service') || '',
        location: searchParams.get('location') || '',
        lat: searchParams.get('lat') ? Number(searchParams.get('lat')) : null,
        lon: searchParams.get('lon') ? Number(searchParams.get('lon')) : null,
        ...filters
    }), [searchParams, filters]);

    useEffect(() => {
        const performSearch = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const results = await searchBusinesses(searchOptions.service, searchOptions.location, searchOptions);
                setBusinesses(results);
            } catch (err) {
                setError('Failed to fetch search results.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [searchOptions]);
    
    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        
        // Update URL
        const currentParams = new URLSearchParams(location.search);
        Object.entries(updatedFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== 0 && value !== '') {
                currentParams.set(key, String(value));
            } else {
                currentParams.delete(key);
            }
        });
        navigate(`${location.pathname}?${currentParams.toString()}`);
    };
    
    const getPageTitle = () => {
        if (searchOptions.lat && searchOptions.lon && !searchOptions.service) return "Businesses Near You";
        if (searchOptions.lat && searchOptions.lon && searchOptions.service) return `"${searchOptions.service}" Near You`;
        if (searchOptions.service) return `Results for "${searchOptions.service}"`;
        return "Search Results";
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
            <MarketplaceHeader />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
                        {getPageTitle()}
                    </h1>
                    <div className="inline-flex rounded-md shadow-sm">
                        <button onClick={() => setView('list')} className={`px-4 py-2 text-sm font-medium ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded-l-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600`}>
                            <ListBulletIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => setView('map')} className={`px-4 py-2 text-sm font-medium ${view === 'map' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded-r-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600`}>
                            <MapIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-fit">
                        <h3 className="text-lg font-semibold mb-4">Filter Results</h3>
                        {/* Price Filter */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price Range</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="number" placeholder="Min" value={filters.minPrice || ''} onChange={e => handleFilterChange({ minPrice: Number(e.target.value) || undefined })} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                <span>-</span>
                                <input type="number" placeholder="Max" value={filters.maxPrice || ''} onChange={e => handleFilterChange({ maxPrice: Number(e.target.value) || undefined })} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                        </div>
                        {/* Rating Filter */}
                        <div className="mb-4">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Rating</label>
                             <div className="flex gap-1 mt-1">
                                {[4, 3, 2, 1].map(rating => (
                                    <button key={rating} onClick={() => handleFilterChange({ minRating: filters.minRating === rating ? undefined : rating })} className={`flex items-center gap-1 p-2 border rounded-md ${filters.minRating === rating ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                        {rating} <StarIcon className="h-4 w-4 text-yellow-400" />
                                    </button>
                                ))}
                             </div>
                        </div>
                        {/* Availability Filter */}
                        <div>
                            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Available On</label>
                            <input id="date-filter" type="date" value={filters.date || ''} onChange={e => handleFilterChange({ date: e.target.value || undefined })} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </aside>
                    
                    {/* Results Content */}
                    <div className="lg:col-span-3">
                         {isLoading && <p>Loading results...</p>}
                        {error && <p className="text-red-500">{error}</p>}
                        {!isLoading && !error && businesses.length === 0 && <p>No businesses found matching your criteria.</p>}

                        {!isLoading && !error && businesses.length > 0 && (
                            view === 'list' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {businesses.map(business => <BusinessCard key={business.id} business={business} />)}
                                </div>
                            ) : (
                                <div className="h-[70vh] rounded-lg overflow-hidden shadow-md">
                                    <MapView businesses={businesses} />
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
            <MarketplaceFooter />
        </div>
    );
};

export default SearchResultsPage;