import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { broadcastToProject } from '../socket/index.js';

const createTaskSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

const moveTaskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  position: z.number(),
});

export const getTasksByProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { position: 'asc' },
    });

    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = createTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { projectId, title, description, status, priority, assigneeId, dueDate } = parseResult.data;
    const userId = req.user!.id;

    // Check project membership
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) {
      return res.status(403).json({ error: 'Forbidden. Not a member of this project.' });
    }

    if (member.role === 'VIEWER') {
      return res.status(403).json({ error: 'Forbidden. Viewers cannot create tasks.' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Auto-generate task key
    const taskCount = await prisma.task.count({ where: { projectId } });
    const key = `${project.key}-${101 + taskCount}`;

    // Get max position in column
    const highestPosTask = await prisma.task.findFirst({
      where: { projectId, status },
      orderBy: { position: 'desc' },
    });
    const position = (highestPosTask?.position || 0) + 1000.0;

    const task = await prisma.task.create({
      data: {
        key,
        title,
        description,
        status,
        priority,
        position,
        projectId,
        creatorId: userId,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { comments: true } },
      },
    });

    // Notify assignee if assigned
    if (assigneeId && assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: `${req.user!.name} assigned ${task.key} to you: "${title}"`,
          link: `/projects/${projectId}?task=${task.key}`,
        },
      });
    }

    await prisma.activity.create({
      data: {
        projectId,
        taskId: task.id,
        userId,
        action: 'TASK_CREATED',
        details: `created task ${task.key}: ${task.title}`,
      },
    });

    broadcastToProject(projectId, 'task:created', task);

    return res.status(201).json({ task });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create task.' });
  }
};

export const moveTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = moveTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { status, position } = parseResult.data;
    const userId = req.user!.id;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: existingTask.projectId, userId } },
    });

    if (!member || member.role === 'VIEWER') {
      return res.status(403).json({ error: 'Forbidden. Viewers cannot move tasks.' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status, position },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { comments: true } },
      },
    });

    if (existingTask.status !== status) {
      await prisma.activity.create({
        data: {
          projectId: existingTask.projectId,
          taskId: id,
          userId,
          action: 'TASK_MOVED',
          details: `moved ${updatedTask.key} to ${status.replace('_', ' ')}`,
        },
      });
    }

    broadcastToProject(existingTask.projectId, 'task:moved', updatedTask);

    return res.status(200).json({ task: updatedTask });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to move task.' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: existingTask.projectId, userId } },
    });

    if (!member || member.role === 'VIEWER') {
      return res.status(403).json({ error: 'Forbidden. Viewers cannot update tasks.' });
    }

    const { title, description, status, priority, assigneeId, dueDate } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTask.title,
        description: description !== undefined ? description : existingTask.description,
        status: status !== undefined ? status : existingTask.status,
        priority: priority !== undefined ? priority : existingTask.priority,
        assigneeId: assigneeId !== undefined ? assigneeId : existingTask.assigneeId,
        dueDate: dueDate ? new Date(dueDate) : existingTask.dueDate,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
        comments: {
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { comments: true } },
      },
    });

    broadcastToProject(existingTask.projectId, 'task:updated', updatedTask);

    return res.status(200).json({ task: updatedTask });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update task.' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: existingTask.projectId, userId } },
    });

    if (!member || member.role === 'VIEWER') {
      return res.status(403).json({ error: 'Forbidden. Viewers cannot delete tasks.' });
    }

    await prisma.task.delete({ where: { id } });

    broadcastToProject(existingTask.projectId, 'task:deleted', { taskId: id });

    return res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete task.' });
  }
};
