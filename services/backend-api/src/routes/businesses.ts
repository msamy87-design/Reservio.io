import { Router } from 'express';
import * as businessController from '../controllers/businessController';
import { validate, validateParams, validateQuery, paramSchemas, querySchemas } from '../utils/validation';
import Joi from 'joi';

const router = Router();

// Batch request validation schema
const batchSchema = Joi.object({
  ids: Joi.array().items(
    Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
  ).min(1).max(50).required()
});

// Route: GET /api/businesses/search?location=...&service=...
// Description: Searches for businesses based on location and/or service type.
router.get('/search', 
  validateQuery(querySchemas.businessSearch), 
  businessController.search
);

// Route: POST /api/businesses/batch
// Description: Fetches multiple business profiles by their IDs.
router.post('/batch', 
  validate(batchSchema), 
  businessController.getMultipleByIds
);

// Route: GET /api/businesses/:id
// Description: Fetches the public profile for a single business.
router.get('/:id', 
  validateParams(paramSchemas.objectId), 
  businessController.getById
);

// Route: GET /api/businesses/:id/availability
// Description: Gets available time slots for a given service and staff on a specific date.
router.get('/:id/availability', 
  validateParams(paramSchemas.objectId),
  validateQuery(querySchemas.availability),
  businessController.getAvailability
);

export default router;