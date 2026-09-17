"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Protect all user routes with authentication
router.use(authMiddleware_1.authenticateToken);
// For Phase 2, we assume only admins or users with specific permission can manage users
router.get('/', (0, authMiddleware_1.requirePermission)('users:read'), userController_1.getUsers);
router.get('/roles', (0, authMiddleware_1.requirePermission)('users:read'), userController_1.getRoles);
router.post('/', (0, authMiddleware_1.requirePermission)('users:write'), userController_1.createUser);
router.put('/:id', (0, authMiddleware_1.requirePermission)('users:write'), userController_1.updateUser);
router.patch('/:id/status', (0, authMiddleware_1.requirePermission)('users:write'), userController_1.updateUserStatus);
exports.default = router;
