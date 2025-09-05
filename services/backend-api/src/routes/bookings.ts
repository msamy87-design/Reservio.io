import { Router } from 'express';
import * as bookingController from '../controllers/bookingController';
import { protectCustomer } from '../middleware/authMiddleware';
import { validate, validateParams, publicSchemas, paramSchemas } from '../utils/validation';

const router = Router();

// Route: POST /api/bookings
// Description: Allows a public user to create a new booking.
router.post('/', validate(publicSchemas.createBooking), bookingController.create);

// Route: PATCH /api/bookings/:id/cancel
// Description: Allows a logged-in customer to cancel their own booking.
router.patch('/:id/cancel', 
  validateParams(paramSchemas.objectId), 
  protectCustomer, 
  bookingController.cancel
);


export default router;