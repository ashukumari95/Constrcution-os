import { Router } from 'express';
import { login, register, getMe, forgotPassword, resetPassword, getTenantBranding } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/tenant', getTenantBranding);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
