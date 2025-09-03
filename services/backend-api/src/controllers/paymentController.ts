import express from 'express';
import * as paymentService from '../services/paymentService';

export const create = async (req: express.Request, res: express.Response): Promise<void> => {
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