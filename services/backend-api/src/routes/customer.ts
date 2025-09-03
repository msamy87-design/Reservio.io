import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { protectCustomer } from '../middleware/authMiddleware';

const router = Router();

// All routes in this file are protected and require a logged-in customer.
router.use(protectCustomer);

// Route: GET /api/customer/me/bookings
// Description: Fetches all bookings for the currently authenticated customer.
router.get('/me/bookings', customerController.getMyBookings);

export default router;