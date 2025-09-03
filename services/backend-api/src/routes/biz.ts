
import express from 'express';
import * as bizController from '../controllers/bizController';
import { protectBusiness } from '../middleware/authMiddleware';

const router = express.Router();

// All routes in this file require an authenticated business user.
router.use(protectBusiness);

// Route: PATCH /api/biz/me/profile
// Description: Updates the profile for the currently authenticated business user.
router.patch('/me/profile', bizController.updateProfile);


export default router;