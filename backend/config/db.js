import mongoose from 'mongoose';
import { ENV } from './env.js';

let isConnected = false;

// Disable buffering so calls don't hang if MongoDB is unavailable
mongoose.set('bufferCommands', false);

export const connectDB = async () => {
  if (isConnected) return true;
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[Database Warning] Could not connect to MongoDB at ${ENV.MONGODB_URI}: ${error.message}`);
    console.warn('[Database] For full MongoDB Atlas storage, configure MONGODB_URI in backend/.env');
    return false;
  }
};

export const getDBConnectionStatus = () => isConnected;
