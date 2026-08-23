import { Router } from 'express';
import { getTaskComments, createComment, updateComment, deleteComment } from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/task/:taskId', getTaskComments);
router.post('/task/:taskId', createComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

export default router;
