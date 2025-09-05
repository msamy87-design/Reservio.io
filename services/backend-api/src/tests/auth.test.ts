import request from 'supertest';
import express from 'express';
import { BusinessUser } from '../models/User';
import { JWTUtil } from '../utils/jwt';
import * as authService from '../services/authService';

describe('Authentication System', () => {
  describe('JWT Utility', () => {
    const mockPayload = {
      userId: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: 'Owner'
    };

    beforeAll(() => {
      // Set JWT secret for testing
      process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    });

    it('should generate and verify access token', () => {
      const token = JWTUtil.generateAccessToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = JWTUtil.verifyToken(token);
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.type).toBe('access');
    });

    it('should generate and verify refresh token', () => {
      const token = JWTUtil.generateRefreshToken(mockPayload);
      expect(token).toBeDefined();

      const decoded = JWTUtil.verifyToken(token);
      expect(decoded.type).toBe('refresh');
    });

    it('should generate token pair', () => {
      const { accessToken, refreshToken } = JWTUtil.generateTokenPair(mockPayload);
      
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      
      const accessDecoded = JWTUtil.verifyToken(accessToken);
      const refreshDecoded = JWTUtil.verifyToken(refreshToken);
      
      expect(accessDecoded.type).toBe('access');
      expect(refreshDecoded.type).toBe('refresh');
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JWTUtil.verifyToken('invalid-token');
      }).toThrow('Invalid token');
    });
  });

  describe('Auth Service', () => {
    it('should signup a new business user', async () => {
      const userData = {
        businessName: 'Test Business',
        email: 'test@business.com',
        password: 'TestPass123!@#'
      };

      const result = await authService.signupBusiness(
        userData.businessName,
        userData.email,
        userData.password
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.businessName).toBe(userData.businessName);
    });

    it('should login existing business user', async () => {
      // First create a user
      const user = new BusinessUser({
        businessName: 'Test Business',
        email: 'existing@business.com',
        password: 'TestPass123!@#',
        role: 'Owner',
        staffId: '507f1f77bcf86cd799439011'
      });
      await user.save();

      const result = await authService.loginBusiness(
        'existing@business.com',
        'TestPass123!@#'
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('existing@business.com');
    });

    it('should fail login with wrong password', async () => {
      const user = new BusinessUser({
        businessName: 'Test Business',
        email: 'test@wrongpass.com',
        password: 'TestPass123!@#',
        role: 'Owner',
        staffId: '507f1f77bcf86cd799439011'
      });
      await user.save();

      await expect(
        authService.loginBusiness('test@wrongpass.com', 'WrongPassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should fail signup with duplicate email', async () => {
      const userData = {
        businessName: 'Test Business',
        email: 'duplicate@business.com',
        password: 'TestPass123!@#'
      };

      // Create first user
      await authService.signupBusiness(
        userData.businessName,
        userData.email,
        userData.password
      );

      // Try to create duplicate
      await expect(
        authService.signupBusiness(
          'Another Business',
          userData.email,
          'AnotherPass123!@#'
        )
      ).rejects.toThrow('already exists');
    });
  });

  describe('Password Security', () => {
    it('should hash passwords properly', async () => {
      const plainPassword = 'TestPassword123!@#';
      
      const user = new BusinessUser({
        businessName: 'Test Business',
        email: 'hashtest@business.com',
        password: plainPassword,
        role: 'Owner',
        staffId: '507f1f77bcf86cd799439011'
      });
      
      await user.save();

      // Password should be hashed
      const savedUser = await BusinessUser.findOne({ email: 'hashtest@business.com' }).select('+password');
      expect(savedUser?.password).not.toBe(plainPassword);
      expect(savedUser?.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format

      // Should be able to compare password
      const isValid = await savedUser!.comparePassword(plainPassword);
      expect(isValid).toBe(true);

      const isInvalid = await savedUser!.comparePassword('wrongpassword');
      expect(isInvalid).toBe(false);
    });
  });
});