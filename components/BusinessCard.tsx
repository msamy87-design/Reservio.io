import React from 'react';
import { Link } from 'react-router-dom';
import { PublicBusinessProfile } from '../types';
import StarRating from './StarRating';
import { MapPinIcon, ClockIcon, CurrencyDollarIcon, PhoneIcon, HeartIcon } from './Icons';
import { 
    formatDistance, 
    formatNextAvailableSlot, 
    getPriceTierSymbol, 
    getPriceTierColor,
    getBusinessStatusColor,
    getBusinessStatusText,
    getAmenityIcon,
    getAmenityLabel,
    getBadges
} from '../utils/businessUtils';

interface BusinessCardProps {
    business: PublicBusinessProfile;
    userLocation?: { lat: number; lon: number };
    onFavoriteToggle?: (businessId: string) => void;
    isFavorited?: boolean;
    showActions?: boolean;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ 
    business, 
    userLocation,
    onFavoriteToggle,
    isFavorited = false,
    showActions = true
}) => {
    const badges = getBadges(business);
    const hasDistance = userLocation && business.latitude && business.longitude;
    const distance = hasDistance ? formatDistance(business.distance_miles || 0) : null;

    const handleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onFavoriteToggle?.(business.id);
    };

    const handleCall = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(`tel:${business.phone}`, '_self');
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col relative group">
            {/* Hero Image with Badges */}
            <div className="relative">
                <img className="h-48 w-full object-cover" src={business.imageUrl} alt={business.name} />
                
                {/* Status Badge */}
                {business.is_open_now !== undefined && (
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getBusinessStatusColor(business.is_open_now)} bg-white dark:bg-gray-800 shadow-sm`}>
                        {getBusinessStatusText(business.is_open_now)}
                    </div>
                )}

                {/* Price Tier */}
                {business.price_tier && (
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold bg-white dark:bg-gray-800 shadow-sm ${getPriceTierColor(business.price_tier)}`}>
                        {getPriceTierSymbol(business.price_tier)}
                    </div>
                )}

                {/* Distance Badge */}
                {distance && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white">
                        {distance} away
                    </div>
                )}

                {/* Feature Badges */}
                {badges.length > 0 && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        {badges.slice(0, 2).map((badge, index) => (
                            <span
                                key={index}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color} shadow-sm`}
                                title={badge.label}
                            >
                                {badge.icon}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-grow">
                {/* Business Name and Rating */}
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate flex-1">{business.name}</h3>
                    {showActions && onFavoriteToggle && (
                        <button
                            onClick={handleFavorite}
                            className={`ml-2 p-1 rounded-full transition-colors ${
                                isFavorited 
                                    ? 'text-red-500 hover:text-red-600' 
                                    : 'text-gray-400 hover:text-red-500'
                            }`}
                            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <HeartIcon className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                        </button>
                    )}
                </div>

                {/* Address */}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{business.address}</span>
                </div>

                {/* Rating and Reviews */}
                <div className="flex items-center mb-3">
                    <StarRating rating={business.average_rating} />
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {business.average_rating.toFixed(1)} ({business.review_count} reviews)
                    </span>
                </div>

                {/* Next Available Slot */}
                {business.next_available_slot && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                        <ClockIcon className="h-4 w-4 mr-1 text-green-600 dark:text-green-400" />
                        <span className="text-green-600 dark:text-green-400 font-medium">
                            {formatNextAvailableSlot(business.next_available_slot)}
                        </span>
                    </div>
                )}

                {/* Amenities */}
                {business.amenities && business.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {business.amenities.slice(0, 4).map((amenity) => (
                            <span
                                key={amenity}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                title={getAmenityLabel(amenity)}
                            >
                                <span className="mr-1">{getAmenityIcon(amenity)}</span>
                                {getAmenityLabel(amenity)}
                            </span>
                        ))}
                        {business.amenities.length > 4 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                +{business.amenities.length - 4} more
                            </span>
                        )}
                    </div>
                )}

                {/* Social Proof */}
                {(business.recent_booking_count || business.response_time_minutes) && (
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {business.recent_booking_count && business.recent_booking_count > 0 && (
                            <span>🔥 {business.recent_booking_count} bookings today</span>
                        )}
                        {business.response_time_minutes && (
                            <span>⚡ Responds in {business.response_time_minutes}min</span>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-auto pt-3">
                    <div className="flex gap-2">
                        <Link 
                            to={`/business/${business.id}`}
                            className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            View Details
                        </Link>
                        {showActions && business.phone && (
                            <button
                                onClick={handleCall}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                title="Call business"
                            >
                                <PhoneIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessCard;