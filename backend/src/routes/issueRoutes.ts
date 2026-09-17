import { Router } from 'express';
import { getIssues, createIssue, updateIssue, addIssueComment } from '../controllers/issueController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getIssues);
router.post('/', createIssue);
router.patch('/:id', updateIssue);
router.post('/:id/comments', addIssueComment);

export default router;
