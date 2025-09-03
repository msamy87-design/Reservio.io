import express from 'express';
import { AuthenticatedBusinessRequest } from '../middleware/authMiddleware';
import * as businessService from '../services/businessService';
import { BookingStatus, ReviewStatus } from '../types/booking';
import { mockBookings, mockReviews } from '../data/mockData';
import * as reviewService from '../services/reviewService';


export const updateProfile = async (req: AuthenticatedBusinessRequest, res: express.Response): Promise<void> => {
    try {
        const businessId = req.business?.businessId;
        const { is_listed, public_image_url } = req.body;
        
        if (!businessId) {
             res.status(401).json({ message: 'Unauthorized: No associated business found for this user.' });
             return;
        }

        const updateData: Partial<{ is_listed: boolean; imageUrl: string }> = {};
        if (is_listed !== undefined) {
            updateData.is_listed = is_listed;
        }
        if (public_image_url) {
            updateData.imageUrl = public_image_url;
        }

        const updatedBusiness = await businessService.updateBusinessProfile(businessId, updateData);
        res.status(200).json(updatedBusiness);

    } catch (error) {
        console.error('Error updating business profile:', error);
         if (error instanceof Error) {
            if (error.message === 'Business not found') {
                 res.status(404).json({ message: 'Business not found.' });
                 return;
            }
        }
        res.status(500).json({ message: 'An error occurred while updating the business profile.' });
    }
};

export const updateBookingStatus = async (req: AuthenticatedBusinessRequest, res: express.Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body as { status: BookingStatus };
        // In a real app, verify this booking belongs to req.business.businessId
        const bookingIndex = mockBookings.findIndex(b => b.id === id);
        if (bookingIndex !== -1) {
            const updatedBooking = await reviewService.handleBookingCompletion(mockBookings[bookingIndex], status);
            res.status(200).json(updatedBooking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking status' });
    }
};

export const getReviews = async (req: AuthenticatedBusinessRequest, res: express.Response): Promise<void> => {
    try {
        // In a real app, filter reviews for req.business.businessId
        const reviews = await reviewService.getReviewsByBusiness();
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews' });
    }
};

export const updateReviewStatus = async (req: AuthenticatedBusinessRequest, res: express.Response): Promise<void> => {
    try {
        const { reviewId } = req.params;
        const { status } = req.body as { status: ReviewStatus };
        // In a real app, verify this review belongs to req.business.businessId
        const review = await reviewService.updateReviewStatus(reviewId, status);
        res.status(200).json(review);
    } catch(error) {
        if (error instanceof Error && error.message === 'Review not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error updating review status' });
    }
};