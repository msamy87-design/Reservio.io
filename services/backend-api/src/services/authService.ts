
import { BusinessUser, CustomerUser, AdminUser, IBusinessUser, ICustomerUser, IAdminUser } from '../models/User';
import { JWTUtil } from '../utils/jwt';
import { logger } from '../utils/logger';
import { AuthResponse, AdminAuthResponse, BusinessAuthResponse } from '../types/auth';
import { Types } from 'mongoose';
import { performanceMonitoring } from './performanceMonitoringService';


export const loginCustomer = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        // Find user and include password for comparison
        const user = await CustomerUser.findOne({ email }).select('+password');
        
        if (!user || !user.isActive) {
            throw new Error('Invalid email or password');
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const tokenPayload = {
            userId: (user._id as Types.ObjectId).toString(),
            email: user.email,
            role: 'customer'
        };
        
        const { accessToken, refreshToken } = JWTUtil.generateTokenPair(tokenPayload);
        
        // Store refresh token
        user.refreshTokens.push(refreshToken);
        // Keep only last 5 refresh tokens to prevent unlimited growth
        if (user.refreshTokens.length > 5) {
            user.refreshTokens = user.refreshTokens.slice(-5);
        }
        await user.save();

        const publicUser = {
            id: (user._id as Types.ObjectId).toString(),
            fullName: user.fullName,
            email: user.email,
            favoriteBusinessIds: user.favoriteBusinessIds
        };

        logger.info(`Customer login successful: ${email}`);
        
        // Track successful login
        performanceMonitoring.trackAuthEvent('login', 'customer', true, publicUser.id);
        
        return {
            user: publicUser,
            accessToken,
            refreshToken
        };
    } catch (error) {
        logger.error(`Customer login failed for ${email}:`, error);
        
        // Track failed login
        performanceMonitoring.trackAuthEvent('login', 'customer', false);
        
        throw error;
    }
};

export const signupCustomer = async (fullName: string, email: string, password: string, phone?: string): Promise<AuthResponse> => {
    try {
        // Check if user already exists
        const existingUser = await CustomerUser.findOne({ email });
        if (existingUser) {
            throw new Error('An account with this email already exists');
        }

        // Create new user
        const newUser = new CustomerUser({
            fullName,
            email,
            password,
            phone,
            favoriteBusinessIds: []
        });

        await newUser.save();

        // Generate tokens
        const tokenPayload = {
            userId: (newUser._id as Types.ObjectId).toString(),
            email: newUser.email,
            role: 'customer'
        };
        
        const { accessToken, refreshToken } = JWTUtil.generateTokenPair(tokenPayload);
        
        // Store refresh token
        newUser.refreshTokens.push(refreshToken);
        await newUser.save();

        const publicUser = {
            id: (newUser._id as Types.ObjectId).toString(),
            fullName: newUser.fullName,
            email: newUser.email,
            favoriteBusinessIds: newUser.favoriteBusinessIds
        };

        logger.info(`Customer signup successful: ${email}`);
        
        // Track successful signup
        performanceMonitoring.trackAuthEvent('signup', 'customer', true, publicUser.id);
        
        return {
            user: publicUser,
            accessToken,
            refreshToken
        };
    } catch (error) {
        logger.error(`Customer signup failed for ${email}:`, error);
        throw error;
    }
};

