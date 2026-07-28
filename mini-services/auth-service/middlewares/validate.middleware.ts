// Request validation middleware - placeholder (Sprint 1)

import { Request, Response, NextFunction } from 'express';

export function validate(schema: any) {
  return (_req: Request, _res: Response, _next: NextFunction): void => {
    throw new Error('Not implemented in Sprint 1');
  };
}
