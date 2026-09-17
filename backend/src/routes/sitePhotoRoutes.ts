import { Router } from 'express';
import multer from 'multer';
import { getSitePhotos, uploadSitePhoto } from '../controllers/sitePhotoController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

router.get('/', getSitePhotos);
router.post('/', upload.single('file'), uploadSitePhoto);

export default router;
