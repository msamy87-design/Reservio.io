
import express from 'express';
import * as adminController from '../controllers/adminController';
import { protectAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// All routes in this file require an authenticated admin user.
router.use(protectAdmin);

// Route: GET /api/admin/stats
// Description: Fetches platform-wide statistics.
router.get('/stats', adminController.getStats);

// Route: GET /api/admin/businesses
// Description: Fetches a list of all businesses on the platform.
router.get('/businesses', adminController.getBusinesses);

// Route: PATCH /api/admin/businesses/:id/status
// Description: Updates the verification status of a business.
router.patch('/businesses/:id/status', adminController.updateBusinessStatus);


export default router;
