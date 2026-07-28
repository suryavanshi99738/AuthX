// Auth controller - placeholder with method signatures (Sprint 1)

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/error.middleware';

export class AuthController {
  static login(_req: Request, _res: Response, _next: NextFunction): void {
    _next(new AppError(501, 'Not implemented in Sprint 1', 'NOT_IMPLEMENTED'));
  }

  static register(_req: Request, _res: Response, _next: NextFunction): void {
    _next(new AppError(501, 'Not implemented in Sprint 1', 'NOT_IMPLEMENTED'));
  }

  static verifyOTP(_req: Request, _res: Response, _next: NextFunction): void {
    _next(new AppError(501, 'Not implemented in Sprint 1', 'NOT_IMPLEMENTED'));
  }

  static logout(_req: Request, _res: Response, _next: NextFunction): void {
    _next(new AppError(501, 'Not implemented in Sprint 1', 'NOT_IMPLEMENTED'));
  }

  static refreshSession(_req: Request, _res: Response, _next: NextFunction): void {
    _next(new AppError(501, 'Not implemented in Sprint 1', 'NOT_IMPLEMENTED'));
  }

  static getSessions(_req: Request, _res: Response, _next: NextFunction): void {
    _next(new AppError(501, 'Not implemented in Sprint 1', 'NOT_IMPLEMENTED'));
  }
}
