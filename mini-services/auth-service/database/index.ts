// Database connection manager - IMPLEMENTED

import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../utils/logger';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    logger.info('Database already connected', { context: 'Database' });
    return;
  }

  try {
    const connection = await mongoose.connect(config.database.uri, {
      ...config.database.options,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if DB not available
      connectTimeoutMS: 5000,
    });

    isConnected = true;

    logger.info(`MongoDB connected: ${connection.connection.host}`, {
      context: 'Database',
      host: connection.connection.host,
      name: connection.connection.name,
    });

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { context: 'Database', error: error.message });
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected', { context: 'Database' });
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected', { context: 'Database' });
      isConnected = true;
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      context: 'Database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected gracefully', { context: 'Database' });
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', {
      context: 'Database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export function isDatabaseConnected(): boolean {
  return isConnected;
}
