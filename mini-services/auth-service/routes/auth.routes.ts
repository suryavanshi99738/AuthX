// Auth route definitions - placeholder (Sprint 1)

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const authRouter = Router();

// POST /auth/login - Login with email and auth method
authRouter.post('/auth/login', AuthController.login);

// POST /auth/register - Register a new user
authRouter.post('/auth/register', AuthController.register);

// POST /auth/verify-otp - Verify OTP for authentication
authRouter.post('/auth/verify-otp', AuthController.verifyOTP);

// POST /auth/logout - Logout and invalidate session
authRouter.post('/auth/logout', AuthController.logout);

// POST /auth/refresh - Refresh session token
authRouter.post('/auth/refresh', AuthController.refreshSession);

// GET /auth/sessions - Get user active sessions
authRouter.get('/auth/sessions', AuthController.getSessions);

export default authRouter;
