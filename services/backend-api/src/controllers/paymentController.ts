
// FIX: Use named imports from express to avoid type conflicts.
import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';

// FIX: Use named imports for Request and Response types.
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const { serviceId } = req.body;

        if (!serviceId) {
            res.status(400).json({ message: 'Service ID is required.' });
            return;
        }

        const clientSecret = await paymentService.createPaymentIntent(serviceId);
        res.status(200).json({ clientSecret });

    } catch (error) {
        console.error('Error creating payment intent:', error);
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'An error occurred while creating the payment intent.' });
    }
};