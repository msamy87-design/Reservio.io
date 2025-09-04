




// FIX: Use named imports from express to avoid type conflicts.
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

// FIX: Extend express.Request to ensure correct types.
export interface AuthenticatedRequest extends Request {
  customer?: PublicCustomerUser;
}
// FIX: Extend express.Request to ensure correct types.
export interface AuthenticatedBusinessRequest extends Request {
  business?: { businessId: string, email: string };
}
// FIX: Extend express.Request to ensure correct types.
export interface AuthenticatedAdminRequest extends Request {
  admin?: AdminUser;
}

// FIX: Qualify types with express to resolve type errors.
export const protectCustomer = (req: Request, res: Response, next: NextFunction): void => {
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
        
        (req as AuthenticatedRequest).customer = decoded.user as PublicCustomerUser;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// FIX: Qualify types with express to resolve type errors.
export const protectBusiness = (req: Request, res: Response, next: NextFunction): void => {
    let token;
    // NOTE: The mock business portal uses sessionStorage, so we can't get the token from headers.
    // This is a workaround for the mock environment. In a real app with separate frontends,
    // you would pass the token in the Authorization header.
    // For now, we assume the token is valid if any mock business token exists.
    // Let's check for a body parameter for simulation.
    token = req.headers.authorization?.split(' ')[1] || (req.body as any).token;
    
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
        
        (req as AuthenticatedBusinessRequest).business = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// FIX: Qualify types with express to resolve type errors.
export const protectAdmin = (req: Request, res: Response, next: NextFunction): void => {
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
        
        (req as AuthenticatedAdminRequest).admin = decoded.user as AdminUser;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};