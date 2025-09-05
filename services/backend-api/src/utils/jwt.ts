import jwt, { SignOptions } from 'jsonwebtoken';
import { logger } from './logger';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export class JWTUtil {
  private static getSecretKey(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
    if (secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    return secret;
  }

  /**
   * Generate access token (short-lived)
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    try {
      const tokenPayload: JWTPayload = { ...payload, type: 'access' };
      const options = {
        expiresIn: process.env.JWT_EXPIRE || '15m',
        issuer: 'reservio-api',
        audience: 'reservio-client'
      };
      return jwt.sign(tokenPayload, this.getSecretKey(), options as any);
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate refresh token (long-lived)
   */
  static generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    try {
      const tokenPayload: JWTPayload = { ...payload, type: 'refresh' };
      const options = {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
        issuer: 'reservio-api',
        audience: 'reservio-client'
      };
      return jwt.sign(tokenPayload, this.getSecretKey(), options as any);
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Refresh token generation failed');
    }
  }

  /**
   * Verify and decode token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.getSecretKey(), {
        issuer: 'reservio-api',
        audience: 'reservio-client'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        logger.error('Token verification error:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      logger.error('Token decoding error:', error);
      return null;
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  static generateTokenPair(payload: Omit<JWTPayload, 'type'>): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
}