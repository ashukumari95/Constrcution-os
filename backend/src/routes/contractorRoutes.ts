import { Router } from 'express';
import { getContractors, getContractorById, createContractor, updateContractor } from '../controllers/contractorController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getContractors);
router.get('/:id', getContractorById);
router.post('/', createContractor);
router.put('/:id', updateContractor);

export default router;
