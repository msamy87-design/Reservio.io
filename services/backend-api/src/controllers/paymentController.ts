
import { Request, Response } from 'express';

export const create = async (req: Request, res: Response): Promise<void> => {
    res.status(501).json({ 
        message: 'Payment processing has been disabled. Please contact support for manual payment processing.' 
    });
};
