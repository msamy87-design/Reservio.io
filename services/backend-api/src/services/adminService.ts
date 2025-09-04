
import { PlatformStats, BusinessForAdmin, BusinessVerificationStatus } from '../../../../types';
import { mockBusinesses, mockCustomers, mockBookings, mockServices } from '../data/mockData';

export const getPlatformStats = async (): Promise<PlatformStats> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const total_revenue = mockBookings
                .filter(b => b.payment_status === 'deposit_paid' || b.payment_status === 'paid_in_full')
                .reduce((sum, booking) => {
                    const service = mockServices.find(s => s.id === booking.service.id);
                    return sum + (service?.price || 0); // Simplified calculation
                }, 0);
            
            resolve({
                total_revenue,
                total_businesses: mockBusinesses.length,
                total_customers: mockCustomers.length,
                total_bookings: mockBookings.length,
            });
        }, 500);
    });
};

export const getAllBusinesses = async (): Promise<BusinessForAdmin[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([...mockBusinesses]);
        }, 500);
    });
};

export const updateBusinessStatus = async (id: string, status: BusinessVerificationStatus): Promise<BusinessForAdmin> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = mockBusinesses.findIndex(b => b.id === id);
            if (index === -1) {
                return reject(new Error('Business not found'));
            }
            mockBusinesses[index].verification_status = status;
            resolve(mockBusinesses[index]);
        }, 300);
    });
};