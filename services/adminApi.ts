

import { AdminUser, PlatformStats, BusinessForAdmin, BusinessVerificationStatus } from '../types';
import { API_BASE_URL } from '../utils/env';

const handleResponse = async (response: Response) => {
    if (response.status === 204) return null; // Handle No Content response
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
    }
    return data;
};

export const adminLogin = async (email: string, password: string): Promise<{ user: AdminUser, token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
};

const getAuthHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
});

export const fetchStats = async (token: string): Promise<PlatformStats> => {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: getAuthHeaders(token),
    });
    return handleResponse(response);
};

export const fetchBusinesses = async (token: string): Promise<BusinessForAdmin[]> => {
    const response = await fetch(`${API_BASE_URL}/admin/businesses`, {
        headers: getAuthHeaders(token),
    });
    return handleResponse(response);
};

export const updateBusinessStatus = async (businessId: string, status: BusinessVerificationStatus, token: string): Promise<BusinessForAdmin> => {
    const response = await fetch(`${API_BASE_URL}/admin/businesses/${businessId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
};