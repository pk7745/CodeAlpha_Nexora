import { Router } from 'express';
import { getTasksByProject, createTask, moveTask, updateTask, deleteTask } from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/project/:projectId', getTasksByProject);
router.post('/', createTask);
router.put('/:id/move', moveTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
