import { Router } from 'express';
import { generateReport } from '../controllers/reportController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/:type', authenticateToken, generateReport);

export default router;
