// Entry point - IMPLEMENTED

import dotenv from 'dotenv';
import { createApp } from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './database';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = createApp();

const PORT = config.port;

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB (non-blocking - server starts even if DB is unavailable)
    try {
      await connectDatabase();
      logger.info('Database connected successfully', { context: 'Server' });
    } catch (dbError) {
      logger.warn('Database connection failed. Server will start without database.', {
        context: 'Server',
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      });
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`BankShield Auth Service running on port ${PORT}`, {
        context: 'Server',
        port: PORT,
        environment: config.nodeEnv,
        apiPrefix: config.server.apiPrefix,
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`, { context: 'Server' });

      server.close(async () => {
        logger.info('HTTP server closed', { context: 'Server' });

        try {
          await disconnectDatabase();
          logger.info('All connections closed. Exiting.', { context: 'Server' });
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', {
            context: 'Server',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout', { context: 'Server' });
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Keep process alive (prevents bun from exiting when event loop appears empty)
    setInterval(() => {
      // Health heartbeat - keeps the bun event loop active
    }, 30000);

  } catch (error) {
    logger.error('Failed to start server', {
      context: 'Server',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

startServer();
