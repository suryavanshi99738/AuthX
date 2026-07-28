// Auth-related type definitions

export type AuthMethod = 'email_otp' | 'sms_otp' | 'biometric' | 'magic_link' | 'webauthn';

export interface LoginRequest {
  email: string;
  authMethod: AuthMethod;
  deviceFingerprint?: string;
  userAgent?: string;
  ip?: string;
}

export interface RegisterRequest {
  email: string;
  name?: string;
  phone?: string;
  authMethod: AuthMethod;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
  sessionId?: string;
  deviceFingerprint?: string;
}

export interface LogoutRequest {
  sessionId: string;
}

export interface RefreshSessionRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  sessionId: string;
  expiresAt: string;
}

export interface OTPResponse {
  message: string;
  otpId: string;
  expiresAt: string;
  attemptsRemaining: number;
}
