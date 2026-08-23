import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { broadcastToProject } from '../socket/index.js';

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  key: z.string().min(2).max(10, 'Project key must be 2-10 uppercase characters').transform((val) => val.toUpperCase()),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
});

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.status(200).json({ projects });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatarUrl: true } },
            creator: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { comments: true } },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const membership = project.members.find((m) => m.userId === userId);
    if (!membership) {
      return res.status(403).json({ error: 'Forbidden. You are not a member of this project.' });
    }

    return res.status(200).json({ project, currentUserRole: membership.role });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch project.' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = createProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { name, key, description } = parseResult.data;
    const userId = req.user!.id;

    const existingKey = await prisma.project.findUnique({ where: { key } });
    if (existingKey) {
      return res.status(409).json({ error: `Project key '${key}' is already taken.` });
    }

    const project = await prisma.project.create({
      data: {
        name,
        key,
        description,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    await prisma.activity.create({
      data: {
        projectId: project.id,
        userId,
        action: 'PROJECT_CREATED',
        details: `created project ${project.name}`,
      },
    });

    return res.status(201).json({ project });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create project.' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = updateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const project = await prisma.project.update({
      where: { id },
      data: parseResult.data,
    });

    return res.status(200).json({ project });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update project.' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
    });

    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden. Only Project Owner or Admin can delete/archive projects.' });
    }

    await prisma.project.delete({ where: { id } });

    return res.status(200).json({ message: 'Project successfully deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete project.' });
  }
};
