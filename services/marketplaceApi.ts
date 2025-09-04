import { PublicBusinessProfile, NewPublicBookingData, Booking, PaymentIntentDetails, NewWaitlistEntryData } from '../types';
import { API_BASE_URL } from '../utils/env';

const parseJSONSafe = async (response: Response) => {
    if (response.status === 204) return null;
    const text = await response.text();
    const trimmed = (text || '').trim();
    if (!trimmed) return null;
    // Strip common XSSI prefixes like )]}',\n
    const stripped = trimmed.replace(/^\)\]\}',?\s*/, '');
    try {
        return JSON.parse(stripped);
    } catch (e: any) {
        throw new Error(`Invalid JSON from ${response.url ?? 'request'} (status ${response.status}): ${e.message}. Body starts with: ${trimmed.slice(0, 80)}`);
    }
};

const handleResponse = async (response: Response) => {
    const data = await parseJSONSafe(response);
    if (!response.ok) {
        const message = (data && (data.message || (data.error && (data.error.message || data.error)))) || `API request failed with status ${response.status}`;
        throw new Error(message);
    }
    return data as any;
};

export const searchBusinesses = async (location: string, service: string): Promise<PublicBusinessProfile[]> => {
    const queryParams = new URLSearchParams();
    if (location) queryParams.append('location', location);
    if (service) queryParams.append('service', service);

    const response = await fetch(`${API_BASE_URL}/businesses/search?${queryParams.toString()}`);
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
    const queryParams = new URLSearchParams({ serviceId, staffId, date });
    const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/availability?${queryParams.toString()}`);
    return handleResponse(response);
}

export const createPublicBooking = async (data: NewPublicBookingData): Promise<Booking> => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const createPaymentIntent = async (details: PaymentIntentDetails): Promise<{ clientSecret: string; depositAmount: number, depositReason: string }> => {
    const response = await fetch(`${API_BASE_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
    });
    return handleResponse(response);
};

export const joinWaitlist = async (data: NewWaitlistEntryData): Promise<{success: boolean}> => {
    const response = await fetch(`${API_BASE_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};