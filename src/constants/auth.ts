/**
 * Auth Constants
 *
 * Defines all authentication-related constants
 * for the BankShield Auth application.
 */

import { AuthMethod, AuthStatus, DeviceTrustLevel, RiskLevel } from '@/types/auth';

/**
 * Authentication method constants
 * Maps AuthMethod enum values to their display properties
 */
export const AUTH_METHODS: Record<AuthMethod, { label: string; description: string; icon: string }> = {
  [AuthMethod.BIOMETRIC]: {
    label: 'Biometric',
    description: 'Authenticate using fingerprint or face recognition',
    icon: 'fingerprint',
  },
  [AuthMethod.MAGIC_LINK]: {
    label: 'Magic Link',
    description: 'Receive a secure login link via email',
    icon: 'mail',
  },
  [AuthMethod.OTP]: {
    label: 'One-Time Password',
    description: 'Enter a temporary code from your authenticator app',
    icon: 'key',
  },
  [AuthMethod.PASSKEY]: {
    label: 'Passkey',
    description: 'Use a device-stored passkey for secure authentication',
    icon: 'shield',
  },
  [AuthMethod.PUSH_NOTIFICATION]: {
    label: 'Push Notification',
    description: 'Approve login from a push notification on your device',
    icon: 'bell',
  },
  [AuthMethod.SMS]: {
    label: 'SMS Code',
    description: 'Receive a verification code via SMS',
    icon: 'smartphone',
  },
};

/**
 * Authentication status constants
 * Maps AuthStatus enum values to their display properties
 */
export const AUTH_STATUSES: Record<AuthStatus, { label: string; color: string; description: string }> = {
  [AuthStatus.AUTHENTICATED]: {
    label: 'Authenticated',
    color: 'green',
    description: 'User is fully authenticated',
  },
  [AuthStatus.CHALLENGE_PENDING]: {
    label: 'Challenge Pending',
    color: 'yellow',
    description: 'An authentication challenge is pending verification',
  },
  [AuthStatus.EXPIRED]: {
    label: 'Expired',
    color: 'gray',
    description: 'The session or challenge has expired',
  },
  [AuthStatus.LOCKED]: {
    label: 'Locked',
    color: 'red',
    description: 'The account or session is locked',
  },
  [AuthStatus.MFA_REQUIRED]: {
    label: 'MFA Required',
    color: 'orange',
    description: 'Multi-factor authentication is required',
  },
  [AuthStatus.UNAUTHENTICATED]: {
    label: 'Unauthenticated',
    color: 'gray',
    description: 'User is not authenticated',
  },
};

/**
 * Risk level constants
 * Maps RiskLevel enum values to their display properties
 */
export const RISK_LEVELS: Record<RiskLevel, { label: string; color: string; score: number }> = {
  [RiskLevel.LOW]: {
    label: 'Low Risk',
    color: 'green',
    score: 0,
  },
  [RiskLevel.MEDIUM]: {
    label: 'Medium Risk',
    color: 'yellow',
    score: 50,
  },
  [RiskLevel.HIGH]: {
    label: 'High Risk',
    color: 'orange',
    score: 75,
  },
  [RiskLevel.CRITICAL]: {
    label: 'Critical Risk',
    color: 'red',
    score: 100,
  },
};

/**
 * Device trust level constants
 * Maps DeviceTrustLevel enum values to their display properties
 */
export const DEVICE_TRUST_LEVELS: Record<DeviceTrustLevel, { label: string; color: string; description: string }> = {
  [DeviceTrustLevel.NONE]: {
    label: 'Not Trusted',
    color: 'gray',
    description: 'Device has not been verified',
  },
  [DeviceTrustLevel.LOW]: {
    label: 'Low Trust',
    color: 'yellow',
    description: 'Device has been partially verified',
  },
  [DeviceTrustLevel.MEDIUM]: {
    label: 'Medium Trust',
    color: 'blue',
    description: 'Device has been verified with basic authentication',
  },
  [DeviceTrustLevel.HIGH]: {
    label: 'High Trust',
    color: 'green',
    description: 'Device has been fully verified with strong authentication',
  },
  [DeviceTrustLevel.REVOKED]: {
    label: 'Revoked',
    color: 'red',
    description: 'Device trust has been revoked',
  },
};

/**
 * Session configuration constants
 */
export const SESSION_CONFIG = {
  /** Session duration in milliseconds (30 minutes) */
  SESSION_DURATION_MS: 30 * 60 * 1000,
  /** Maximum number of concurrent sessions per user */
  MAX_CONCURRENT_SESSIONS: 5,
  /** Idle timeout in milliseconds (15 minutes) */
  IDLE_TIMEOUT_MS: 15 * 60 * 1000,
  /** Refresh token duration in milliseconds (7 days) */
  REFRESH_TOKEN_DURATION_MS: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * OTP configuration constants
 */
export const OTP_CONFIG = {
  /** OTP length */
  OTP_LENGTH: 6,
  /** OTP expiration in milliseconds (5 minutes) */
  OTP_EXPIRATION_MS: 5 * 60 * 1000,
  /** Maximum OTP verification attempts */
  MAX_OTP_ATTEMPTS: 3,
  /** Cooldown period between OTP resend in milliseconds (60 seconds) */
  RESEND_COOLDOWN_MS: 60 * 1000,
} as const;

/**
 * Rate limiting constants
 */
export const RATE_LIMITS = {
  /** Maximum login attempts per 15 minutes */
  MAX_LOGIN_ATTEMPTS: 5,
  /** Login attempt window in milliseconds (15 minutes) */
  LOGIN_WINDOW_MS: 15 * 60 * 1000,
  /** Account lockout duration in milliseconds (30 minutes) */
  LOCKOUT_DURATION_MS: 30 * 60 * 1000,
  /** Maximum OTP requests per hour */
  MAX_OTP_REQUESTS_PER_HOUR: 10,
} as const;
