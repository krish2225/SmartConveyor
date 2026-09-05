import { Router } from 'express';
import {
  getJoints,
  getJointById,
  updateJointHealth,
  getAllJointsHistory,
  getJointHistory
} from '../controllers/jointsController.js';

const router = Router();

// Specific routes first
router.get('/history/all', getAllJointsHistory);
router.get('/:jointId/history', getJointHistory);

// Generic routes
router.get('/', getJoints);
router.get('/:jointId', getJointById);
router.patch('/:jointId', updateJointHealth);

export default router;
