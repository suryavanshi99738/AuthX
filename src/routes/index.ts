/**
 * Route Configuration - Barrel Export
 *
 * Defines route paths and guard metadata for the
 * BankShield Auth application.
 */

import { ROUTES } from '@/constants/routes';

/**
 * Route guard metadata type
 * Defines the protection level and requirements for each route
 */
export interface RouteGuardMetadata {
  /** Whether the route requires authentication */
  requiresAuth: boolean;
  /** Whether the route is only accessible by unauthenticated users (e.g., login) */
  guestOnly: boolean;
  /** Required device trust level to access the route */
  requiredTrustLevel?: 'none' | 'low' | 'medium' | 'high';
  /** Whether the route requires a specific auth method */
  requiredAuthMethod?: string[];
  /** Route to redirect to if guard conditions are not met */
  redirectTo?: string;
}

/**
 * Route guard configuration map
 * Maps route paths to their guard metadata
 */
export const ROUTE_GUARDS: Record<string, RouteGuardMetadata> = {
  [ROUTES.LANDING]: {
    requiresAuth: false,
    guestOnly: false,
  },
  [ROUTES.LOGIN]: {
    requiresAuth: false,
    guestOnly: true,
    redirectTo: ROUTES.DASHBOARD,
  },
  [ROUTES.REGISTER]: {
    requiresAuth: false,
    guestOnly: true,
    redirectTo: ROUTES.DASHBOARD,
  },
  [ROUTES.DASHBOARD]: {
    requiresAuth: true,
    guestOnly: false,
    redirectTo: ROUTES.LOGIN,
  },
  [ROUTES.PROFILE]: {
    requiresAuth: true,
    guestOnly: false,
    requiredTrustLevel: 'low',
    redirectTo: ROUTES.LOGIN,
  },
  [ROUTES.SESSIONS]: {
    requiresAuth: true,
    guestOnly: false,
    requiredTrustLevel: 'medium',
    redirectTo: ROUTES.LOGIN,
  },
  [ROUTES.HISTORY]: {
    requiresAuth: true,
    guestOnly: false,
    requiredTrustLevel: 'medium',
    redirectTo: ROUTES.LOGIN,
  },
  [ROUTES.SETTINGS]: {
    requiresAuth: true,
    guestOnly: false,
    requiredTrustLevel: 'high',
    redirectTo: ROUTES.LOGIN,
  },
};

/**
 * Check if a route requires authentication
 */
export function isAuthRequiredRoute(path: string): boolean {
  return ROUTE_GUARDS[path]?.requiresAuth ?? false;
}

/**
 * Check if a route is guest-only
 */
export function isGuestOnlyRoute(path: string): boolean {
  return ROUTE_GUARDS[path]?.guestOnly ?? false;
}

/**
 * Get the redirect path for a route based on guard conditions
 */
export function getRouteRedirect(path: string): string | undefined {
  return ROUTE_GUARDS[path]?.redirectTo;
}

export { ROUTES };
