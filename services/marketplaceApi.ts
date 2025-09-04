import { PublicBusinessProfile, NewPublicBookingData, Booking, PaymentIntentDetails, NewWaitlistEntryData } from '../types';
import { API_BASE_URL } from '../utils/env';

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
    }
    return data;
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