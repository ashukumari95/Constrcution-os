"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectController_1 = require("../controllers/projectController");
const siteController_1 = require("../controllers/siteController");
const wbsController_1 = require("../controllers/wbsController");
const taskController_1 = require("../controllers/taskController");
const boqController_1 = require("../controllers/boqController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
// Using memory storage for multer, then the storageService writes it to disk
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.use(authMiddleware_1.authenticateToken);
// Projects
router.get('/', projectController_1.getProjects);
router.post('/', projectController_1.createProject);
router.get('/:id', projectController_1.getProjectById);
router.get('/:id/health', projectController_1.getProjectHealth);
router.put('/:id', projectController_1.updateProject);
// Sites
router.get('/:projectId/sites', siteController_1.getSitesByProject);
router.post('/:projectId/sites', siteController_1.createSite);
// WBS
router.get('/:projectId/wbs', wbsController_1.getWbsElements);
router.post('/:projectId/wbs', wbsController_1.createWbsElement);
// Tasks
router.get('/:projectId/tasks', taskController_1.getTasks);
router.post('/:projectId/tasks', taskController_1.createTask);
router.put('/tasks/:id/status', taskController_1.updateTaskStatus);
router.post('/tasks/:taskId/attachments', upload.single('file'), taskController_1.uploadAttachment);
// BOQ
router.get('/:projectId/boq', boqController_1.getBoqItems);
router.post('/:projectId/boq', boqController_1.createBoqItem);
exports.default = router;
