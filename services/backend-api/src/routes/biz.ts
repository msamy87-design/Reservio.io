import { Router } from 'express';
import * as bizController from '../controllers/bizController';
import { protectBusiness } from '../middleware/authMiddleware';

const router = Router();

// All routes in this file require an authenticated business user.
router.use(protectBusiness);

// Route: PATCH /api/biz/me/profile
// Description: Updates the profile for the currently authenticated business user.
router.patch('/me/profile', bizController.updateProfile);

// Route: PATCH /api/biz/bookings/:id/status
// Description: Updates the status of a booking (e.g., to 'completed').
router.patch('/bookings/:id/status', bizController.updateBookingStatus);

// Route: GET /api/biz/me/reviews
// Description: Gets all reviews for the authenticated business.
router.get('/me/reviews', bizController.getReviews);

// Route: PATCH /api/biz/me/reviews/:reviewId
// Description: Updates the status of a review (publish/hide).
router.patch('/me/reviews/:reviewId', bizController.updateReviewStatus);


export default router;