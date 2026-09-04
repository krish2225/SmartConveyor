import { Router } from 'express';
import { getJoints, getJointById, updateJointHealth } from '../controllers/jointsController.js';

const router = Router();

router.get('/', getJoints);
router.get('/:jointId', getJointById);
router.patch('/:jointId', updateJointHealth);

export default router;
