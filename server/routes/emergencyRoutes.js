import { Router } from 'express';
import { getEmergencyStatus, triggerEmergencyStop, clearEmergencyStop } from '../controllers/emergencyController.js';

const router = Router();

router.get('/status', getEmergencyStatus);
router.post('/trigger', triggerEmergencyStop);
router.post('/clear', clearEmergencyStop);

export default router;
