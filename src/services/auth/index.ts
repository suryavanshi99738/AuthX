/**
 * Auth Service - Placeholder
 *
 * Defines the AuthService class with method signatures
 * for the BankShield Auth passwordless authentication system.
 *
 * No implementations - method bodies will be filled in future sprints.
 */

import type { ApiResponse, RequestConfig } from '@/types/api';
import type {
  AuthChallenge,
  AuthMethod,
  SessionInfo,
} from '@/types/auth';

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  authMethod: AuthMethod;
  deviceId?: string;
  redirectUrl?: string;
}

/**
 * Login response payload
 */
export interface LoginResponse {
  challengeId: string;
  challenge: AuthChallenge;
  message: string;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  authMethod: AuthMethod;
  deviceId?: string;
}

/**
 * Register response payload
 */
export interface RegisterResponse {
  userId: string;
  challengeId: string;
  message: string;
}

/**
 * OTP verification request payload
 */
export interface VerifyOTPRequest {
  challengeId: string;
  code: string;
  deviceId?: string;
}

/**
 * OTP verification response payload
 */
export interface VerifyOTPResponse {
  session: SessionInfo;
  accessToken: string;
  refreshToken: string;
}

/**
 * Logout response payload
 */
export interface LogoutResponse {
  message: string;
}

/**
 * Refresh session response payload
 */
export interface RefreshSessionResponse {
  session: SessionInfo;
  accessToken: string;
  refreshToken: string;
}

/**
 * AuthService - Placeholder class
 *
 * Provides method signatures for all authentication operations.
 * Implementations will be added in future sprints.
 */
class AuthService {
  /**
   * Initiate a login flow
   * @param _request - Login request payload
   * @param _config - Optional request configuration
   * @returns Promise with login challenge response
   */
  async login(
    _request: LoginRequest,
    _config?: RequestConfig
  ): Promise<ApiResponse<LoginResponse>> {
    throw new Error('AuthService.login not implemented');
  }

  /**
   * Register a new user account
   * @param _request - Registration request payload
   * @param _config - Optional request configuration
   * @returns Promise with registration challenge response
   */
  async register(
    _request: RegisterRequest,
    _config?: RequestConfig
  ): Promise<ApiResponse<RegisterResponse>> {
    throw new Error('AuthService.register not implemented');
  }

  /**
   * Verify an OTP code for an authentication challenge
   * @param _request - OTP verification request payload
   * @param _config - Optional request configuration
   * @returns Promise with session and token response
   */
  async verifyOTP(
    _request: VerifyOTPRequest,
    _config?: RequestConfig
  ): Promise<ApiResponse<VerifyOTPResponse>> {
    throw new Error('AuthService.verifyOTP not implemented');
  }

  /**
   * Logout and invalidate the current session
   * @param _config - Optional request configuration
   * @returns Promise with logout confirmation
   */
  async logout(
    _config?: RequestConfig
  ): Promise<ApiResponse<LogoutResponse>> {
    throw new Error('AuthService.logout not implemented');
  }

  /**
   * Get the current session information
   * @param _config - Optional request configuration
   * @returns Promise with current session info
   */
  async getSession(
    _config?: RequestConfig
  ): Promise<ApiResponse<SessionInfo>> {
    throw new Error('AuthService.getSession not implemented');
  }

  /**
   * Refresh the current session tokens
   * @param _config - Optional request configuration
   * @returns Promise with refreshed session and tokens
   */
  async refreshSession(
    _config?: RequestConfig
  ): Promise<ApiResponse<RefreshSessionResponse>> {
    throw new Error('AuthService.refreshSession not implemented');
  }
}

/**
 * Singleton instance of AuthService
 */
export const authService = new AuthService();

export default AuthService;
