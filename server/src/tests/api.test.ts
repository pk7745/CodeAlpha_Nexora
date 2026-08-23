import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../prisma.js';

const app = createApp();

let ownerToken: string;
let viewerToken: string;
let ownerUserId: string;
let viewerUserId: string;
let projectId: string;
let taskId: string;
let commentId: string;

beforeAll(async () => {
  // Clear test DB
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Register Owner
  const resOwner = await request(app).post('/api/auth/register').send({
    email: 'testowner@nexora.io',
    password: 'Password123!',
    name: 'Test Owner',
  });
  expect(resOwner.status).toBe(201);
  ownerToken = resOwner.body.token;
  ownerUserId = resOwner.body.user.id;

  // Register Viewer
  const resViewer = await request(app).post('/api/auth/register').send({
    email: 'testviewer@nexora.io',
    password: 'Password123!',
    name: 'Test Viewer',
  });
  expect(resViewer.status).toBe(201);
  viewerToken = resViewer.body.token;
  viewerUserId = resViewer.body.user.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('1. Authentication E2E Tests', () => {
  it('should reject duplicate email registration with 409', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'testowner@nexora.io',
      password: 'Password123!',
      name: 'Duplicate Owner',
    });
    expect(res.status).toBe(409);
  });

  it('should login user with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'testowner@nexora.io',
      password: 'Password123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should reject invalid password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'testowner@nexora.io',
      password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
  });

  it('should reject unauthenticated request to protected endpoint with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should get current user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('testowner@nexora.io');
  });
});

describe('2. Project & RBAC Authorization E2E Tests', () => {
  it('should create a project as Owner', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Alpha Project',
        key: 'ALP',
        description: 'Alpha test project',
      });
    expect(res.status).toBe(201);
    projectId = res.body.project.id;
  });

  it('should add Viewer user to the project as VIEWER role', async () => {
    const res = await request(app)
      .post(`/api/team/project/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: 'testviewer@nexora.io',
        role: 'VIEWER',
      });
    expect(res.status).toBe(201);
  });

  it('should allow Owner to create task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        projectId,
        title: 'Initial Setup Task',
        description: 'Setup initial repository and DB schema',
        status: 'TODO',
        priority: 'HIGH',
      });
    expect(res.status).toBe(201);
    expect(res.body.task.key).toBe('ALP-101');
    taskId = res.body.task.id;
  });

  it('should REJECT Viewer attempting to create task with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        projectId,
        title: 'Unauthorized Task Creation',
      });
    expect(res.status).toBe(403);
  });

  it('should REJECT Viewer attempting to delete project with 403 Forbidden', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });
});

describe('3. Task & Kanban Position Persistence Tests', () => {
  it('should move task status from TODO to IN_PROGRESS and update position', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        status: 'IN_PROGRESS',
        position: 2500.0,
      });
    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('IN_PROGRESS');
    expect(res.body.task.position).toBe(2500.0);
  });

  it('should persist task status and position across database queries', async () => {
    const dbTask = await prisma.task.findUnique({ where: { id: taskId } });
    expect(dbTask?.status).toBe('IN_PROGRESS');
    expect(dbTask?.position).toBe(2500.0);
  });
});

describe('4. Comments E2E & Ownership Enforcement Tests', () => {
  it('should create comment as Owner', async () => {
    const res = await request(app)
      .post(`/api/comments/task/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ content: 'Owner comment on task' });
    expect(res.status).toBe(201);
    commentId = res.body.comment.id;
  });

  it('should REJECT Viewer attempting to modify Owner comment with 403 Forbidden', async () => {
    const res = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ content: 'Malicious update attempt' });
    expect(res.status).toBe(403);
  });

  it('should allow Owner to edit their own comment', async () => {
    const res = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ content: 'Updated owner comment content' });
    expect(res.status).toBe(200);
    expect(res.body.comment.content).toBe('Updated owner comment content');
  });
});

describe('5. Dashboard Statistics & Search Tests', () => {
  it('should calculate dynamic dashboard stats for active projects and assigned tasks', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats.activeProjects).toBeGreaterThanOrEqual(1);
    expect(res.body.stats.statusBreakdown.inProgress).toBe(1);
  });

  it('should perform server-side search across projects and tasks', async () => {
    const res = await request(app)
      .get('/api/search?q=Setup')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThanOrEqual(1);
    expect(res.body.tasks[0].title).toContain('Setup');
  });
});

describe('6. Member Profile API & Security Tests', () => {
  it('should fetch authorized member profile and shared project stats for team members', async () => {
    const res = await request(app)
      .get(`/api/team/member/${viewerUserId}/profile`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('testviewer@nexora.io');
    expect(res.body.projects.length).toBeGreaterThanOrEqual(1);
    expect(res.body.stats).toBeDefined();
  });

  it('should REJECT member profile access with 403 when users share no authorized projects', async () => {
    // Create an unshared user
    const resUnshared = await request(app).post('/api/auth/register').send({
      email: 'unshared@nexora.io',
      password: 'Password123!',
      name: 'Unshared User',
    });
    const unsharedUserId = resUnshared.body.user.id;

    const res = await request(app)
      .get(`/api/team/member/${unsharedUserId}/profile`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });
});

