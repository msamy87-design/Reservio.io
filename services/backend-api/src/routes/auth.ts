import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

// Route: POST /api/auth/customer/login
router.post('/customer/login', authController.customerLogin);

// Route: POST /api/auth/customer/signup
router.post('/customer/signup', authController.customerSignup);

// Route: POST /api/auth/admin/login
router.post('/admin/login', authController.adminLogin);

export default router;