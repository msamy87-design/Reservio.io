import { Router } from 'express';
import * as businessController from '../controllers/businessController';

const router = Router();

// Route: GET /api/businesses/search?location=...&service=...
// Description: Searches for businesses based on location and/or service type.
router.get('/search', businessController.search);

// Route: POST /api/businesses/batch
// Description: Fetches multiple business profiles by their IDs.
router.post('/batch', businessController.getMultipleByIds);

// Route: GET /api/businesses/:id
// Description: Fetches the public profile for a single business.
router.get('/:id', businessController.getById);

// Route: GET /api/businesses/:id/availability
// Description: Gets available time slots for a given service and staff on a specific date.
router.get('/:id/availability', businessController.getAvailability);

export default router;