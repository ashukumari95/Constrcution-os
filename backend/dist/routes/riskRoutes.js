"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const riskController_1 = require("../controllers/riskController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)({ mergeParams: true });
// Note: If mounted at /api/projects/:projectId/risks, we need mergeParams to get projectId.
// We also might mount at /api/risks for global view.
// Global routes (Mounted at /api/risks)
router.get('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)('COMPANY_ADMIN', 'EXECUTIVE', 'PROJECT_MANAGER'), riskController_1.getAllRisks);
// Project-specific routes (Mounted at /api/projects/:projectId/risks)
router.get('/project', authMiddleware_1.authenticateToken, riskController_1.getProjectRisks);
router.post('/project', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)('COMPANY_ADMIN', 'PROJECT_MANAGER', 'SITE_SUPERVISOR'), riskController_1.createRisk);
router.put('/project/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)('COMPANY_ADMIN', 'PROJECT_MANAGER', 'SITE_SUPERVISOR'), riskController_1.updateRisk);
router.delete('/project/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)('COMPANY_ADMIN', 'PROJECT_MANAGER'), riskController_1.deleteRisk);
exports.default = router;
