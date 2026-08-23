import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { broadcastToProject } from '../socket/index.js';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty'),
});

export const getTaskComments = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({ comments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch comments.' });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const parseResult = commentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { content } = parseResult.data;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId } },
    });

    if (!member || member.role === 'VIEWER') {
      return res.status(403).json({ error: 'Forbidden. Viewers cannot add comments.' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await prisma.activity.create({
      data: {
        projectId: task.projectId,
        taskId: task.id,
        userId,
        action: 'COMMENT_ADDED',
        details: `commented on ${task.key}`,
      },
    });

    broadcastToProject(task.projectId, 'comment:created', comment);

    return res.status(201).json({ comment });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create comment.' });
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = commentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const userId = req.user!.id;
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Ownership check: User can only edit their own comment
    if (existingComment.authorId !== userId) {
      return res.status(403).json({ error: 'Forbidden. You can only edit your own comments.' });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { content: parseResult.data.content },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    broadcastToProject(existingComment.task.projectId, 'comment:updated', comment);

    return res.status(200).json({ comment });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update comment.' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Ownership or Admin check
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: existingComment.task.projectId, userId } },
    });

    const isAuthor = existingComment.authorId === userId;
    const isAdmin = member?.role === 'OWNER' || member?.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden. You can only delete your own comments.' });
    }

    await prisma.comment.delete({ where: { id } });

    broadcastToProject(existingComment.task.projectId, 'comment:deleted', { commentId: id, taskId: existingComment.taskId });

    return res.status(200).json({ message: 'Comment deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete comment.' });
  }
};
