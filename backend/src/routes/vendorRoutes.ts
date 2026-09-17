import { Router } from 'express';
import { getVendors, createVendor } from '../controllers/vendorController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getVendors);
router.post('/', createVendor);

export default router;
