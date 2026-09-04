import { Router } from 'express';
import { getAlerts, createAlert, acknowledgeAlert, resolveAlert } from '../controllers/alertsController.js';

const router = Router();

router.get('/', getAlerts);
router.post('/', createAlert);
router.patch('/:id/acknowledge', acknowledgeAlert);
router.patch('/:id/resolve', resolveAlert);

export default router;
