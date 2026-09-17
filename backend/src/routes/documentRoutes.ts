import { Router } from 'express';
import multer from 'multer';
import { getDocuments, uploadDocument, getDocumentHistory, uploadNewVersion, approveDocument } from '../controllers/documentController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

router.get('/', getDocuments);
router.post('/', upload.single('file'), uploadDocument);
router.get('/:id/history', getDocumentHistory);
router.post('/:id/versions', upload.single('file'), uploadNewVersion);
router.patch('/:id/approve', approveDocument);

export default router;
