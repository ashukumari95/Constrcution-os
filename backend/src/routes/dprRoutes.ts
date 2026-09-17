import { Router } from 'express';
import { getDPRs, createDPR, updateDPR } from '../controllers/dprController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getDPRs);
router.post('/', createDPR);
router.patch('/:id', updateDPR);

export default router;
