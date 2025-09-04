
import { Router } from 'express';
import * as reviewController from '../controllers/reviewController';
import { protectCustomer } from '../middleware/authMiddleware';

const router = Router();

// Route: POST /api/reviews
// Description: Allows a logged-in customer to submit a new review for a completed booking.
router.post('/', protectCustomer, reviewController.create);

export default router;
