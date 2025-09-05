
import { mockBookings, mockCustomerUsers, mockReviews } from '../data/mockData';
import { Booking } from '../types/booking';
import { ChangePasswordData, PublicCustomerUser, UpdateProfileData } from '../types/customer';
import * as businessService from './businessService';

const mockHash = (password: string) => `hashed_${password}`;
const mockCompare = (password: string, hash: string) => mockHash(password) === hash;

export const getBookingsByCustomerId = async (customerId: string): Promise<Booking[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const customerBookings = mockBookings
                .filter(b => b.customer.id === customerId)
                .map(b => {
                    const reviewSubmitted = mockReviews.some(r => r.booking_id === b.id);
                    return { ...b, review_submitted: reviewSubmitted };
                });
            resolve(customerBookings);
        }, 300);
    });
};

export const updateCustomerProfile = async (customerId: string, data: UpdateProfileData): Promise<PublicCustomerUser> => {
    const userIndex = mockCustomerUsers.findIndex(u => u.id === customerId);
    if (userIndex === -1) {
        throw new Error('User not found');
    }
    // Check if email is already taken by another user
    if (mockCustomerUsers.some(u => u.email === data.email && u.id !== customerId)) {
        throw new Error('Email is already in use');
    }

    // Update with mapped properties
    mockCustomerUsers[userIndex] = { 
        ...mockCustomerUsers[userIndex], 
        fullName: data.full_name,
        email: data.email 
    };
    return {
        id: mockCustomerUsers[userIndex].id,
        full_name: mockCustomerUsers[userIndex].fullName,
        email: mockCustomerUsers[userIndex].email,
        favoriteBusinessIds: mockCustomerUsers[userIndex].favoriteBusinessIds
    };
};

export const changeCustomerPassword = async (customerId: string, data: ChangePasswordData): Promise<void> => {
    const userIndex = mockCustomerUsers.findIndex(u => u.id === customerId);
    if (userIndex === -1) {
        throw new Error('User not found');
    }

    // For mock implementation, we'll simulate password validation
    // In a real implementation, this would check against stored password hash
    console.log(`[customerService] Password change requested for user ${customerId}`);
    
    // Simulate password update (mock data doesn't store passwords)
    // user.passwordHash = mockHash(data.new_password);
};

export const addFavoriteBusiness = async (customerId: string, businessId: string): Promise<void> => {
    const user = mockCustomerUsers.find(u => u.id === customerId);
    if (user) {
        if (!user.favoriteBusinessIds.includes(businessId)) {
            user.favoriteBusinessIds.push(businessId);
        }
    }
};

export const removeFavoriteBusiness = async (customerId: string, businessId: string): Promise<void> => {
    const user = mockCustomerUsers.find(u => u.id === customerId);
    if (user) {
        user.favoriteBusinessIds = user.favoriteBusinessIds.filter(id => id !== businessId);
    }
};

export const getFavoriteBusinessDetails = async (customerId: string) => {
    const user = mockCustomerUsers.find(u => u.id === customerId);
    if (!user) {
        return [];
    }
    return businessService.getBusinessesByIds(user.favoriteBusinessIds);
};
