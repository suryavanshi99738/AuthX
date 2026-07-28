/**
 * Route Constants
 *
 * Defines all route path constants for the
 * BankShield Auth application.
 */

/**
 * Application route paths
 */
export const ROUTES = {
  /** Landing page */
  LANDING: '/',
  /** Login page */
  LOGIN: '/login',
  /** Registration page */
  REGISTER: '/register',
  /** Dashboard (authenticated) */
  DASHBOARD: '/dashboard',
  /** User profile */
  PROFILE: '/profile',
  /** Active sessions management */
  SESSIONS: '/sessions',
  /** Authentication history */
  HISTORY: '/history',
  /** Security settings */
  SETTINGS: '/settings',
} as const;

/**
 * Route path type
 */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * API route paths (internal Next.js API routes)
 */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY_OTP: '/api/auth/verify-otp',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session',
  },
  USER: {
    PROFILE: '/api/user/profile',
  },
  DEVICES: {
    LIST: '/api/devices',
  },
  SESSIONS: {
    LIST: '/api/sessions',
  },
  SECURITY: {
    EVENTS: '/api/security/events',
  },
} as const;
