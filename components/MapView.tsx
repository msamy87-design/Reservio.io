import React, { useState, useMemo } from 'react';
import { PublicBusinessProfile } from '../types';
import { MapPinIcon } from './Icons';
import StarRating from './StarRating';
import { Link } from 'react-router-dom';

interface MapViewProps {
    businesses: PublicBusinessProfile[];
}

const MapView: React.FC<MapViewProps> = ({ businesses }) => {
    const [activeBusiness, setActiveBusiness] = useState<PublicBusinessProfile | null>(null);

    const geoBusinesses = useMemo(() => businesses.filter(b => b.latitude && b.longitude), [businesses]);

    const bounds = useMemo(() => {
        if (geoBusinesses.length === 0) return null;
        const lats = geoBusinesses.map(b => b.latitude!);
        const lons = geoBusinesses.map(b => b.longitude!);
        return {
            minLat: Math.min(...lats), maxLat: Math.max(...lats),
            minLon: Math.min(...lons), maxLon: Math.max(...lons),
        };
    }, [geoBusinesses]);

    const getPosition = (lat: number, lon: number) => {
        if (!bounds) return { top: '50%', left: '50%' };
        
        const latRange = bounds.maxLat - bounds.minLat;
        const lonRange = bounds.maxLon - bounds.minLon;

        // Add a small buffer to prevent pins from being on the absolute edge
        const PADDING = 0.1; 

        const top = latRange > 0.0001
            ? (1 - ((lat - bounds.minLat) / latRange)) * (1 - 2 * PADDING) * 100 + (PADDING * 100)
            : 50;

        const left = lonRange > 0.0001
            ? ((lon - bounds.minLon) / lonRange) * (1 - 2 * PADDING) * 100 + (PADDING * 100)
            : 50;

        return { top: `${top}%`, left: `${left}%` };
    };

    return (
        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg relative overflow-hidden" onClick={() => setActiveBusiness(null)}>
            {geoBusinesses.map(business => {
                const { top, left } = getPosition(business.latitude!, business.longitude!);
                const isActive = activeBusiness?.id === business.id;
                return (
                    <React.Fragment key={business.id}>
                        <button
                            style={{ top, left }}
                            onClick={(e) => { e.stopPropagation(); setActiveBusiness(business); }}
                            className={`absolute -translate-x-1/2 -translate-y-full transition-transform duration-200 ${isActive ? 'scale-125 z-10' : 'hover:scale-110'}`}
                        >
                            <MapPinIcon className={`h-8 w-8 ${isActive ? 'text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`} />
                        </button>
                        {isActive && (
                            <div
                                style={{ top, left }}
                                className="absolute -translate-x-1/2 -translate-y-full mb-10 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 z-20"
                                onClick={e => e.stopPropagation()}
                            >
                                <img src={business.imageUrl} alt={business.name} className="h-24 w-full object-cover rounded-md" />
                                <h4 className="font-bold mt-2 truncate text-gray-800 dark:text-gray-100">{business.name}</h4>
                                <div className="flex items-center mt-1">
                                    <StarRating rating={business.average_rating} />
                                    <span className="text-xs ml-2 text-gray-500 dark:text-gray-400">({business.review_count})</span>
                                </div>
                                <Link to={`/business/${business.id}`} className="block mt-3 w-full text-center bg-indigo-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-indigo-700">
                                    View Details
                                </Link>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default MapView;