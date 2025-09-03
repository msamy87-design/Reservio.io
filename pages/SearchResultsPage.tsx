import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchBusinesses } from '../services/marketplaceApi';
import { PublicBusinessProfile } from '../types';
import BusinessCard from '../components/BusinessCard';
import MarketplaceHeader from '../components/MarketplaceHeader';

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [businesses, setBusinesses] = useState<PublicBusinessProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

        if (businesses.length === 0) {
            return <div className="text-center py-10 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg"><p className="text-gray-600 dark:text-gray-400">No businesses found matching your search.</p></div>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {businesses.map(business => (
                    <BusinessCard key={business.id} business={business} />
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <MarketplaceHeader initialService={serviceQuery} initialLocation={locationQuery} />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    Showing {businesses.length} results
                </h1>
                {renderContent()}
            </main>
        </div>
    );
};

export default SearchResultsPage;