import { PublicBusinessProfile, PriceTier, BusinessAmenity } from '../types';

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

export const formatDistance = (distance: number): string => {
    if (distance < 1) {
        return `${(distance * 5280).toFixed(0)} ft`;
    }
    return `${distance.toFixed(1)} mi`;
};

export const getPriceTierSymbol = (tier: PriceTier | undefined): string => {
    if (!tier) return '';
    return tier;
};

export const getPriceTierColor = (tier: PriceTier | undefined): string => {
    switch (tier) {
        case '$': return 'text-green-600 dark:text-green-400';
        case '$$': return 'text-yellow-600 dark:text-yellow-400';
        case '$$$': return 'text-red-600 dark:text-red-400';
        default: return 'text-gray-600 dark:text-gray-400';
    }
};

export const formatNextAvailableSlot = (slot: string | null): string => {
    if (!slot) return 'No availability';
    
    const slotDate = new Date(slot);
    const now = new Date();
    const diffHours = Math.abs(slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
        return `Available today at ${slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffHours < 48) {
        return `Available tomorrow at ${slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return `Available ${slotDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }
};

export const getBusinessStatusColor = (isOpen: boolean | undefined): string => {
    if (isOpen === undefined) return 'text-gray-500 dark:text-gray-400';
    return isOpen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
};

export const getBusinessStatusText = (isOpen: boolean | undefined): string => {
    if (isOpen === undefined) return 'Hours unknown';
    return isOpen ? 'Open now' : 'Closed';
};

export const getAmenityIcon = (amenity: BusinessAmenity): string => {
    switch (amenity) {
        case 'wifi': return '📶';
        case 'parking': return '🚗';
        case 'wheelchair_accessible': return '♿';
        case 'credit_cards': return '💳';
        case 'walk_ins': return '🚶';
        case 'online_booking': return '📱';
        default: return '✓';
    }
};

export const getAmenityLabel = (amenity: BusinessAmenity): string => {
    switch (amenity) {
        case 'wifi': return 'Free WiFi';
        case 'parking': return 'Parking';
        case 'wheelchair_accessible': return 'Accessible';
        case 'credit_cards': return 'Cards';
        case 'walk_ins': return 'Walk-ins';
        case 'online_booking': return 'Online';
        default: return amenity;
    }
};

export const getBadges = (business: PublicBusinessProfile): Array<{label: string, color: string, icon?: string}> => {
    const badges = [];
    
    if (business.is_featured) {
        badges.push({ label: 'Featured', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', icon: '⭐' });
    }
    
    if (business.is_new_business) {
        badges.push({ label: 'New', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', icon: '🆕' });
    }
    
    if (business.average_rating >= 4.8) {
        badges.push({ label: 'Top Rated', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', icon: '🏆' });
    }
    
    if (business.response_time_minutes && business.response_time_minutes <= 5) {
        badges.push({ label: 'Quick Response', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', icon: '⚡' });
    }
    
    if (business.recent_booking_count && business.recent_booking_count >= 5) {
        badges.push({ label: 'Popular', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300', icon: '🔥' });
    }
    
    return badges;
};