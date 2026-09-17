import express from 'express';
import { getDashboardStats, getExecutiveDashboard } from '../controllers/dashboardController';
import { authenticateToken, authorize } from '../middlewares/authMiddleware';

const router = express.Router();
router.use(authenticateToken);

router.get('/stats', getDashboardStats);
router.get('/executive', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'EXECUTIVE'), getExecutiveDashboard);

export default router;
