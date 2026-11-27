import mongoose from 'mongoose';
import { ENV } from './env.js';

let isConnected = false;

// Disable buffering so calls don't hang if MongoDB is unavailable
mongoose.set('bufferCommands', false);

export const connectDB = async () => {
  if (isConnected) return true;
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected successfully to host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    // Log error message without exposing connection strings or credentials
    console.warn(`[Database Warning] Could not connect to MongoDB: ${error.message}`);
    return false;
  }
};

export const getDBConnectionStatus = () =>
  isConnected && mongoose.connection.readyState === 1;
