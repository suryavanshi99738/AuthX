// Health check routes - IMPLEMENTED

import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const healthRouter = Router();

healthRouter.get('/health', HealthController.check);

export default healthRouter;
