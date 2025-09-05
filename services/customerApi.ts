import { PublicCustomerUser, NewPublicBookingData, Booking, UpdateProfileData, ChangePasswordData, PublicBusinessProfile } from '../types';
import { API_BASE_URL } from '../utils/env';
import { getBusinessesByIds } from './marketplaceApi';

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

const getAuthHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
});

export const customerLogin = async (email: string, password: string): Promise<{ user: PublicCustomerUser, token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
    });
    return handleResponse(response);
};

export const customerSignup = async (full_name: string, email: string, password: string): Promise<{ user: PublicCustomerUser, token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/customer/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password }),
        credentials: 'include'
    });
    return handleResponse(response);
};

export const fetchMyBookings = async (token?: string): Promise<Booking[]> => {
    const response = await fetch(`${API_BASE_URL}/customer/me/bookings`, {
        headers: getAuthHeaders(token),
        credentials: 'include'
    });
    return handleResponse(response);
};

export const cancelMyBooking = async (bookingId: string, token?: string): Promise<Booking> => {
     const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        credentials: 'include'
    });
    return handleResponse(response);
}

export const submitReview = async (data: { booking_id: string, rating: number, comment: string }, token?: string) => {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
        credentials: 'include'
    });
    return handleResponse(response);
};

export const updateMyProfile = async (data: UpdateProfileData, token?: string): Promise<PublicCustomerUser> => {
    const response = await fetch(`${API_BASE_URL}/customer/me`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
        credentials: 'include'
    });
    return handleResponse(response);
};

export const changeMyPassword = async (data: ChangePasswordData, token?: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/customer/me/password`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
        credentials: 'include'
    });
    return handleResponse(response);
};

// --- Favorites API ---

export const addFavorite = async (businessId: string, token?: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/customer/me/favorites`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ businessId }),
        credentials: 'include'
    });
    return handleResponse(response);
};

export const removeFavorite = async (businessId: string, token?: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/customer/me/favorites/${businessId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
        credentials: 'include'
    });
    return handleResponse(response);
};

export const fetchMyFavorites = async (token?: string): Promise<PublicBusinessProfile[]> => {
    const response = await fetch(`${API_BASE_URL}/customer/me/favorites`, {
        headers: getAuthHeaders(token),
        credentials: 'include'
    });
    return handleResponse(response);
};