import { Router } from 'express';
import { getProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.js';
import { checkProjectRole } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.put('/:id', checkProjectRole(['OWNER', 'ADMIN']), updateProject);
router.delete('/:id', deleteProject);

export default router;
