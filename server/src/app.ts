import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import commentRoutes from './routes/comment.routes.js';
import teamRoutes from './routes/team.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import searchRoutes from './routes/search.routes.js';

export const createApp = () => {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // allow static assets and inline icons
    })
  );

  // CORS Configuration
  const corsOrigin = process.env.CORS_ORIGIN;
  app.use(
    cors({
      origin: corsOrigin || true,
      credentials: true,
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use(limiter);

  // Body Parsing
  app.use(express.json());

  // Render Health Check Routes
  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.status(200).json({ status: 'ok', service: 'nexora' });
  };
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/search', searchRoutes);

  // Serve Single-Service Production Client Assets (client/dist)
  const clientDistPath = path.resolve(process.cwd(), '../client/dist');
  const altClientDistPath = path.resolve(process.cwd(), 'client/dist');
  const finalDistPath = fs.existsSync(clientDistPath)
    ? clientDistPath
    : fs.existsSync(altClientDistPath)
    ? altClientDistPath
    : null;

  if (finalDistPath) {
    app.use(express.static(finalDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(finalDistPath, 'index.html'));
    });
  } else {
    // 404 Route for API mode
    app.use('/api/*', (_req, res) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });
  }

  // Global Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Error]', err);
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Server error',
    });
  });

  return app;
};
