import { Router } from 'express';
import { getWorkers, createWorker, getAttendance, markAttendance } from '../controllers/labourController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/workers', getWorkers);
router.post('/workers', createWorker);
router.get('/attendance', getAttendance);
router.post('/attendance', markAttendance);

export default router;
