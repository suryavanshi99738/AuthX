// Authentication middleware - placeholder (Sprint 1)

import { Request, Response, NextFunction } from 'express';

export function authenticate(_req: Request, _res: Response, _next: NextFunction): void {
  throw new Error('Not implemented in Sprint 1');
}

export function authorize(...roles: string[]) {
  return (_req: Request, _res: Response, _next: NextFunction): void => {
    throw new Error('Not implemented in Sprint 1');
  };
}
