




// FIX: Use named imports from express to avoid type conflicts.
import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { CustomerLoginRequest, CustomerSignupRequest } from '../types/auth';

// FIX: Use named imports for Request and Response types.
export const customerLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as CustomerLoginRequest;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required.' });
            return;
        }
        const result = await authService.loginCustomer(email, password);
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(401).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'An internal error occurred.' });
    }
};

// FIX: Use named imports for Request and Response types.
export const customerSignup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { full_name, email, password } = req.body as CustomerSignupRequest;
        if (!full_name || !email || !password) {
            res.status(400).json({ message: 'Full name, email, and password are required.' });
            return;
        }
        const result = await authService.signupCustomer(full_name, email, password);
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(409).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'An internal error occurred.' });
    }
};

// FIX: Use named imports for Request and Response types.
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required.' });
            return;
        }
        const result = await authService.loginAdmin(email, password);
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(401).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'An internal error occurred.' });
    }
};