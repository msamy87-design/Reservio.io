
// FIX: Standardized express import to resolve type conflicts.
import { Request, Response } from 'express';
import * as adminService from '../services/adminService';
import { BusinessVerificationStatus } from '../../../../types';

// FIX: Explicitly typed Request and Response to resolve property access errors.
export const getStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await adminService.getPlatformStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching platform statistics.' });
    }
};

// FIX: Explicitly typed Request and Response to resolve property access errors.
export const getBusinesses = async (req: Request, res: Response): Promise<void> => {
    try {
        const businesses = await adminService.getAllBusinesses();
        res.status(200).json(businesses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching businesses.' });
    }
};

// FIX: Explicitly typed Request and Response to resolve property access errors.
export const updateBusinessStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['approved', 'pending', 'suspended'].includes(status)) {
            res.status(400).json({ message: 'Invalid status provided.' });
            return;
        }

        const updatedBusiness = await adminService.updateBusinessStatus(id, status as BusinessVerificationStatus);
        res.status(200).json(updatedBusiness);
    } catch (error) {
        if (error instanceof Error && error.message === 'Business not found') {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Error updating business status.' });
        }
    }
};