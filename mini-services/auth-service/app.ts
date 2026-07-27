// Express app configuration - IMPLEMENTED

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middlewares/error.middleware';
import mainRouter from './routes';
import { logger } from './utils/logger';

export function createApp(): express.Application {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: config.cors.origin,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    exposedHeaders: config.cors.exposedHeaders,
    credentials: config.cors.credentials,
    maxAge: config.cors.maxAge,
  }));

  // Logging
  if (config.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API routes
  app.use(config.server.apiPrefix, mainRouter);

  // Root health check (outside API prefix)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'BankShield Auth Service is running',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
      },
    });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      errors: [{ code: 'NOT_FOUND', message: 'The requested resource was not found' }],
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  logger.info('Express app configured successfully', { context: 'App' });

  return app;
}
