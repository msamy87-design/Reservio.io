
import express from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as reviewService from '../services/reviewService';
import { NewReviewData } from '../types/booking';

export const create = async (req: AuthenticatedRequest, res: express.Response): Promise<void> => {
    try {
        const customerId = req.customer?.id;
        if (!customerId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const reviewData: NewReviewData = req.body;
        if (!reviewData.booking_id || !reviewData.rating) {
            res.status(400).json({ message: 'Missing required review information.' });
            return;
        }

        const newReview = await reviewService.createReview(reviewData, customerId);
        res.status(201).json(newReview);

    } catch (error) {
        console.error('Error creating review:', error);
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'An error occurred while submitting the review.' });
    }
};
