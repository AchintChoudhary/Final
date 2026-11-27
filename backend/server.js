import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { setupSocketIO } from './sockets/socketHandler.js';

const server = http.createServer(app);

// Socket.IO configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        ENV.CLIENT_URL,
        'https://final-five-gray-53.vercel.app',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ].filter(Boolean);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by Socket.IO CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
let watchdogTimer = null;

const startServer = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.error('[Server] MongoDB unavailable. Refusing to accept dependent traffic.');
    process.exitCode = 1;
    return;
  }

  watchdogTimer = setupSocketIO(io);

  server.listen(ENV.PORT, () => {
    console.log(`[Server] Real-Time Public Transport Backend running on port ${ENV.PORT} (${ENV.NODE_ENV})`);
    console.log(`[Server] API Health check available at http://localhost:${ENV.PORT}/api/health`);
  });
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully.');
  if (watchdogTimer) clearInterval(watchdogTimer);
  server.close(() => {
    process.exit(0);
  });
});
