"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const importController_1 = require("../controllers/importController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.use(authMiddleware_1.authenticateToken);
// Import endpoints
router.post('/upload', (0, authMiddleware_1.requirePermission)('settings.manage'), upload.single('file'), importController_1.uploadImportFile);
router.get('/', (0, authMiddleware_1.requirePermission)('settings.manage'), importController_1.getImportJobs);
exports.default = router;
