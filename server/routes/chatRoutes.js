import { Router } from 'express';
import { handleChat, getChatHistory } from '../controllers/chatController.js';

const router = Router();

router.post('/', handleChat);
router.get('/history', getChatHistory);

export default router;
