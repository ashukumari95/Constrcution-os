import { Router } from 'express';
import { authenticateToken, authorize } from '../middlewares/authMiddleware';
import { listOrganizations, extendTrial, updatePlan } from '../controllers/superAdminController';

const router = Router();

// Protect all Super Admin routes
router.use(authenticateToken);
router.use(authorize('SUPER_ADMIN'));

router.get('/organizations', listOrganizations);
router.post('/organizations/:id/extend-trial', extendTrial);
router.put('/organizations/:id/plan', updatePlan);

export default router;
