import { Router } from 'express';
import { getProjectMembers, addProjectMember, updateMemberRole, removeProjectMember, getMemberProfile } from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/member/:memberId/profile', getMemberProfile);
router.get('/project/:projectId', getProjectMembers);
router.post('/project/:projectId', addProjectMember);
router.put('/project/:projectId/member/:memberId', updateMemberRole);
router.delete('/project/:projectId/member/:memberId', removeProjectMember);

export default router;

