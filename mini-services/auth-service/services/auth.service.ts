// Auth service - placeholder with method signatures (Sprint 1)

import { LoginRequest, RegisterRequest, VerifyOTPRequest, AuthResponse, OTPResponse } from '../types/auth.types';

export class AuthService {
  static async login(data: LoginRequest): Promise<AuthResponse> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async verifyOTP(data: VerifyOTPRequest): Promise<AuthResponse> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async sendOTP(email: string, method: string): Promise<OTPResponse> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async refreshToken(token: string): Promise<AuthResponse> {
    throw new Error('Not implemented in Sprint 1');
  }

  static async revokeSession(sessionId: string): Promise<void> {
    throw new Error('Not implemented in Sprint 1');
  }
}
