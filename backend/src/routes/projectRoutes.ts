import express from 'express';
import { getProjects, getProjectById, createProject, updateProject, getProjectHealth } from '../controllers/projectController';
import { getSitesByProject, createSite } from '../controllers/siteController';
import { getWbsElements, createWbsElement } from '../controllers/wbsController';
import { getTasks, createTask, updateTaskStatus, uploadAttachment } from '../controllers/taskController';
import { getBoqItems, createBoqItem } from '../controllers/boqController';
import { authenticateToken } from '../middlewares/authMiddleware';
import multer from 'multer';

const router = express.Router();

// Using memory storage for multer, then the storageService writes it to disk
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

// Projects
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.get('/:id/health', getProjectHealth);
router.put('/:id', updateProject);

// Sites
router.get('/:projectId/sites', getSitesByProject);
router.post('/:projectId/sites', createSite);

// WBS
router.get('/:projectId/wbs', getWbsElements);
router.post('/:projectId/wbs', createWbsElement);

// Tasks
router.get('/:projectId/tasks', getTasks);
router.post('/:projectId/tasks', createTask);
router.put('/tasks/:id/status', updateTaskStatus);
router.post('/tasks/:taskId/attachments', upload.single('file'), uploadAttachment);

// BOQ
router.get('/:projectId/boq', getBoqItems);
router.post('/:projectId/boq', createBoqItem);

export default router;
