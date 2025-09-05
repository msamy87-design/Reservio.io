import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { protectCustomer } from '../middleware/authMiddleware';
import { validate, customerSchemas } from '../utils/validation';

const router = Router();

// All routes here require a logged-in customer
router.use(protectCustomer);

// GET /api/customer/me/bookings
router.get('/me/bookings', customerController.getMyBookings);

// PATCH /api/customer/me
router.patch('/me', validate(customerSchemas.updateProfile), customerController.updateMyProfile);

// PATCH /api/customer/me/password
router.patch('/me/password', validate(customerSchemas.changePassword), customerController.changeMyPassword);

// --- Favorites Routes ---
// GET /api/customer/me/favorites
router.get('/me/favorites', customerController.getMyFavorites);

// POST /api/customer/me/favorites
router.post('/me/favorites', validate(customerSchemas.addFavorite), customerController.addMyFavorite);

// DELETE /api/customer/me/favorites/:businessId
router.delete('/me/favorites/:businessId', customerController.removeMyFavorite);


export default router;