import { Router } from 'express';
import { getVisionEvents, createVisionEvent } from '../controllers/visionController.js';

const router = Router();

router.get('/', getVisionEvents);
router.post('/', createVisionEvent);

export default router;
