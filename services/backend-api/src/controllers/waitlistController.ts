
import express from 'express';
import * as waitlistService from '../services/waitlistService';
import { NewWaitlistEntryData } from '../types/booking';

export const create = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const data: NewWaitlistEntryData = req.body;
        await waitlistService.createWaitlistEntry(data);
        res.status(201).json({ success: true, message: 'Successfully added to waitlist.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to join waitlist.' });
    }
};
