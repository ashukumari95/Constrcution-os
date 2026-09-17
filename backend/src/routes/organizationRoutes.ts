import { Router } from 'express';
import { getOrganizationConfig, updateOrganizationConfig } from '../controllers/organizationController';
import { authenticateToken, requirePermission } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getOrganizationConfig);
router.put('/', requirePermission('settings.manage'), updateOrganizationConfig);

export default router;
