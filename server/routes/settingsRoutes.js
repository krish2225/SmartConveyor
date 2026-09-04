import { Router } from 'express';
import { getFacilitySettings, updateFacilitySettings } from '../controllers/settingsController.js';

const router = Router();

router.get('/', getFacilitySettings);
router.put('/', updateFacilitySettings);

export default router;
