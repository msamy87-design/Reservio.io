
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import * as adminService from '../services/adminService';
import { BusinessVerificationStatus } from '../../../../types';

export const getStats = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
    try {
        const stats = await adminService.getPlatformStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching platform statistics.' });
    }
};

export const getBusinesses = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
    try {
        const businesses = await adminService.getAllBusinesses();
        res.status(200).json(businesses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching businesses.' });
    }
};

export const updateBusinessStatus = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
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