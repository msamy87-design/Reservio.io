
import { Response as ExpressResponse } from 'express';
import * as customerService from '../services/customerService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';


export const getMyBookings = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
    try {
        const customerId = req.customer?.id;

        if (!customerId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const bookings = await customerService.getBookingsByCustomerId(customerId);
        res.status(200).json(bookings);

    } catch (error) {
        console.error('Error fetching customer bookings:', error);
        res.status(500).json({ message: 'An error occurred while fetching bookings.' });
    }
};