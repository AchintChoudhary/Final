import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { ApiError } from './utils/apiError.js';
import { getDBConnectionStatus } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import busRoutes from './routes/busRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import tileRoutes from './routes/tileRoutes.js';
import passengerHistoryRoutes from './routes/passengerHistoryRoutes.js';

const app = express();
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
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
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Map tile proxy (placed before API rate limiter so panning/zooming tiles are not throttled)
app.use('/api/tiles', tileRoutes);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
});
app.use('/api', limiter);
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});
app.use('/api/auth/login', authLimiter);

// Health check
app.get('/api/health', (req, res) => {
  const databaseConnected = getDBConnectionStatus();
  res.status(databaseConnected ? 200 : 503).json({
    status: 'ok',
    timestamp: new Date(),
    databaseConnected,
    environment: ENV.NODE_ENV,
    geoapifyConfigured: Boolean(ENV.GEOAPIFY_API_KEY),
  });
});

// API Routes (Driver & Passenger Only)
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/passenger-history', passengerHistoryRoutes);

// 404 Route handler
app.use((req, res, next) => {
  next(new ApiError(404, `API route not found: ${req.originalUrl}`));
});

// Global Error Handler
app.use(errorHandler);

export default app;
