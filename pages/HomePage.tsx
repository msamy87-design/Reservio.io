
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { SearchIcon, BusinessIcon } from '../components/Icons';
import MarketplaceHeader from '../components/MarketplaceHeader';

const HomePage: React.FC = () => {
    const [service, setService] = useState('');
    const [location, setLocation] = useState('');
    const navigate = ReactRouterDOM.useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const queryParams = new URLSearchParams();
        if (service) queryParams.append('service', service);
        if (location) queryParams.append('location', location);
        
        navigate(`/search?${queryParams.toString()}`);
    };

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center">
            <MarketplaceHeader />
            <main className="flex-grow flex items-center justify-center p-4">
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
                            <input
                                id="service-search"
                                type="text"
                                value={service}
                                onChange={(e) => setService(e.target.value)}
                                className="w-full border-0 bg-transparent py-2.5 px-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                placeholder="Service (e.g., haircut, manicure)"
                            />
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex-1 w-full">
                            <label htmlFor="location-search" className="sr-only">Location</label>
                            <input
                                id="location-search"
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full border-0 bg-transparent py-2.5 px-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                placeholder="Location (e.g., Anytown)"
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
            
            {/* Background decorative shapes */}
            <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]" aria-hidden="true">
                <div className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
            </div>
        </div>
    );
};

export default HomePage;
