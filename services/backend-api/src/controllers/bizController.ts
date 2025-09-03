

import { AuthenticatedBusinessRequest } from '../middleware/authMiddleware';
import * as businessService from '../services/businessService';
// FIX: Import Response type directly from express.
import { Response } from 'express';

// FIX: Use explicit Response type. AuthenticatedBusinessRequest will be fixed in middleware.
export const updateProfile = async (req: AuthenticatedBusinessRequest, res: Response): Promise<void> => {
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