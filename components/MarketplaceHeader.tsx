import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { UserCircleIcon, BusinessIcon, CrosshairsGpsIcon } from './Icons';

const MarketplaceHeader: React.FC = () => {
    const { currentCustomer, logout } = useCustomerAuth();
    const navigate = useNavigate();

    const handleNearMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    navigate(`/search?lat=${latitude}&lon=${longitude}`);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    alert("Could not get your location. Please ensure location services are enabled.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    return (
        <header className="w-full sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b dark:border-gray-700">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <BusinessIcon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                    Reservio
                </Link>
                <div className="flex items-center gap-4">
                    <button onClick={handleNearMe} className="hidden sm:flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                        <CrosshairsGpsIcon className="h-5 w-5" />
                        Near Me
                    </button>
                    <Link to="/biz/login" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                        For Business
                    </Link>
                    {currentCustomer ? (
                        <div className="flex items-center gap-4">
                             <Link to="/account" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                                <UserCircleIcon className="h-6 w-6" />
                                My Account
                            </Link>
                            <button onClick={logout} className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                                Log in
                            </Link>
                            <Link to="/signup" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default MarketplaceHeader;