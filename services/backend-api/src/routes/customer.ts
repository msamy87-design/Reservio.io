import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { protectCustomer } from '../middleware/authMiddleware';

const router = Router();

// All routes here require a logged-in customer
router.use(protectCustomer);

// GET /api/customer/me/bookings
router.get('/me/bookings', customerController.getMyBookings);

export default router;
