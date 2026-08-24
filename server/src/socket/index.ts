import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server | null = null;

const JWT_SECRET = process.env.JWT_SECRET || 'nexora_default_dev_secret';

export const initSocket = (httpServer: HttpServer, corsOrigin: string) => {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication token required for WebSocket'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Invalid WebSocket authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`[Socket.IO] Client connected: ${socket.id} (User: ${userId})`);

    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`[Socket.IO] User ${userId} joined room project:${projectId}`);
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`[Socket.IO] User ${userId} left room project:${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const broadcastToProject = (projectId: string, event: string, payload: any) => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, payload);
  }
};
