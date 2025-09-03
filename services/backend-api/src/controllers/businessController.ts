import express from 'express';
import * as businessService from '../services/businessService';
import * as dateFns from 'date-fns';

export const search = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { location, service } = req.query;

        if (typeof location !== 'string' && typeof service !== 'string') {
            res.status(400).json({ message: 'A location or service query parameter is required.' });
            return;
        }

        const businesses = await businessService.searchBusinesses({ 
            location: location as string | undefined, 
            service: service as string | undefined 
        });

        res.status(200).json(businesses);

    } catch (error) {
        console.error('Error searching businesses:', error);
        res.status(500).json({ message: 'An error occurred while searching for businesses.' });
    }
};

export const getById = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { id } = req.params;
        const business = await businessService.getBusinessById(id);

        if (!business) {
            res.status(404).json({ message: 'Business not found.' });
            return;
        }

        res.status(200).json(business);

    } catch (error) {
        console.error(`Error fetching business by ID ${req.params.id}:`, error);
        res.status(500).json({ message: 'An error occurred while fetching the business profile.' });
    }
};

export const getAvailability = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { id: businessId } = req.params;
        const { serviceId, staffId, date } = req.query;

        if (typeof serviceId !== 'string' || typeof staffId !== 'string' || typeof date !== 'string' || !dateFns.isValid(new Date(date as string))) {
            res.status(400).json({ message: 'Valid serviceId, staffId, and date (YYYY-MM-DD) are required.' });
            return;
        }

        const availableSlots = await businessService.getAvailableSlots(staffId, serviceId, new Date(date as string));

        res.status(200).json(availableSlots);

    } catch (error) {
        console.error('Error getting availability:', error);
        if (error instanceof Error) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'An error occurred while fetching availability.' });
    }
};