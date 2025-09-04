import { PublicCustomerUser, NewPublicBookingData, Booking, UpdateProfileData, ChangePasswordData, PublicBusinessProfile } from '../types';
import { API_BASE_URL } from '../utils/env';
import { getBusinessesByIds } from './marketplaceApi';

const handleResponse = async (response: Response) => {
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
    }
    return data;
};

const getAuthHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
});

export const customerLogin = async (email: string, password: string): Promise<{ user: PublicCustomerUser, token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
};

export const customerSignup = async (full_name: string, email: string, password: string): Promise<{ user: PublicCustomerUser, token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/customer/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password }),
    });
    return handleResponse(response);
};

export const fetchMyBookings = async (token: string): Promise<Booking[]> => {
    const response = await fetch(`${API_BASE_URL}/customer/me/bookings`, {
        headers: getAuthHeaders(token),
    });
    return handleResponse(response);
};

export const cancelMyBooking = async (bookingId: string, token: string): Promise<Booking> => {
     const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
    });
    return handleResponse(response);
}

export const submitReview = async (data: { booking_id: string, rating: number, comment: string }, token: string) => {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const updateMyProfile = async (data: UpdateProfileData, token: string): Promise<PublicCustomerUser> => {
    const response = await fetch(`${API_BASE_URL}/customer/me`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const changeMyPassword = async (data: ChangePasswordData, token: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/customer/me/password`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

// --- Favorites API ---

export const addFavorite = async (businessId: string, token: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/customer/me/favorites`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ businessId }),
    });
    return handleResponse(response);
};

export const removeFavorite = async (businessId: string, token: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/customer/me/favorites/${businessId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });
    return handleResponse(response);
};

export const fetchMyFavorites = async (token: string): Promise<PublicBusinessProfile[]> => {
    const response = await fetch(`${API_BASE_URL}/customer/me/favorites`, {
        headers: getAuthHeaders(token),
    });
    return handleResponse(response);
};