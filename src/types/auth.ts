/**
 * Auth Type Definitions
 *
 * Defines all authentication-related types, interfaces, and enums
 * for the BankShield Auth passwordless banking authentication system.
 */

/**
 * Authentication methods supported by the system
 */
export enum AuthMethod {
  BIOMETRIC = 'BIOMETRIC',
  MAGIC_LINK = 'MAGIC_LINK',
  OTP = 'OTP',
  PASSKEY = 'PASSKEY',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
  SMS = 'SMS',
}

/**
 * Authentication status of a user session
 */
export enum AuthStatus {
  AUTHENTICATED = 'AUTHENTICATED',
  CHALLENGE_PENDING = 'CHALLENGE_PENDING',
  EXPIRED = 'EXPIRED',
  LOCKED = 'LOCKED',
  MFA_REQUIRED = 'MFA_REQUIRED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
}

/**
 * Risk level assessment for authentication attempts
 */
export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
}

/**
 * Device trust level for trusted device management
 */
export enum DeviceTrustLevel {
  HIGH = 'HIGH',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  NONE = 'NONE',
  REVOKED = 'REVOKED',
}

/**
 * Represents an active user session
 */
export interface SessionInfo {
  /** Unique session identifier */
  id: string;
  /** User ID associated with the session */
  userId: string;
  /** Current authentication status */
  status: AuthStatus;
  /** Authentication method used for this session */
  authMethod: AuthMethod;
  /** Device information associated with the session */
  deviceId: string;
  /** IP address of the session */
  ipAddress: string;
  /** User agent string */
  userAgent: string;
  /** Risk level assessment for this session */
  riskLevel: RiskLevel;
  /** Timestamp when the session was created */
  createdAt: Date;
  /** Timestamp when the session expires */
  expiresAt: Date;
  /** Timestamp of the last activity */
  lastActivityAt: Date;
  /** Whether the session requires MFA */
  mfaRequired: boolean;
  /** Whether MFA has been completed */
  mfaCompleted: boolean;
}

/**
 * Represents an authentication challenge
 * (e.g., OTP verification, biometric prompt)
 */
export interface AuthChallenge {
  /** Unique challenge identifier */
  id: string;
  /** User ID this challenge belongs to */
  userId: string;
  /** Type of challenge */
  type: AuthMethod;
  /** Challenge payload (e.g., OTP code, magic link token) */
  payload: Record<string, unknown>;
  /** Timestamp when the challenge was created */
  createdAt: Date;
  /** Timestamp when the challenge expires */
  expiresAt: Date;
  /** Number of attempts made */
  attempts: number;
  /** Maximum number of attempts allowed */
  maxAttempts: number;
  /** Whether the challenge has been verified */
  verified: boolean;
  /** Risk level associated with this challenge */
  riskLevel: RiskLevel;
}

/**
 * Represents a user device for trust management
 */
export interface UserDevice {
  /** Unique device identifier */
  id: string;
  /** User ID associated with the device */
  userId: string;
  /** Device name (e.g., "iPhone 15 Pro") */
  name: string;
  /** Device type */
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  /** Operating system */
  os: string;
  /** Browser or application name */
  browser: string;
  /** Current trust level of the device */
  trustLevel: DeviceTrustLevel;
  /** Date the device was first registered */
  registeredAt: Date;
  /** Date of the last authentication from this device */
  lastAuthenticatedAt: Date;
  /** IP address of the device */
  lastIpAddress: string;
  /** Whether the device is currently active */
  isActive: boolean;
  /** Fingerprint hash for device identification */
  fingerprintHash: string;
}

/**
 * Represents a security event in the system
 */
export interface SecurityEvent {
  /** Unique event identifier */
  id: string;
  /** User ID associated with the event */
  userId: string;
  /** Type of security event */
  type: SecurityEventType;
  /** Severity level of the event */
  severity: RiskLevel;
  /** Description of the event */
  description: string;
  /** IP address where the event originated */
  ipAddress: string;
  /** Device ID associated with the event */
  deviceId?: string;
  /** Session ID associated with the event */
  sessionId?: string;
  /** Additional metadata about the event */
  metadata: Record<string, unknown>;
  /** Timestamp when the event occurred */
  occurredAt: Date;
  /** Whether the event has been resolved */
  resolved: boolean;
  /** Timestamp when the event was resolved */
  resolvedAt?: Date;
  /** User or system that resolved the event */
  resolvedBy?: string;
}

/**
 * Security event types
 */
export type SecurityEventType =
  | 'ACCOUNT_LOCKED'
  | 'AUTHENTICATION_FAILED'
  | 'DEVICE_TRUST_CHANGED'
  | 'MFA_COMPLETED'
  | 'MFA_FAILED'
  | 'PASSWORD_RESET'
  | 'RISKY_LOGIN_ATTEMPT'
  | 'SESSION_EXPIRED'
  | 'SESSION_REVOKED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'TRUSTED_DEVICE_ADDED'
  | 'TRUSTED_DEVICE_REMOVED';
