import { databaseConfig } from './database';
import { serverConfig } from './server';
import { corsConfig } from './cors';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  otpExpiresIn: process.env.OTP_EXPIRES_IN || '5m',
  logLevel: process.env.LOG_LEVEL || 'debug',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  database: databaseConfig,
  server: serverConfig,
  cors: corsConfig,
} as const;

export type Config = typeof config;
