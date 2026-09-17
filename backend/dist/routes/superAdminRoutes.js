"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const superAdminController_1 = require("../controllers/superAdminController");
const router = (0, express_1.Router)();
// Protect all Super Admin routes
router.use(authMiddleware_1.authenticateToken);
router.use((0, authMiddleware_1.authorize)('SUPER_ADMIN'));
router.get('/organizations', superAdminController_1.listOrganizations);
router.post('/organizations/:id/extend-trial', superAdminController_1.extendTrial);
router.put('/organizations/:id/plan', superAdminController_1.updatePlan);
exports.default = router;
