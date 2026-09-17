"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const documentController_1 = require("../controllers/documentController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.use(authMiddleware_1.authenticateToken);
router.get('/', documentController_1.getDocuments);
router.post('/', upload.single('file'), documentController_1.uploadDocument);
router.get('/:id/history', documentController_1.getDocumentHistory);
router.post('/:id/versions', upload.single('file'), documentController_1.uploadNewVersion);
router.patch('/:id/approve', documentController_1.approveDocument);
exports.default = router;
