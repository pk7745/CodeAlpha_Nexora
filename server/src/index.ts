import http from 'http';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initSocket } from './socket/index.js';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = createApp();
const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocket(httpServer, CORS_ORIGIN);

httpServer.listen(5000, '0.0.0.0', () => {
  console.log(`🚀 [Nexora Server] Running on http://0.0.0.0:5000`);
  console.log(`⚡ [Socket.IO] Real-time engine active for origin: ${CORS_ORIGIN}`);
});
