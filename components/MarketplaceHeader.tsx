
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { BusinessIcon, SearchIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from './Icons';

interface MarketplaceHeaderProps {
    initialService?: string;
    initialLocation?: string;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({ initialService = '', initialLocation = '' }) => {
    const { currentCustomer, logout } = useCustomerAuth();
    const navigate = ReactRouterDOM.useNavigate();
    const [service, setService] = useState(initialService);
    const [location, setLocation] = useState(initialLocation);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const queryParams = new URLSearchParams();
        if (service) queryParams.append('service', service);
        if (location) queryParams.append('location', location);
        navigate(`/search?${queryParams.toString()}`);
    };
    
    return (
        <header className="w-full bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm sticky top-0 z-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <ReactRouterDOM.Link to="/" className="flex items-center gap-2">
                        <BusinessIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-2xl font-bold tracking-wider text-gray-900 dark:text-gray-100">Reservio</span>
                    </ReactRouterDOM.Link>

                    {/* Search bar for search results page */}
                    { (initialService || initialLocation) && (
                        <form onSubmit={handleSearch} className="hidden lg:flex items-center w-full max-w-xl mx-auto border dark:border-gray-600 rounded-full shadow-sm">
                            <input type="text" value={service} onChange={(e) => setService(e.target.value)} placeholder="Service" className="flex-1 border-0 bg-transparent py-2 px-4 rounded-l-full focus:ring-0" />
                            <div className="h-5 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="flex-1 border-0 bg-transparent py-2 px-4 focus:ring-0" />
                            <button type="submit" className="p-2 bg-indigo-600 text-white rounded-full m-1 hover:bg-indigo-700">
                                <SearchIcon className="h-5 w-5" />
                            </button>
                        </form>
                    )}

                    <div className="flex items-center gap-4">
                        <ReactRouterDOM.Link to="/biz/login" className="hidden md:block text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600">
                            For Business
                        </ReactRouterDOM.Link>
                        {currentCustomer ? (
                            <div className="flex items-center gap-2">
                                <ReactRouterDOM.Link to="/account" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                    <UserCircleIcon className="h-5 w-5" />
                                    My Account
                                </ReactRouterDOM.Link>
                                <button onClick={logout} className="p-2 text-gray-500 hover:text-red-600" title="Logout">
                                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <ReactRouterDOM.Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                    Log In
                                </ReactRouterDOM.Link>
                                <ReactRouterDOM.Link to="/signup" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                                    Sign Up
                                </ReactRouterDOM.Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default MarketplaceHeader;
