import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { searchBusinesses, SearchFilters } from '../services/marketplaceApi';
import { PublicBusinessProfile } from '../types';
import MarketplaceHeader from '../components/MarketplaceHeader';
import BusinessCard from '../components/BusinessCard';
import MapView from '../components/MapView';
import MarketplaceFooter from '../components/MarketplaceFooter';
import SearchFiltersComponent from '../components/SearchFilters';
import { SearchResultsSkeleton } from '../components/SkeletonLoader';
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
        maxDistance: Number(searchParams.get('maxDistance')) || undefined,
        priceTiers: searchParams.getAll('priceTiers').length > 0 ? searchParams.getAll('priceTiers') as any : undefined,
        amenities: searchParams.getAll('amenities').length > 0 ? searchParams.getAll('amenities') as any : undefined,
        isOpenNow: searchParams.get('isOpenNow') === 'true' || undefined,
        hasAvailability: searchParams.get('hasAvailability') === 'true' || undefined,
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
        
        // Keep service and location
        if (searchOptions.service) currentParams.set('service', searchOptions.service);
        if (searchOptions.location) currentParams.set('location', searchOptions.location);
        if (searchOptions.lat) currentParams.set('lat', searchOptions.lat.toString());
        if (searchOptions.lon) currentParams.set('lon', searchOptions.lon.toString());
        
        // Clear all filter params first
        ['minPrice', 'maxPrice', 'minRating', 'date', 'maxDistance', 'priceTiers', 'amenities', 'isOpenNow', 'hasAvailability'].forEach(param => {
            currentParams.delete(param);
        });
        
        // Set new filter params
        Object.entries(updatedFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== false && (Array.isArray(value) ? value.length > 0 : value !== '')) {
                if (Array.isArray(value)) {
                    value.forEach(v => currentParams.append(key, String(v)));
                } else if (typeof value === 'boolean' && value) {
                    currentParams.set(key, 'true');
                } else {
                    currentParams.set(key, String(value));
                }
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
                    <aside className="lg:col-span-1">
                        <SearchFiltersComponent
                            filters={filters}
                            onFiltersChange={handleFilterChange}
                            hasLocation={!!(searchOptions.lat && searchOptions.lon)}
                        />
                    </aside>
                    
                    {/* Results Content */}
                    <div className="lg:col-span-3">
                         {isLoading && <SearchResultsSkeleton count={6} />}
                        {error && <p className="text-red-500">{error}</p>}
                        {!isLoading && !error && businesses.length === 0 && (
                            <div className="text-center py-12">
                                <div className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600 mb-4">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">No businesses found</h3>
                                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search criteria or browsing different categories.</p>
                            </div>
                        )}

                        {!isLoading && !error && businesses.length > 0 && (
                            view === 'list' ? (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {businesses.length} {businesses.length === 1 ? 'result' : 'results'} found
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {businesses.map(business => (
                                            <BusinessCard 
                                                key={business.id} 
                                                business={business}
                                                userLocation={searchOptions.lat && searchOptions.lon ? {
                                                    lat: searchOptions.lat,
                                                    lon: searchOptions.lon
                                                } : undefined}
                                            />
                                        ))}
                                    </div>
                                </>
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