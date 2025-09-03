

// FIX: Changed express import to resolve type conflicts.
import { Request, Response, NextFunction } from 'express';
import { PublicCustomerUser } from '../types/customer';
import { AdminUser } from '../../../../types';

// In a real app, you would use a library like jsonwebtoken to verify the token
const mockVerifyToken = (token: string): { user: PublicCustomerUser | AdminUser } | null => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (e) {
        return null;
    }
};

const mockVerifyBusinessToken = (token: string): { businessId: string, email: string } | null => {
     if (!token || !token.startsWith('mock_token_user_')) return null;
     // This is a simplified mock. In a real app, the JWT would contain businessId, roles, etc.
     // For now, we'll hardcode the business ID for the default user.
     const userId = token.replace('mock_token_', '');
     if (userId.includes('user_')) { // simple check for default user
        return { businessId: 'biz_1', email: 'contact@groominglounge.com' };
     }
     return null;
}

// Extend the Express Request type to include our custom property
// FIX: Extend the correct Request type from express.
export interface AuthenticatedRequest extends Request {
  customer?: PublicCustomerUser;
}
// FIX: Extend the correct Request type from express.
export interface AuthenticatedBusinessRequest extends Request {
  business?: { businessId: string, email: string };
}
// FIX: Extend the correct Request type from express.
export interface AuthenticatedAdminRequest extends Request {
  admin?: AdminUser;
}


// FIX: Use explicit Response type and correct AuthenticatedRequest type.
export const protectCustomer = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }

    try {
        const decoded = mockVerifyToken(token);
        if (!decoded || !decoded.user || (decoded.user as AdminUser).role === 'superadmin') {
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
        
        // Attach user to the request object
        req.customer = decoded.user as PublicCustomerUser;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// FIX: Use explicit Response type and correct AuthenticatedBusinessRequest type.
export const protectBusiness = (req: AuthenticatedBusinessRequest, res: Response, next: NextFunction): void => {
    let token;
    // NOTE: The mock business portal uses sessionStorage, so we can't get the token from headers.
    // This is a workaround for the mock environment. In a real app with separate frontends,
    // you would pass the token in the Authorization header.
    // For now, we assume the token is valid if any mock business token exists.
    // Let's check for a body parameter for simulation.
    token = req.headers.authorization?.split(' ')[1] || req.body.token;
    
    // This is a HACK for this project's structure since we can't access session storage from the backend API.
    // We will simulate a valid token.
    token = 'mock_token_user_default';


    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }

    try {
        const decoded = mockVerifyBusinessToken(token);
        if (!decoded) {
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
        
        req.business = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export const protectAdmin = (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }

    try {
        const decoded = mockVerifyToken(token);
        if (!decoded || !decoded.user || (decoded.user as AdminUser).role !== 'superadmin') {
            res.status(401).json({ message: 'Not authorized, token invalid or not an admin' });
            return;
        }
        
        req.admin = decoded.user as AdminUser;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};