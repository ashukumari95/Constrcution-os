import { Router } from 'express';
import { getUsers, createUser, updateUser, updateUserStatus, getRoles } from '../controllers/userController';
import { authenticateToken, requirePermission } from '../middlewares/authMiddleware';

const router = Router();

// Protect all user routes with authentication
router.use(authenticateToken);

// For Phase 2, we assume only admins or users with specific permission can manage users
router.get('/', requirePermission('users:read'), getUsers);
router.get('/roles', requirePermission('users:read'), getRoles);
router.post('/', requirePermission('users:write'), createUser);
router.put('/:id', requirePermission('users:write'), updateUser);
router.patch('/:id/status', requirePermission('users:write'), updateUserStatus);

export default router;
