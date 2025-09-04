

import { PublicCustomerUser, Booking, NewReviewData, Review } from '../types';
import { API_BASE_URL } from '../utils/env';

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
    }
    return data;
};

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

export const getMyBookings = async (token: string): Promise<Booking[]> => {
    const response = await fetch(`${API_BASE_URL}/customer/me/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const cancelMyBooking = async (bookingId: string, token: string): Promise<Booking> => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
};

export const submitReview = async (reviewData: NewReviewData, token: string): Promise<Review> => {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(reviewData),
    });
    return handleResponse(response);
}