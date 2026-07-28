// Async handler wrapper for Express route handlers
// In Express 4, async errors in route handlers are not automatically caught
// This wrapper ensures async errors are passed to the error middleware

import { Request, Response, NextFunction } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

export function asyncHandler(fn: AsyncHandler): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
