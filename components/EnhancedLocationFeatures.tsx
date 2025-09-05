import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicBusinessProfile, PopularLocation } from '../types';
import { MapPinIcon, CrosshairsGpsIcon, StarIcon, EyeIcon, ViewColumnsIcon } from './Icons';
import { searchBusinesses } from '../services/marketplaceApi';
import { BusinessCardSkeleton } from './SkeletonLoader';
import BusinessCard from './BusinessCard';
import { InteractiveMap } from '../src/components/InteractiveMap';
import { BusinessLocation, Location } from '../src/services/mapService';

// Mock data for popular locations
const mockPopularLocations: PopularLocation[] = [
    {
        id: '1',
        name: 'Downtown Manhattan',
        business_count: 245,
        average_rating: 4.8,
        popular_services: ['Hair Styling', 'Manicure', 'Massage'],
        coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    {
        id: '2',
        name: 'Beverly Hills',
        business_count: 187,
        average_rating: 4.9,
        popular_services: ['Facial', 'Hair Color', 'Spa Treatment'],
        coordinates: { lat: 34.0736, lng: -118.4004 }
    },
    {
        id: '3',
        name: 'SoHo District',
        business_count: 156,
        average_rating: 4.7,
        popular_services: ['Nail Art', 'Eyebrow Shaping', 'Blowout'],
        coordinates: { lat: 40.7241, lng: -74.0020 }
    },
    {
        id: '4',
        name: 'Santa Monica',
        business_count: 203,
        average_rating: 4.6,
        popular_services: ['Beach Waves', 'Pedicure', 'Sun Damage Repair'],
        coordinates: { lat: 34.0195, lng: -118.4912 }
    }
];

interface LocationState {
    latitude: number;
    longitude: number;
    accuracy: number;
    city?: string;
    state?: string;
}

interface NearbyBusinessesWithMapProps {
    userLocation: LocationState;
}

const NearbyBusinessesWithMap: React.FC<NearbyBusinessesWithMapProps> = ({ userLocation }) => {
    const [nearbyBusinesses, setNearbyBusinesses] = useState<PublicBusinessProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNearbyBusinesses = async () => {
            try {
                setIsLoading(true);
                const results = await searchBusinesses('', '', {
                    lat: userLocation.latitude,
                    lon: userLocation.longitude,
                    maxDistance: 10 // 10 mile radius for map view
                });
                setNearbyBusinesses(results);
            } catch (error) {
                console.error('Failed to fetch nearby businesses:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNearbyBusinesses();
    }, [userLocation]);

    const businessLocations: BusinessLocation[] = nearbyBusinesses.map(business => ({
        id: business.id,
        lat: business.latitude || userLocation.latitude + (Math.random() - 0.5) * 0.1,
        lng: business.longitude || userLocation.longitude + (Math.random() - 0.5) * 0.1,
        name: business.name,
        address: business.address,
        rating: business.average_rating,
        priceRange: business.price_tier || '$$',
        imageUrl: business.imageUrl,
        distance: business.distance_miles
    }));

    const handleBusinessSelect = useCallback((businessId: string) => {
        setSelectedBusiness(businessId);
        const business = nearbyBusinesses.find(b => b.id === businessId);
        if (business) {
            navigate(`/business/${business.id}`);
        }
    }, [nearbyBusinesses, navigate]);

    const handleMapMove = useCallback((center: Location, bounds: { ne: Location; sw: Location }) => {
        // Optionally fetch new businesses when map moves
        console.log('Map moved to:', center, 'bounds:', bounds);
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <BusinessCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Found {nearbyBusinesses.length} businesses within 10 miles
                </div>
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'grid'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <ViewColumnsIcon className="h-4 w-4" />
                        Grid
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'map'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <MapPinIcon className="h-4 w-4" />
                        Map
                    </button>
                </div>
            </div>

            {/* Content based on view mode */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nearbyBusinesses.slice(0, 6).map(business => (
                        <BusinessCard 
                            key={business.id}
                            business={business}
                            userLocation={{
                                lat: userLocation.latitude,
                                lon: userLocation.longitude
                            }}
                            showActions={true}
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Map */}
                    <div className="lg:col-span-2">
                        <InteractiveMap
                            businesses={businessLocations}
                            center={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                            zoom={12}
                            onBusinessSelect={handleBusinessSelect}
                            onMapMove={handleMapMove}
                            className="h-[600px] w-full"
                        />
                    </div>

                    {/* Business List */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-900 pb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Nearby Businesses ({nearbyBusinesses.length})
                            </h3>
                        </div>
                        {nearbyBusinesses.map(business => (
                            <div
                                key={business.id}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                    selectedBusiness === business.id
                                        ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => handleBusinessSelect(business.id)}
                            >
                                <div className="flex items-start gap-3">
                                    {business.imageUrl && (
                                        <img 
                                            src={business.imageUrl} 
                                            alt={business.name}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                            {business.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {business.address}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1">
                                                <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                                                <span className="text-sm font-medium">
                                                    {business.average_rating}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-500">•</span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {business.price_tier || '$$'}
                                            </span>
                                            {business.distance_miles && (
                                                <>
                                                    <span className="text-sm text-gray-500">•</span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {business.distance_miles.toFixed(1)} mi
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface PopularLocationCardProps {
    location: PopularLocation;
    onClick: (location: PopularLocation) => void;
}

const PopularLocationCard: React.FC<PopularLocationCardProps> = ({ location, onClick }) => (
    <div 
        onClick={() => onClick(location)}
        className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
    >
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg group-hover:bg-indigo-600 transition-colors">
                    <MapPinIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 group-hover:text-white" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {location.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {location.business_count} businesses
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-1 text-yellow-500">
                <StarIcon className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {location.average_rating}
                </span>
            </div>
        </div>
        
        <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Popular services:</p>
            <div className="flex flex-wrap gap-2">
                {location.popular_services.map((service, index) => (
                    <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                        {service}
                    </span>
                ))}
            </div>
        </div>
        
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <EyeIcon className="h-4 w-4" />
                <span className="text-sm">View area</span>
            </div>
            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm">
                Explore →
            </button>
        </div>
    </div>
);

const EnhancedLocationFeatures: React.FC = () => {
    const [userLocation, setUserLocation] = useState<LocationState | null>(null);
    const [locationError, setLocationError] = useState<string>('');
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [popularLocations] = useState<PopularLocation[]>(mockPopularLocations);
    const navigate = useNavigate();

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by this browser');
            return;
        }

        setIsGettingLocation(true);
        setLocationError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                
                // Reverse geocoding to get city/state (mock implementation)
                const location: LocationState = {
                    latitude,
                    longitude,
                    accuracy,
                    city: 'Your City', // In real implementation, use reverse geocoding API
                    state: 'Your State'
                };
                
                setUserLocation(location);
                setIsGettingLocation(false);
            },
            (error) => {
                let errorMessage = 'Unable to retrieve your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Please allow location access to see nearby businesses.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }
                setLocationError(errorMessage);
                setIsGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
        );
    }, []);

    const handlePopularLocationClick = (location: PopularLocation) => {
        const queryParams = new URLSearchParams();
        queryParams.append('lat', location.coordinates.lat.toString());
        queryParams.append('lon', location.coordinates.lng.toString());
        navigate(`/search?${queryParams.toString()}`);
    };

    const handleViewAllNearby = () => {
        if (userLocation) {
            const queryParams = new URLSearchParams();
            queryParams.append('lat', userLocation.latitude.toString());
            queryParams.append('lon', userLocation.longitude.toString());
            navigate(`/search?${queryParams.toString()}`);
        }
    };

    return (
        <div className="py-16 sm:py-24 bg-white dark:bg-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Near You Section */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <CrosshairsGpsIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {userLocation ? `Near You` : 'Find Services Near You'}
                                </h2>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                {userLocation 
                                    ? `Discover top-rated businesses with interactive maps and detailed views`
                                    : 'Allow location access to see personalized recommendations with real-time maps'
                                }
                            </p>
                        </div>
                        
                        {userLocation && (
                            <button 
                                onClick={handleViewAllNearby}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                            >
                                View All →
                            </button>
                        )}
                    </div>
                    
                    {!userLocation && !isGettingLocation && (
                        <div className="text-center py-12">
                            <div className="max-w-md mx-auto">
                                <div className="mb-6">
                                    <CrosshairsGpsIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Enable Location Services
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                                        Get personalized recommendations with interactive maps showing businesses near you
                                    </p>
                                </div>
                                
                                <button
                                    onClick={requestLocation}
                                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    <CrosshairsGpsIcon className="h-5 w-5" />
                                    Find Businesses Near Me
                                </button>
                                
                                {locationError && (
                                    <p className="text-red-500 dark:text-red-400 text-sm mt-4">
                                        {locationError}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {isGettingLocation && (
                        <div className="text-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">Getting your location...</p>
                        </div>
                    )}
                    
                    {userLocation && (
                        <NearbyBusinessesWithMap userLocation={userLocation} />
                    )}
                </div>

                {/* Popular Locations */}
                <div>
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <MapPinIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Popular Areas
                            </h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Explore top destinations for beauty and wellness services
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {popularLocations.map(location => (
                            <PopularLocationCard 
                                key={location.id}
                                location={location}
                                onClick={handlePopularLocationClick}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedLocationFeatures;