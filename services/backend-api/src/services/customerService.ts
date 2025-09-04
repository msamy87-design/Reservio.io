import { mockBookings } from '../data/mockData';
import { Booking } from '../types/booking';

export const getBookingsByCustomerId = async (customerId: string): Promise<Booking[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const customerBookings = mockBookings.filter(b => b.customer.id === customerId);
            resolve(customerBookings);
        }, 300);
    });
};
