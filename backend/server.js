import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB, getDBConnectionStatus } from './config/db.js';
import { setupSocketIO } from './sockets/socketHandler.js';
import { User } from './models/User.js';

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
  // Listen immediately
  server.listen(ENV.PORT, () => {
    console.log(`[Server] Real-Time Public Transport Backend running on port ${ENV.PORT} (${ENV.NODE_ENV})`);
    console.log(`[Server] API Health check available at http://localhost:${ENV.PORT}/api/health`);
  });

  // Attempt database connection
  const dbConnected = await connectDB();

  // Create initial admin account if MongoDB is connected and credentials provided
  if (dbConnected) {
    try {
      const existingAdmin = await User.findOne({ role: 'ADMIN' });
      if (!existingAdmin && ENV.ADMIN_EMAIL && ENV.ADMIN_PASSWORD) {
        await User.create({
          name: 'Administrator',
          email: ENV.ADMIN_EMAIL.toLowerCase().trim(),
          passwordHash: ENV.ADMIN_PASSWORD,
          role: 'ADMIN',
        });
        console.log(`[Admin] Initialized admin user: ${ENV.ADMIN_EMAIL}`);
      }
    } catch (err) {
      console.warn('[Admin Setup Warning] Could not ensure default admin:', err.message);
    }
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    process.exit(0);
  });
});
