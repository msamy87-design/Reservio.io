
import { Request, Response, NextFunction } from 'express';
import { JWTUtil } from '../utils/jwt';
import { BusinessUser, CustomerUser, AdminUser } from '../models/User';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  customer?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface AuthenticatedBusinessRequest extends Request {
  business?: {
    id: string;
    email: string;
    businessName: string;
    role: string;
  };
}

export interface AuthenticatedAdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export const protectCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = JWTUtil.extractTokenFromHeader(req.headers.authorization);
        
        if (!token) {
            res.status(401).json({ message: 'Access denied. No token provided.' });
            return;
        }

        const decoded = JWTUtil.verifyToken(token);
        
        if (decoded.type !== 'access') {
            res.status(401).json({ message: 'Invalid token type' });
            return;
        }

        // Verify user exists and is active
        const user = await CustomerUser.findById(decoded.userId).select('email fullName isActive');
        if (!user || !user.isActive) {
            res.status(401).json({ message: 'User not found or inactive' });
            return;
        }

        (req as AuthenticatedRequest).customer = {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName
        };
        
        next();
    } catch (error) {
        logger.error('Customer authentication error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const protectBusiness = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = JWTUtil.extractTokenFromHeader(req.headers.authorization);
        
        if (!token) {
            res.status(401).json({ message: 'Access denied. No token provided.' });
            return;
        }

        const decoded = JWTUtil.verifyToken(token);
        
        if (decoded.type !== 'access') {
            res.status(401).json({ message: 'Invalid token type' });
            return;
        }

        // Verify business user exists and is active
        const user = await BusinessUser.findById(decoded.userId).select('email businessName role isActive');
        if (!user || !user.isActive) {
            res.status(401).json({ message: 'User not found or inactive' });
            return;
        }

        (req as AuthenticatedBusinessRequest).business = {
            id: user._id.toString(),
            email: user.email,
            businessName: user.businessName,
            role: user.role
        };
        
        next();
    } catch (error) {
        logger.error('Business authentication error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const protectAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = JWTUtil.extractTokenFromHeader(req.headers.authorization);
        
        if (!token) {
            res.status(401).json({ message: 'Access denied. No token provided.' });
            return;
        }

        const decoded = JWTUtil.verifyToken(token);
        
        if (decoded.type !== 'access') {
            res.status(401).json({ message: 'Invalid token type' });
            return;
        }

        // Verify admin user exists and is active
        const user = await AdminUser.findById(decoded.userId).select('email fullName role isActive');
        if (!user || !user.isActive || user.role !== 'superadmin') {
            res.status(401).json({ message: 'Admin access denied' });
            return;
        }

        (req as AuthenticatedAdminRequest).admin = {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            role: user.role
        };
        
        next();
    } catch (error) {
        logger.error('Admin authentication error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to validate refresh tokens
export const validateRefreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            res.status(401).json({ message: 'Refresh token required' });
            return;
        }

        const decoded = JWTUtil.verifyToken(refreshToken);
        
        if (decoded.type !== 'refresh') {
            res.status(401).json({ message: 'Invalid token type' });
            return;
        }

        // Check if refresh token exists in user's token list
        let user;
        if (decoded.role === 'superadmin') {
            user = await AdminUser.findById(decoded.userId);
        } else if (['Owner', 'Manager', 'Assistant'].includes(decoded.role)) {
            user = await BusinessUser.findById(decoded.userId);
        } else {
            user = await CustomerUser.findById(decoded.userId);
        }

        if (!user || !user.isActive || !user.refreshTokens.includes(refreshToken)) {
            res.status(401).json({ message: 'Invalid refresh token' });
            return;
        }

        req.body.decodedToken = decoded;
        req.body.user = user;
        next();
    } catch (error) {
        logger.error('Refresh token validation error:', error);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};
