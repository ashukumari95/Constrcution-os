import { Router } from 'express';
import multer from 'multer';
import { uploadImportFile, getImportJobs } from '../controllers/importController';
import { authenticateToken, requirePermission } from '../middlewares/authMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

// Import endpoints
router.post('/upload', requirePermission('settings.manage'), upload.single('file'), uploadImportFile);
router.get('/', requirePermission('settings.manage'), getImportJobs);

export default router;
