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
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
setupSocketIO(io);

const startServer = async () => {
  server.listen(ENV.PORT, () => {
    console.log(`[Server] Real-Time Public Transport Backend running on port ${ENV.PORT} (${ENV.NODE_ENV})`);
    console.log(`[Server] API Health check available at http://localhost:${ENV.PORT}/api/health`);
  });

  await connectDB();
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    process.exit(0);
  });
});
