
import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';
import { PaymentIntentDetails } from '../../../../types';

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const details: PaymentIntentDetails = req.body;

        if (!details.serviceId || !details.businessId || !details.staffId || !details.startTime) {
            res.status(400).json({ message: 'Business, Service, Staff, and Start Time are required.' });
            return;
        }

        const result = await paymentService.createPaymentIntent(details);
        res.status(200).json(result);

    } catch (error) {
        console.error('Error creating payment intent:', error);
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'An error occurred while creating the payment intent.' });
    }
};
