import { API_BASE_URL } from '../utils/env';
import { PublicBusinessProfile, NewPublicBookingData, Booking, PaymentIntentDetails, NewWaitlistEntryData, PriceTier, BusinessAmenity } from '../types';

const handleResponse = async (response: Response) => {
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
};

export interface SearchFilters {
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    date?: string;
    lat?: number | null;
    lon?: number | null;
    maxDistance?: number;
    priceTiers?: PriceTier[];
    amenities?: BusinessAmenity[];
    isOpenNow?: boolean;
    hasAvailability?: boolean;
}

export const searchBusinesses = async (service: string, location: string, filters: SearchFilters): Promise<PublicBusinessProfile[]> => {
    const params = new URLSearchParams();
    if (service) params.append('service', service);
    if (location) params.append('location', location);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.date) params.append('date', filters.date);
    if (filters.lat) params.append('lat', filters.lat.toString());
    if (filters.lon) params.append('lon', filters.lon.toString());
    if (filters.maxDistance) params.append('maxDistance', filters.maxDistance.toString());
    if (filters.priceTiers && filters.priceTiers.length > 0) {
        filters.priceTiers.forEach(tier => params.append('priceTiers', tier));
    }
    if (filters.amenities && filters.amenities.length > 0) {
        filters.amenities.forEach(amenity => params.append('amenities', amenity));
    }
    if (filters.isOpenNow) params.append('isOpenNow', 'true');
    if (filters.hasAvailability) params.append('hasAvailability', 'true');

    const response = await fetch(`${API_BASE_URL}/businesses/search?${params.toString()}`);
    return handleResponse(response);
};

export const getBusinessById = async (id: string): Promise<PublicBusinessProfile> => {
    const response = await fetch(`${API_BASE_URL}/businesses/${id}`);
    return handleResponse(response);
};

export const getBusinessesByIds = async (ids: string[]): Promise<PublicBusinessProfile[]> => {
    if (ids.length === 0) return [];
    const response = await fetch(`${API_BASE_URL}/businesses/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    return handleResponse(response);
};


export const getAvailability = async (businessId: string, serviceId: string, staffId: string, date: string): Promise<Record<string, string[]>> => {
    const params = new URLSearchParams({ serviceId, staffId, date });
    const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/availability?${params.toString()}`);
    return handleResponse(response);
};

export const createPaymentIntent = async (details: PaymentIntentDetails): Promise<{ clientSecret: string | null; depositAmount: number; depositReason: string; }> => {
    const response = await fetch(`${API_BASE_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
    });
    return handleResponse(response);
};

export const createPublicBooking = async (data: NewPublicBookingData): Promise<Booking> => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const joinWaitlist = async (data: NewWaitlistEntryData): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};