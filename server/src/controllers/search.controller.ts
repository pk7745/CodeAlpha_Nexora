import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const searchAll = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      return res.status(200).json({ projects: [], tasks: [], users: [] });
    }

    const searchTerm = query.trim();

    // User's project memberships
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    // Search Projects
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        OR: [
          { name: { contains: searchTerm } },
          { key: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      select: { id: true, name: true, key: true, description: true },
      take: 5,
    });

    // Search Tasks
    const tasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        OR: [
          { title: { contains: searchTerm } },
          { key: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        key: true,
        title: true,
        status: true,
        priority: true,
        projectId: true,
        project: { select: { id: true, name: true, key: true } },
      },
      take: 10,
    });

    // Search Users (members in same projects)
    const users = await prisma.user.findMany({
      where: {
        projectMemberships: {
          some: { projectId: { in: projectIds } },
        },
        OR: [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } },
        ],
      },
      select: { id: true, name: true, email: true, avatarUrl: true },
      take: 5,
    });

    return res.status(200).json({ projects, tasks, users });
  } catch (err) {
    return res.status(500).json({ error: 'Search failed.' });
  }
};
