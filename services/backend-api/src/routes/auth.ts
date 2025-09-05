import { Router } from 'express';
import * as authController from '../controllers/authController';
import rateLimit from 'express-rate-limit';
import { validate, authSchemas } from '../utils/validation';

const router = Router();

// Stricter rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for refresh token endpoint
    return req.path === '/refresh';
  }
});

// Apply rate limiting to all auth routes except refresh
router.use(authRateLimit);

// Customer authentication routes
router.post('/customer/login', validate(authSchemas.customerLogin), authController.customerLogin);
router.post('/customer/signup', validate(authSchemas.customerSignup), authController.customerSignup);

// Business authentication routes
router.post('/business/login', validate(authSchemas.businessLogin), authController.businessLogin);
router.post('/business/signup', validate(authSchemas.businessSignup), authController.businessSignup);

// Admin authentication routes
router.post('/admin/login', validate(authSchemas.adminLogin), authController.adminLogin);

// Token management routes (no rate limiting)
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutFromAllDevices);

export default router;