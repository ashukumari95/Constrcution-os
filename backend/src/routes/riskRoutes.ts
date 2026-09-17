import { Router } from 'express';
import { 
  getProjectRisks, 
  getAllRisks, 
  createRisk, 
  updateRisk, 
  deleteRisk 
} from '../controllers/riskController';
import { authenticateToken, authorize } from '../middlewares/authMiddleware';

const router = Router({ mergeParams: true });

// Note: If mounted at /api/projects/:projectId/risks, we need mergeParams to get projectId.
// We also might mount at /api/risks for global view.

// Global routes (Mounted at /api/risks)
router.get('/', authenticateToken, authorize('COMPANY_ADMIN', 'EXECUTIVE', 'PROJECT_MANAGER'), getAllRisks);

// Project-specific routes (Mounted at /api/projects/:projectId/risks)
router.get('/project', authenticateToken, getProjectRisks);
router.post('/project', authenticateToken, authorize('COMPANY_ADMIN', 'PROJECT_MANAGER', 'SITE_SUPERVISOR'), createRisk);
router.put('/project/:id', authenticateToken, authorize('COMPANY_ADMIN', 'PROJECT_MANAGER', 'SITE_SUPERVISOR'), updateRisk);
router.delete('/project/:id', authenticateToken, authorize('COMPANY_ADMIN', 'PROJECT_MANAGER'), deleteRisk);

export default router;
