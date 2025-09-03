import React from 'react';
import { Link } from 'react-router-dom';
import { PublicBusinessProfile } from '../types';
import StarRating from './StarRating';

interface BusinessCardProps {
    business: PublicBusinessProfile;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
            <img className="h-48 w-full object-cover" src={business.imageUrl} alt={business.name} />
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 truncate">{business.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{business.address}</p>
                <div className="mt-4 flex items-center">
                    <StarRating rating={business.average_rating} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        ({business.review_count} reviews)
                    </span>
                </div>
                <div className="mt-auto pt-4">
                     <Link 
                        to={`/business/${business.id}`}
                        className="block text-center w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BusinessCard;