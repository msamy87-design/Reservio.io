
import express from 'express';
import * as bookingController from '../controllers/bookingController';
import { protectCustomer } from '../middleware/authMiddleware';

const router = express.Router();

// Route: POST /api/bookings
// Description: Allows a public user to create a new booking.
router.post('/', bookingController.create);

// Route: PATCH /api/bookings/:id/cancel
// Description: Allows a logged-in customer to cancel their own booking.
router.patch('/:id/cancel', protectCustomer, bookingController.cancel);


export default router;