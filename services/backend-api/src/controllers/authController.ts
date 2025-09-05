
import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { 
    CustomerLoginRequest, 
    CustomerSignupRequest,
    BusinessLoginRequest,
    BusinessSignupRequest,
    AdminLoginRequest,
    RefreshTokenRequest
} from '../types/auth';
import { logger } from '../utils/logger';
import { validate } from '../utils/validation';

export const customerLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as CustomerLoginRequest;
        const result = await authService.loginCustomer(email, password);
        
        // Set refresh token as httpOnly cookie for security
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        res.status(200).json({
            user: result.user,
            accessToken: result.accessToken
        });
    } catch (error) {
        logger.error('Customer login error:', error);
        const message = error instanceof Error ? error.message : 'Login failed';
        res.status(401).json({ message });
    }
};

export const customerSignup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, email, password, phone } = req.body as CustomerSignupRequest;
        const result = await authService.signupCustomer(fullName, email, password, phone);
        
        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.status(201).json({
            user: result.user,
            accessToken: result.accessToken
        });
    } catch (error) {
        logger.error('Customer signup error:', error);
        const message = error instanceof Error ? error.message : 'Signup failed';
        const status = message.includes('already exists') ? 409 : 500;
        res.status(status).json({ message });
    }
};

// Business authentication
export const businessLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as BusinessLoginRequest;
        const result = await authService.loginBusiness(email, password);
        
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.status(200).json({
            user: result.user,
            accessToken: result.accessToken
        });
    } catch (error) {
        logger.error('Business login error:', error);
        const message = error instanceof Error ? error.message : 'Login failed';
        res.status(401).json({ message });
    }
};

export const businessSignup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { businessName, email, password } = req.body as BusinessSignupRequest;
        const result = await authService.signupBusiness(businessName, email, password);
        
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.status(201).json({
            user: result.user,
            accessToken: result.accessToken
        });
    } catch (error) {
        logger.error('Business signup error:', error);
        const message = error instanceof Error ? error.message : 'Signup failed';
        const status = message.includes('already exists') ? 409 : 500;
        res.status(status).json({ message });
    }
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as AdminLoginRequest;
        const result = await authService.loginAdmin(email, password);
        
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.status(200).json({
            user: result.user,
            accessToken: result.accessToken
        });
    } catch (error) {
        logger.error('Admin login error:', error);
        const message = error instanceof Error ? error.message : 'Login failed';
        res.status(401).json({ message });
    }
};

// Token refresh
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        const userType = req.body.userType || 'customer'; // default to customer
        
        if (!refreshToken) {
            res.status(401).json({ message: 'Refresh token required' });
            return;
        }
        
        const result = await authService.refreshAccessToken(refreshToken, userType);
        
        // Update refresh token cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.status(200).json({ accessToken: result.accessToken });
    } catch (error) {
        logger.error('Token refresh error:', error);
        res.clearCookie('refreshToken');
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        const userType = req.body.userType || 'customer';
        
        if (refreshToken) {
            await authService.logout(refreshToken, userType);
        }
        
        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout error:', error);
        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out' });
    }
};

// Logout from all devices
export const logoutFromAllDevices = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.body.userId;
        const userType = req.body.userType || 'customer';
        
        await authService.logoutFromAllDevices(userId, userType);
        
        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out from all devices' });
    } catch (error) {
        logger.error('Logout from all devices error:', error);
        res.status(500).json({ message: 'Logout failed' });
    }
};
