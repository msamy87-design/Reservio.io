import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as customerService from '../services/customerService';
import { UpdateProfileData, ChangePasswordData } from '../types/customer';

export const getMyBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        res.status(500).json({ message: 'An error occurred while fetching your bookings.' });
    }
};

export const updateMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer?.id;
        if (!customerId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const data: UpdateProfileData = req.body;
        const updatedUser = await customerService.updateCustomerProfile(customerId, data);
        res.status(200).json(updatedUser);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An error occurred while updating the profile.' });
        }
    }
};

export const changeMyPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer?.id;
        if (!customerId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const data: ChangePasswordData = req.body;
        await customerService.changeCustomerPassword(customerId, data);
        res.status(200).json({ success: true });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An error occurred while changing the password.' });
        }
    }
};

export const getMyFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer?.id;
        if (!customerId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const favorites = await customerService.getFavoriteBusinessDetails(customerId);
        res.status(200).json(favorites);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching favorites.' });
    }
};

export const addMyFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer?.id;
        if (!customerId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { businessId } = req.body;
        if (!businessId) {
            res.status(400).json({ message: 'Business ID is required.' });
            return;
        }
        await customerService.addFavoriteBusiness(customerId, businessId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error adding favorite.' });
    }
};

export const removeMyFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer?.id;
        if (!customerId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { businessId } = req.params;
        await customerService.removeFavoriteBusiness(customerId, businessId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error removing favorite.' });
    }
};