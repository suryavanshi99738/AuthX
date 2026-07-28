// Health check controller - IMPLEMENTED

import { Request, Response } from 'express';
import { response } from '../utils/response';
import { isDatabaseConnected } from '../database';

export class HealthController {
  static check(_req: Request, res: Response): void {
    const healthData = {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: isDatabaseConnected() ? ('connected' as const) : ('disconnected' as const),
      },
    };

    res.status(200).json(response.success(healthData, 'Service is healthy'));
  }
}
