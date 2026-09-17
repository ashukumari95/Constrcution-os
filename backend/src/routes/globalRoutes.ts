import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { 
  getGlobalTasks, 
  getGlobalBoq, 
  getGlobalProcurement, 
  getGlobalIssues, 
  getGlobalLabour,
  getGlobalDpr,
  getGlobalFinance,
  getGlobalDocuments,
  getGlobalUsers
} from '../controllers/globalController';

const router = express.Router();

router.use(authenticateToken);

router.get('/tasks', getGlobalTasks);
router.get('/boq', getGlobalBoq);
router.get('/procurement', getGlobalProcurement);
router.get('/issues', getGlobalIssues);
router.get('/labour', getGlobalLabour);
router.get('/dpr', getGlobalDpr);
router.get('/finance', getGlobalFinance);
router.get('/documents', getGlobalDocuments);
router.get('/users', getGlobalUsers);

export default router;
