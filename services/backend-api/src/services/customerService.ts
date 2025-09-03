
import { mockBookings } from '../data/mockData';
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
            resolve(customerBookings);
        }, 500);
    });
};
