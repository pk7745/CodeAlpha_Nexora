import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { prisma } from '../prisma.js';

export interface ProjectAuthRequest extends AuthRequest {
  projectMember?: {
    role: string;
    projectId: string;
  };
}

export const checkProjectRole = (allowedRoles: string[]) => {
  return async (req: ProjectAuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const projectId = req.params.projectId || req.params.id || req.body.projectId;

      if (!userId || !projectId) {
        return res.status(400).json({ error: 'Missing user ID or Project ID' });
      }

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (!member) {
        return res.status(403).json({ error: 'Access forbidden. You are not a member of this project.' });
      }

      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({ error: `Forbidden. Role '${member.role}' does not have permission for this action.` });
      }

      req.projectMember = { role: member.role, projectId };
      next();
    } catch (err) {
      return res.status(500).json({ error: 'Internal server authorization error' });
    }
  };
};
