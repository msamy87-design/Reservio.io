
// FIX: Standardized express import to resolve type conflicts.
import { Request, Response } from 'express';
import * as bookingService from '../services/bookingService';
import { NewPublicBookingData } from '../types/booking';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// FIX: Explicitly typed Request and Response to resolve property access errors.
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const bookingData: NewPublicBookingData = req.body;

        if (!bookingData.businessId || !bookingData.serviceId || !bookingData.staffId || !bookingData.startTime || !bookingData.customer) {
            res.status(400).json({ message: 'Missing required booking information.' });
            return;
        }

        const newBooking = await bookingService.createPublicBooking(bookingData);
        res.status(201).json(newBooking);

    } catch (error) {
        console.error('Error creating public booking:', error);
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'An error occurred while creating the booking.' });
    }
};

// FIX: Explicitly typed Request and Response to resolve property access errors.
export const cancel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const customerId = req.customer?.id;

        if (!customerId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const cancelledBooking = await bookingService.cancelBooking(id, customerId);
        res.status(200).json(cancelledBooking);

    } catch (error) {
        console.error('Error cancelling booking:', error);
        if (error instanceof Error) {
            if (error.message === 'Booking not found' || error.message === 'Forbidden') {
                 res.status(404).json({ message: 'Booking not found or you do not have permission to cancel it.' });
                 return;
            }
        }
        res.status(500).json({ message: 'An error occurred while cancelling the booking.' });
    }
};