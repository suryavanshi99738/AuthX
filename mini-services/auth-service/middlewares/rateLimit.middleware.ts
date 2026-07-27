// Rate limiting middleware - placeholder (Sprint 1)

import { Request, Response, NextFunction } from 'express';

export function rateLimit(options?: {
  windowMs?: number;
  max?: number;
  message?: string;
}) {
  return (_req: Request, _res: Response, _next: NextFunction): void => {
    throw new Error('Not implemented in Sprint 1');
  };
}
