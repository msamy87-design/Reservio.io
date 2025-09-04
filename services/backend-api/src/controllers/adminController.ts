// FIX: Use default import for express to avoid type conflicts.
import express from 'express';
import * as adminService from '../services/adminService';
// FIX: Correctly import shared types to resolve module error.
import { BusinessVerificationStatus } from '../../../../types';

// FIX: Use qualified express types to resolve type errors.
export const getStats = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const stats = await adminService.getPlatformStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching platform statistics.' });
    }
};

// FIX: Use qualified express types to resolve type errors.
export const getBusinesses = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const businesses = await adminService.getAllBusinesses();
        res.status(200).json(businesses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching businesses.' });
    }
};

// FIX: Use qualified express types to resolve type errors.
export const updateBusinessStatus = async (req: express.Request, res: express.Response): Promise<void> => {
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