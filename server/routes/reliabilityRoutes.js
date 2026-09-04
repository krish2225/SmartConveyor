import { Router } from 'express';
import { getLatestReliability, getReliabilityHistory, recordReliabilitySnapshot } from '../controllers/reliabilityController.js';

const router = Router();

router.get('/', getLatestReliability);
router.get('/history', getReliabilityHistory);
router.post('/snapshot', recordReliabilitySnapshot);

export default router;
