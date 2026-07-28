/**
 * API Constants
 *
 * Defines all API-related constants including base URLs,
 * endpoints, timeout values, and HTTP status codes.
 */

/**
 * API base URL
 * Uses environment variable with fallback to default
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

/**
 * API request timeout in milliseconds
 */
export const API_TIMEOUT = 30000;

/**
 * API endpoint paths
 * Organized by resource/domain
 */
export const API_ENDPOINTS = {
  AUTH: {
    /** Initiate login flow */
    LOGIN: '/auth/login',
    /** Register a new account */
    REGISTER: '/auth/register',
    /** Verify OTP code */
    VERIFY_OTP: '/auth/verify-otp',
    /** Request a new OTP */
    REQUEST_OTP: '/auth/request-otp',
    /** Verify magic link token */
    VERIFY_MAGIC_LINK: '/auth/verify-magic-link',
    /** Request a magic link */
    REQUEST_MAGIC_LINK: '/auth/request-magic-link',
    /** Initiate passkey authentication */
    PASSKEY_CHALLENGE: '/auth/passkey/challenge',
    /** Verify passkey response */
    PASSKEY_VERIFY: '/auth/passkey/verify',
    /** Logout and invalidate session */
    LOGOUT: '/auth/logout',
    /** Refresh the current session */
    REFRESH_SESSION: '/auth/refresh-session',
    /** Get current session info */
    GET_SESSION: '/auth/session',
  },
  USER: {
    /** Get current user profile */
    PROFILE: '/user/profile',
    /** Update user profile */
    UPDATE_PROFILE: '/user/profile',
    /** Change user password */
    CHANGE_PASSWORD: '/user/change-password',
    /** Delete user account */
    DELETE_ACCOUNT: '/user/account',
  },
  DEVICES: {
    /** List user devices */
    LIST: '/devices',
    /** Get device details */
    DETAIL: (id: string) => `/devices/${id}`,
    /** Register a new device */
    REGISTER: '/devices/register',
    /** Remove a device */
    REMOVE: (id: string) => `/devices/${id}`,
    /** Update device trust level */
    UPDATE_TRUST: (id: string) => `/devices/${id}/trust`,
    /** Verify a device */
    VERIFY: (id: string) => `/devices/${id}/verify`,
  },
  SESSIONS: {
    /** List active sessions */
    LIST: '/sessions',
    /** Get session details */
    DETAIL: (id: string) => `/sessions/${id}`,
    /** Revoke a session */
    REVOKE: (id: string) => `/sessions/${id}`,
    /** Revoke all other sessions */
    REVOKE_ALL: '/sessions/revoke-all',
  },
  SECURITY: {
    /** List security events */
    EVENTS: '/security/events',
    /** Get security event details */
    EVENT_DETAIL: (id: string) => `/security/events/${id}`,
    /** Resolve a security event */
    RESOLVE_EVENT: (id: string) => `/security/events/${id}/resolve`,
    /** Get current risk assessment */
    RISK_ASSESSMENT: '/security/risk-assessment',
    /** Get security overview */
    OVERVIEW: '/security/overview',
  },
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * API error codes
 */
export const API_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INVALID: 'OTP_INVALID',
  OTP_MAX_ATTEMPTS: 'OTP_MAX_ATTEMPTS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  DEVICE_NOT_TRUSTED: 'DEVICE_NOT_TRUSTED',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  RISK_TOO_HIGH: 'RISK_TOO_HIGH',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  MAGIC_LINK_EXPIRED: 'MAGIC_LINK_EXPIRED',
  MAGIC_LINK_INVALID: 'MAGIC_LINK_INVALID',
  PASSKEY_ERROR: 'PASSKEY_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;
