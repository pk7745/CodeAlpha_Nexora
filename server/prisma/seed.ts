import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const owner = await prisma.user.create({
    data: {
      email: 'owner@nexora.io',
      name: 'Alex Vance',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@nexora.io',
      name: 'Sarah Jenkins',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@nexora.io',
      name: 'Marcus Chen',
      passwordHash,
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@nexora.io',
      name: 'Elena Rostova',
      passwordHash,
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('Seeding project...');
  const project = await prisma.project.create({
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

  console.log('Seeding tasks...');
  const task1 = await prisma.task.create({
    data: {
      key: 'NXR-101',
      title: 'Design System Tokens & Dark Palette',
      description: 'Standardize Geist typography, surface container colors (#131315, #201f22), and Indigo accent states.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      position: 1000.0,
      projectId: project.id,
      creatorId: owner.id,
      assigneeId: member.id,
      dueDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
    },
  });

  const task2 = await prisma.task.create({
    data: {
      key: 'NXR-102',
      title: 'Setup Socket.IO Real-time Sync',
      description: 'Broadcast task movement, comments, and member actions across active project rooms without page refreshes.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      position: 2000.0,
      projectId: project.id,
      creatorId: admin.id,
      assigneeId: owner.id,
      dueDate: new Date(Date.now() + 86400000 * 1), // 1 day from now
    },
  });

  const task3 = await prisma.task.create({
    data: {
      key: 'NXR-103',
      title: 'Implement JWT Auth & Protected API Middleware',
      description: 'Zod input validation, bcrypt password hashing, and role-based permissions (OWNER, ADMIN, MEMBER, VIEWER).',
      status: 'DONE',
      priority: 'HIGH',
      position: 1000.0,
      projectId: project.id,
      creatorId: owner.id,
      assigneeId: admin.id,
      dueDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    },
  });

  const task4 = await prisma.task.create({
    data: {
      key: 'NXR-104',
      title: 'Kanban Drag and Drop Persistence',
      description: 'Ensure task reordering within columns and between columns updates postion and status in PostgreSQL.',
      status: 'TODO',
      priority: 'HIGH',
      position: 1000.0,
      projectId: project.id,
      creatorId: admin.id,
      assigneeId: member.id,
      dueDate: new Date(Date.now() + 86400000 * 5),
    },
  });

  const task5 = await prisma.task.create({
    data: {
      key: 'NXR-105',
      title: 'Dashboard Metrics & Aggregation Engine',
      description: 'Query database dynamically for Active Projects, Assigned Tasks, Completed Tasks, and Overdue Items.',
      status: 'TODO',
      priority: 'MEDIUM',
      position: 2000.0,
      projectId: project.id,
      creatorId: owner.id,
      assigneeId: admin.id,
      dueDate: new Date(Date.now() + 86400000 * 7),
    },
  });

  console.log('Seeding comments...');
  await prisma.comment.createMany({
    data: [
      {
        content: 'I updated the surface container dark token to match #201f22 exactly.',
        taskId: task1.id,
        authorId: member.id,
      },
      {
        content: 'Great work! Make sure the task detail drawer also uses the matching border radius.',
        taskId: task1.id,
        authorId: owner.id,
      },
    ],
  });

  console.log('Seeding notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: member.id,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: 'Alex Vance assigned NXR-101 to you.',
        link: `/projects/${project.id}?task=NXR-101`,
        read: false,
      },
      {
        userId: owner.id,
        type: 'COMMENT_ADDED',
        title: 'New Comment',
        message: 'Marcus Chen commented on NXR-101.',
        link: `/projects/${project.id}?task=NXR-101`,
        read: true,
      },
    ],
  });

  console.log('Seeding activity log...');
  await prisma.activity.createMany({
    data: [
      {
        projectId: project.id,
        taskId: task1.id,
        userId: owner.id,
        action: 'TASK_CREATED',
        details: 'created task NXR-101: Design System Tokens & Dark Palette',
      },
      {
        projectId: project.id,
        taskId: task2.id,
        userId: admin.id,
        action: 'TASK_CREATED',
        details: 'created task NXR-102: Setup Socket.IO Real-time Sync',
      },
      {
        projectId: project.id,
        taskId: task1.id,
        userId: member.id,
        action: 'TASK_MOVED',
        details: 'moved NXR-101 to In Progress',
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