export const loginBusiness = async (email: string, password: string): Promise<BusinessAuthResponse> => {
    try {
        // Find user and include password for comparison
        const user = await BusinessUser.findOne({ email }).select('+password');
        
        if (!user || !user.isActive) {
            throw new Error('Invalid email or password');
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const tokenPayload = {
            userId: (user._id as Types.ObjectId).toString(),
            email: user.email,
            role: user.role
        };
        
        const { accessToken, refreshToken } = JWTUtil.generateTokenPair(tokenPayload);
        
        // Store refresh token
        user.refreshTokens.push(refreshToken);
        if (user.refreshTokens.length > 5) {
            user.refreshTokens = user.refreshTokens.slice(-5);
        }
        await user.save();

        const publicUser = {
            id: (user._id as Types.ObjectId).toString(),
            businessName: user.businessName,
            businessId: user.businessId || (user._id as Types.ObjectId).toString(),
            email: user.email,
            role: user.role,
            staffId: user.staffId
        };

        logger.info(`Business login successful: ${email}`);
        
        return {
            user: publicUser,
            accessToken,
            refreshToken
        };
    } catch (error) {
        logger.error(`Business login failed for ${email}:`, error);
        throw error;
    }
};

export const signupBusiness = async (businessName: string, email: string, password: string): Promise<BusinessAuthResponse> => {
    try {
        // Check if user already exists
        const existingUser = await BusinessUser.findOne({ email });
        if (existingUser) {
            throw new Error('An account with this email already exists');
        }

        // Create new business user
        const newUser = new BusinessUser({
            businessName,
            email,
            password,
            role: 'Owner',
            staffId: new Types.ObjectId().toString(), // Generate a unique staffId
        });

        await newUser.save();

        // Generate tokens
        const tokenPayload = {
            userId: (newUser._id as Types.ObjectId).toString(),
            email: newUser.email,
            role: newUser.role
        };
        
        const { accessToken, refreshToken } = JWTUtil.generateTokenPair(tokenPayload);
        
        // Store refresh token
        newUser.refreshTokens.push(refreshToken);
        await newUser.save();

        const publicUser = {
            id: (newUser._id as Types.ObjectId).toString(),
            businessName: newUser.businessName,
            businessId: newUser.businessId || (newUser._id as Types.ObjectId).toString(),
            email: newUser.email,
            role: newUser.role,
            staffId: newUser.staffId
        };

        logger.info(`Business signup successful: ${email}`);
        
        return {
            user: publicUser,
            accessToken,
            refreshToken
        };
    } catch (error) {
        logger.error(`Business signup failed for ${email}:`, error);
        throw error;
    }
};

export const loginAdmin = async (email: string, password: string): Promise<AdminAuthResponse> => {
    try {
        // Find admin user and include password for comparison
        const user = await AdminUser.findOne({ email }).select('+password');
        
        if (!user || !user.isActive || user.role !== 'superadmin') {
            throw new Error('Invalid admin credentials');
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid admin credentials');
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const tokenPayload = {
            userId: (user._id as Types.ObjectId).toString(),
            email: user.email,
            role: user.role
        };
        
        const { accessToken, refreshToken } = JWTUtil.generateTokenPair(tokenPayload);
        
        // Store refresh token
        user.refreshTokens.push(refreshToken);
        if (user.refreshTokens.length > 5) {
            user.refreshTokens = user.refreshTokens.slice(-5);
        }
        await user.save();

        const publicUser = {
            id: (user._id as Types.ObjectId).toString(),
            fullName: user.fullName,
            email: user.email,
            role: user.role
        };

        logger.info(`Admin login successful: ${email}`);
        
        return {
            user: publicUser,
            accessToken,
            refreshToken
        };
    } catch (error) {
        logger.error(`Admin login failed for ${email}:`, error);
        throw error;
    }
};

// Refresh token functionality
export const refreshAccessToken = async (refreshToken: string, userType: 'customer' | 'business' | 'admin'): Promise<{ accessToken: string; refreshToken: string }> => {
    try {
        const decoded = JWTUtil.verifyToken(refreshToken);
        
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }

        let user: ICustomerUser | IBusinessUser | IAdminUser | null = null;
        
        // Find user based on type
        if (userType === 'customer') {
            user = await CustomerUser.findById(decoded.userId);
        } else if (userType === 'business') {
            user = await BusinessUser.findById(decoded.userId);
        } else {
            user = await AdminUser.findById(decoded.userId);
        }

        if (!user || !user.isActive || !user.refreshTokens.includes(refreshToken)) {
            throw new Error('Invalid refresh token');
        }

        // Generate new tokens
        const tokenPayload = {
            userId: (user._id as Types.ObjectId).toString(),
            email: user.email,
            role: decoded.role
        };
        
        const { accessToken, refreshToken: newRefreshToken } = JWTUtil.generateTokenPair(tokenPayload);
        
        // Replace old refresh token with new one
        const tokenIndex = user.refreshTokens.indexOf(refreshToken);
        user.refreshTokens[tokenIndex] = newRefreshToken;
        await user.save();

        logger.info(`Token refreshed for user: ${user.email}`);
        
        return {
            accessToken,
            refreshToken: newRefreshToken
        };
    } catch (error) {
        logger.error('Token refresh failed:', error);
        throw error;
    }
};

// Logout functionality
export const logout = async (refreshToken: string, userType: 'customer' | 'business' | 'admin'): Promise<void> => {
    try {
        const decoded = JWTUtil.verifyToken(refreshToken);
        
        let user: ICustomerUser | IBusinessUser | IAdminUser | null = null;
        
        if (userType === 'customer') {
            user = await CustomerUser.findById(decoded.userId);
        } else if (userType === 'business') {
            user = await BusinessUser.findById(decoded.userId);
        } else {
            user = await AdminUser.findById(decoded.userId);
        }

        if (user) {
            // Remove the specific refresh token
            user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
            await user.save();
            logger.info(`User logged out: ${user.email}`);
        }
    } catch (error) {
        // Even if token verification fails, we don't throw error for logout
        logger.error('Logout error:', error);
    }
};

// Logout from all devices
export const logoutFromAllDevices = async (userId: string, userType: 'customer' | 'business' | 'admin'): Promise<void> => {
    try {
        let user: ICustomerUser | IBusinessUser | IAdminUser | null = null;
        
        if (userType === 'customer') {
            user = await CustomerUser.findById(userId);
        } else if (userType === 'business') {
            user = await BusinessUser.findById(userId);
        } else {
            user = await AdminUser.findById(userId);
        }

        if (user) {
            user.refreshTokens = [];
            await user.save();
            logger.info(`User logged out from all devices: ${user.email}`);
        }
    } catch (error) {
        logger.error('Logout from all devices error:', error);
        throw error;
    }
};
