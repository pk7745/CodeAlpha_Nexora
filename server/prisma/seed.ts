import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database seed state...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed or retrieve users idempotently using upsert
  const owner = await prisma.user.upsert({
    where: { email: 'owner@nexora.io' },
    update: {}, // Preserve existing name, passwordHash, role, etc.
    create: {
      email: 'owner@nexora.io',
      name: 'Alex Vance',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexora.io' },
    update: {},
    create: {
      email: 'admin@nexora.io',
      name: 'Sarah Jenkins',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@nexora.io' },
    update: {},
    create: {
      email: 'member@nexora.io',
      name: 'Marcus Chen',
      passwordHash,
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@nexora.io' },
    update: {},
    create: {
      email: 'viewer@nexora.io',
      name: 'Elena Rostova',
      passwordHash,
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Seed or retrieve project idempotently
  let project = await prisma.project.findUnique({
    where: { key: 'NXR' },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Mobile App Redesign',
        key: 'NXR',
        description: 'Overhauling the Nexora mobile dashboard layout, navigation flow, and real-time syncing engine.',
        status: 'ACTIVE',
        ownerId: owner.id,
        members: {
          create: [
            { userId: owner.id, role: 'OWNER' },
            { userId: admin.id, role: 'ADMIN' },
            { userId: member.id, role: 'MEMBER' },
            { userId: viewer.id, role: 'VIEWER' },
          ],
        },
      },
    });
  } else {
    // Ensure membership records exist idempotently
    const memberRoles: Array<{ userId: string; role: string }> = [
      { userId: owner.id, role: 'OWNER' },
      { userId: admin.id, role: 'ADMIN' },
      { userId: member.id, role: 'MEMBER' },
      { userId: viewer.id, role: 'VIEWER' },
    ];
    for (const m of memberRoles) {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: project.id, userId: m.userId } },
        update: {},
        create: { projectId: project.id, userId: m.userId, role: m.role },
      });
    }
  }

  // 3. Seed tasks idempotently
  const tasksToSeed = [
    {
      key: 'NXR-101',
      title: 'Design System Tokens & Dark Palette',
      description: 'Standardize Geist typography, surface container colors (#131315, #201f22), and Indigo accent states.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      position: 1000.0,
      creatorId: owner.id,
      assigneeId: member.id,
      dueDate: new Date(Date.now() + 86400000 * 3),
    },
    {
      key: 'NXR-102',
      title: 'Setup Socket.IO Real-time Sync',
      description: 'Broadcast task movement, comments, and member actions across active project rooms without page refreshes.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      position: 2000.0,
      creatorId: admin.id,
      assigneeId: owner.id,
      dueDate: new Date(Date.now() + 86400000 * 1),
    },
    {
      key: 'NXR-103',
      title: 'Implement JWT Auth & Protected API Middleware',
      description: 'Zod input validation, bcrypt password hashing, and role-based permissions (OWNER, ADMIN, MEMBER, VIEWER).',
      status: 'DONE',
      priority: 'HIGH',
      position: 1000.0,
      creatorId: owner.id,
      assigneeId: admin.id,
      dueDate: new Date(Date.now() - 86400000 * 2),
    },
    {
      key: 'NXR-104',
      title: 'Kanban Drag and Drop Persistence',
      description: 'Ensure task reordering within columns and between columns updates postion and status in PostgreSQL.',
      status: 'TODO',
      priority: 'HIGH',
      position: 1000.0,
      creatorId: admin.id,
      assigneeId: member.id,
      dueDate: new Date(Date.now() + 86400000 * 5),
    },
    {
      key: 'NXR-105',
      title: 'Dashboard Metrics & Aggregation Engine',
      description: 'Query database dynamically for Active Projects, Assigned Tasks, Completed Tasks, and Overdue Items.',
      status: 'TODO',
      priority: 'MEDIUM',
      position: 2000.0,
      creatorId: owner.id,
      assigneeId: admin.id,
      dueDate: new Date(Date.now() + 86400000 * 7),
    },
  ];

  let task1Id: string | null = null;
  for (const t of tasksToSeed) {
    const existing = await prisma.task.findUnique({ where: { key: t.key } });
    if (!existing) {
      const created = await prisma.task.create({
        data: {
          key: t.key,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          position: t.position,
          projectId: project.id,
          creatorId: t.creatorId,
          assigneeId: t.assigneeId,
          dueDate: t.dueDate,
        },
      });
      if (t.key === 'NXR-101') task1Id = created.id;
    } else {
      if (t.key === 'NXR-101') task1Id = existing.id;
    }
  }

  // 4. Seed initial comments if task1 exists and has zero comments
  if (task1Id) {
    const commentCount = await prisma.comment.count({ where: { taskId: task1Id } });
    if (commentCount === 0) {
      await prisma.comment.createMany({
        data: [
          {
            content: 'I updated the surface container dark token to match #201f22 exactly.',
            taskId: task1Id,
            authorId: member.id,
          },
          {
            content: 'Great work! Make sure the task detail drawer also uses the matching border radius.',
            taskId: task1Id,
            authorId: owner.id,
          },
        ],
      });
    }
  }

  console.log('Idempotent database seed check completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
