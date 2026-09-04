import { Router } from 'express';
import { getReports, createReport, getReportById } from '../controllers/reportsController.js';

const router = Router();

router.get('/', getReports);
router.post('/', createReport);
router.get('/:id', getReportById);

export default router;
