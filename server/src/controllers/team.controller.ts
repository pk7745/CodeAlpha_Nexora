import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { broadcastToProject } from '../socket/index.js';

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

export const getProjectMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return res.status(200).json({ members });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch team members.' });
  }
};

export const addProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const parseResult = addMemberSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { email, role } = parseResult.data;
    const userId = req.user!.id;

    // Check requester permissions
    const requesterMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!requesterMember || (requesterMember.role !== 'OWNER' && requesterMember.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden. Only Project Owner or Admin can add members.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return res.status(404).json({ error: 'No registered user found with this email.' });
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUser.id } },
    });

    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member of this project.' });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: 'MEMBER_ADDED',
        title: 'Project Invitation',
        message: `You were added to project as ${role}`,
        link: `/projects/${projectId}`,
      },
    });

    broadcastToProject(projectId, 'member:added', member);

    return res.status(201).json({ member });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add project member.' });
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, memberId } = req.params;
    const parseResult = updateMemberRoleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { role } = parseResult.data;
    const userId = req.user!.id;

    const requester = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden. Only Owner or Admin can update member roles.' });
    }

    const targetMember = await prisma.projectMember.findUnique({ where: { id: memberId } });
    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    if (targetMember.role === 'OWNER') {
      return res.status(403).json({ error: 'Forbidden. Cannot change Owner role.' });
    }

    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return res.status(200).json({ member: updatedMember });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update member role.' });
  }
};

export const removeProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, memberId } = req.params;
    const userId = req.user!.id;

    const requester = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden. Only Owner or Admin can remove members.' });
    }

    const targetMember = await prisma.projectMember.findUnique({ where: { id: memberId } });
    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    if (targetMember.role === 'OWNER') {
      return res.status(403).json({ error: 'Forbidden. Cannot remove Project Owner.' });
    }

    await prisma.projectMember.delete({ where: { id: memberId } });

    broadcastToProject(projectId, 'member:removed', { memberId });

    return res.status(200).json({ message: 'Member removed from project.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove member.' });
  }
};

export const getMemberProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { memberId } = req.params;

    // Determine target user ID (can be user.id or projectMember.id)
    let targetUser = await prisma.user.findUnique({ where: { id: memberId } });
    if (!targetUser) {
      const pm = await prisma.projectMember.findUnique({
        where: { id: memberId },
        include: { user: true },
      });
      if (pm) targetUser = pm.user;
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Requester's authorized projects
    const requesterMemberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const requesterProjectIds = requesterMemberships.map((m) => m.projectId);

    // Shared authorized projects between requester and target user
    const sharedMemberships = await prisma.projectMember.findMany({
      where: {
        userId: targetUser.id,
        projectId: { in: requesterProjectIds },
      },
      include: {
        project: {
          select: { id: true, name: true, key: true, status: true, description: true },
        },
      },
    });

    if (sharedMemberships.length === 0 && userId !== targetUser.id) {
      return res.status(403).json({ error: 'Forbidden. You do not share any authorized projects with this user.' });
    }

    // Task productivity stats in shared authorized projects
    const assignedCount = await prisma.task.count({
      where: { assigneeId: targetUser.id, projectId: { in: requesterProjectIds } },
    });

    const completedCount = await prisma.task.count({
      where: { assigneeId: targetUser.id, projectId: { in: requesterProjectIds }, status: 'DONE' },
    });

    const activeCount = await prisma.task.count({
      where: { assigneeId: targetUser.id, projectId: { in: requesterProjectIds }, status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] } },
    });

    const overdueCount = await prisma.task.count({
      where: { assigneeId: targetUser.id, projectId: { in: requesterProjectIds }, status: { not: 'DONE' }, dueDate: { lt: new Date() } },
    });

    return res.status(200).json({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        avatarUrl: targetUser.avatarUrl,
        createdAt: targetUser.createdAt,
      },
      stats: {
        assignedTasks: assignedCount,
        completedTasks: completedCount,
        activeTasks: activeCount,
        overdueTasks: overdueCount,
      },
      projects: sharedMemberships.map((sm) => ({
        id: sm.project.id,
        name: sm.project.name,
        key: sm.project.key,
        status: sm.project.status,
        role: sm.role,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch member profile.' });
  }
};

