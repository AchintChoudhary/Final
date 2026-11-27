import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/transport_tracking',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_jwt_key_transport_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GPS_UPDATE_INTERVAL_MS: parseInt(process.env.GPS_UPDATE_INTERVAL_MS, 10) || 5000,
  GPS_STALE_WARNING_MS: parseInt(process.env.GPS_STALE_WARNING_MS, 10) || 30000,
  GPS_UNAVAILABLE_MS: parseInt(process.env.GPS_UNAVAILABLE_MS, 10) || 120000,
  ROUTE_MATCH_TOLERANCE_METERS: parseInt(process.env.ROUTE_MATCH_TOLERANCE_METERS, 10) || 500,
  GPS_MAX_ACCURACY_METERS: parseInt(process.env.GPS_MAX_ACCURACY_METERS, 10) || 100,
  ETA_REFRESH_INTERVAL_MS: parseInt(process.env.ETA_REFRESH_INTERVAL_MS, 10) || 60000,
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
};

if (ENV.NODE_ENV === 'production') {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in production');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required in production');
  if (!process.env.GEOAPIFY_API_KEY) throw new Error('GEOAPIFY_API_KEY is required in production');
  if (!process.env.CLIENT_URL) throw new Error('CLIENT_URL is required in production');
}
