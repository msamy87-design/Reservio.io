import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { searchBusinesses } from '../services/marketplaceApi';
import { PublicBusinessProfile } from '../types';
import MarketplaceHeader from '../components/MarketplaceHeader';
import BusinessCard from '../components/BusinessCard';
import MarketplaceFooter from '../components/MarketplaceFooter';
// import MapView from '../components/MapView'; // Assuming MapView exists

const SearchResultsPage: React.FC = () => {
    const location = useLocation();
    const [businesses, setBusinesses] = useState<PublicBusinessProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const searchParams = new URLSearchParams(location.search);
    const serviceQuery = searchParams.get('service') || '';
    const locationQuery = searchParams.get('location') || '';

    useEffect(() => {
        const performSearch = async () => {
            setIsLoading(true);
            try {
                const results = await searchBusinesses(locationQuery, serviceQuery);
                setBusinesses(results);
            } catch (error) {
                console.error("Search failed:", error);
                setBusinesses([]);
            } finally {
                setIsLoading(false);
            }
        };
        performSearch();
    }, [locationQuery, serviceQuery]);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
            <MarketplaceHeader initialService={serviceQuery} initialLocation={locationQuery} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Search Results</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Showing {businesses.length} results for <span className="font-semibold">{serviceQuery}</span> in <span className="font-semibold">{locationQuery || 'any location'}</span>
                </p>
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="lg:col-span-1">
                        {isLoading ? (
                            <p>Loading results...</p>
                        ) : businesses.length > 0 ? (
                            <div className="space-y-6">
                                {businesses.map(business => (
                                    <BusinessCard key={business.id} business={business} />
                                ))}
                            </div>
                        ) : (
                            <p>No businesses found matching your criteria.</p>
                        )}
                    </div>
                     {/* <div className="hidden lg:block lg:col-span-1 sticky top-24 h-[80vh]">
                        <MapView businesses={businesses} />
                    </div> */}
                </div>
            </main>
            <MarketplaceFooter />
        </div>
    );
};

export default SearchResultsPage;
