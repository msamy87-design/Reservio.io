import { Router } from 'express';
import * as waitlistController from '../controllers/waitlistController';

const router = Router();

router.post('/', waitlistController.create);

export default router;
