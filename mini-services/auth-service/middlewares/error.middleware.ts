// Global error handler middleware - IMPLEMENTED

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { response } from '../utils/response';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public errors?: any[];

  constructor(statusCode: number, message: string, code: string = 'INTERNAL_ERROR', errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle known error types (expected business errors - use warn level)
  if (error instanceof AppError) {
    logger.warn('Application error', {
      context: 'ErrorHandler',
      statusCode: error.statusCode,
      code: error.code,
      error: error.message,
    });

    const appErrors = error.errors || [{ code: error.code, message: error.message }];
    res.status(error.statusCode).json(
      response.error(error.message, error.statusCode, appErrors)
    );
    return;
  }

  // Unexpected errors - use error level
  logger.error('Unhandled error', {
    context: 'ErrorHandler',
    error: error.message,
    stack: error.stack,
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const mongooseError = error as any;
    const errors = Object.values(mongooseError.errors || {}).map((err: any) => ({
      code: 'VALIDATION_ERROR',
      message: err.message,
      field: err.path,
    }));
    res.status(400).json(
      response.error('Validation failed', 400, errors)
    );
    return;
  }

  // Mongoose duplicate key error
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyPattern || {})[0];
    res.status(409).json(
      response.error(`Duplicate value for ${field}`, 409, [
        { code: 'DUPLICATE_KEY', message: `A record with this ${field} already exists`, field },
      ])
    );
    return;
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    res.status(400).json(
      response.error('Invalid ID format', 400, [
        { code: 'CAST_ERROR', message: error.message },
      ])
    );
    return;
  }

  // Default internal server error
  res.status(500).json(
    response.error('Internal server error', 500, [
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    ])
  );
}
