
import { Request, Response } from 'express';
import * as businessService from '../services/businessService';
import { logger } from '../utils/logger';

export const search = async (req: Request, res: Response): Promise<void> => {
    try {
        const { service, location, minPrice, maxPrice, minRating, date, lat, lon } = req.query;
        
        const filters = {
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            minRating: minRating ? Number(minRating) : undefined,
            date: date as string | undefined,
        };

        const results = await businessService.searchBusinesses(
            service as string, 
            location as string, 
            filters,
            lat as string | undefined,
            lon as string | undefined
        );
        res.status(200).json(results);
    } catch (error) {
        logger.error('Error searching businesses:', { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });
        res.status(500).json({ message: 'An error occurred while searching for businesses.' });
    }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const business = await businessService.getBusinessById(id);
        if (business) {
            res.status(200).json(business);
        } else {
            res.status(404).json({ message: 'Business not found.' });
        }
    } catch (error) {
        logger.error('Error fetching business by ID:', { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });
        res.status(500).json({ message: 'An error occurred while fetching the business profile.' });
    }
};

export const getMultipleByIds = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            res.status(400).json({ message: 'Request body must contain an array of IDs.' });
            return;
        }
        const businesses = await businessService.getBusinessesByIds(ids);
        res.status(200).json(businesses);
    } catch (error) {
        logger.error('Error fetching multiple businesses by IDs:', { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });
        res.status(500).json({ message: 'An error occurred while fetching business profiles.' });
    }
}

export const getAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { serviceId, staffId, date } = req.query;
        if (!serviceId || !date) {
            res.status(400).json({ message: 'Service ID and date are required.' });
            return;
        }
        const availability = await businessService.getAvailability(id, serviceId as string, staffId as string, date as string);
        res.status(200).json(availability);
    } catch (error) {
        logger.error('Error fetching availability:', { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined });
        res.status(500).json({ message: 'An error occurred while fetching availability.' });
    }
};
