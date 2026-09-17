import { Router } from 'express';
import { getMaterials, createMaterial, getInventory, addInventoryItem } from '../controllers/materialController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getMaterials);
router.post('/', createMaterial);
router.get('/inventory', getInventory);
router.post('/inventory', addInventoryItem);

export default router;
