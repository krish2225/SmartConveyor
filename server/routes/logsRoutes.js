import { Router } from 'express';
import { getLogs, createLog, getLogStats, clearLogs } from '../controllers/logsController.js';

const router = Router();

router.get('/', getLogs);
router.post('/', createLog);
router.get('/stats', getLogStats);
router.post('/clear', clearLogs);

export default router;
