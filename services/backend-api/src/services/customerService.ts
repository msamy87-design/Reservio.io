
import { mockBookings, mockReviews } from '../data/mockData';
import { Booking } from '../types/booking';

/**
 * Fetches all bookings for a given customer ID.
 * @param customerId - The ID of the customer.
 * @returns A promise that resolves to an array of bookings.
 */
export const getBookingsByCustomerId = async (customerId: string): Promise<Booking[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const customerBookings = mockBookings.filter(b => b.customer.id === customerId);
            const augmentedBookings = customerBookings.map(b => ({
                ...b,
                review_submitted: mockReviews.some(r => r.booking_id === b.id)
            }));
            resolve(augmentedBookings);
        }, 500);
    });
};