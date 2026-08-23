import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user projects
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    // Active Projects Count
    const activeProjectsCount = await prisma.project.count({
      where: {
        id: { in: projectIds },
        status: 'ACTIVE',
      },
    });

    // Assigned Tasks for Current User
    const assignedTasksCount = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] },
      },
    });

    // Completed Tasks Count across user's projects
    const completedTasksCount = await prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: 'DONE',
      },
    });

    // Overdue Tasks Count
    const now = new Date();
    const overdueTasksCount = await prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: { not: 'DONE' },
        dueDate: { lt: now },
      },
    });

    // Task Status Breakdown
    const todoCount = await prisma.task.count({ where: { projectId: { in: projectIds }, status: 'TODO' } });
    const inProgressCount = await prisma.task.count({ where: { projectId: { in: projectIds }, status: 'IN_PROGRESS' } });
    const inReviewCount = await prisma.task.count({ where: { projectId: { in: projectIds }, status: 'IN_REVIEW' } });
    const doneCount = completedTasksCount;

    // Recent Activities
    const recentActivities = await prisma.activity.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, key: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    // Upcoming Deadlines
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: 'DONE' },
        dueDate: { gte: now },
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, key: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    return res.status(200).json({
      stats: {
        activeProjects: activeProjectsCount,
        assignedTasks: assignedTasksCount,
        completedTasks: completedTasksCount,
        overdueTasks: overdueTasksCount,
        statusBreakdown: {
          todo: todoCount,
          inProgress: inProgressCount,
          inReview: inReviewCount,
          done: doneCount,
        },
      },
      recentActivities,
      upcomingDeadlines,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
};
