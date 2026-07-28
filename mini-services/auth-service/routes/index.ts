// Main router that combines all routes

import { Router } from 'express';
import healthRouter from './health.routes';
import authRouter from './auth.routes';

const mainRouter = Router();

mainRouter.use(healthRouter);
mainRouter.use(authRouter);

export default mainRouter;
