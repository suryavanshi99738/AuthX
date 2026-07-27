/**
 * TanStack Query Client Configuration
 *
 * Provides a configured QueryClient instance for
 * server state management in the BankShield Auth application.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Default stale time for queries in milliseconds
 * Data is considered fresh for 5 minutes
 */
const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Default cache time for queries in milliseconds
 * Unused data is cached for 30 minutes
 */
const DEFAULT_CACHE_TIME = 30 * 60 * 1000;

/**
 * Maximum number of retries for failed queries
 */
const DEFAULT_MAX_RETRIES = 3;

/**
 * Retry delay in milliseconds (exponential backoff base)
 */
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Configured TanStack Query Client
 *
 * Features:
 * - Default stale time of 5 minutes
 * - Default cache time of 30 minutes
 * - Exponential backoff retry strategy
 * - Error handling configuration
 * - Devtools configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** Time in ms after which data is considered stale */
      staleTime: DEFAULT_STALE_TIME,
      /** Time in ms after which inactive queries are garbage collected */
      gcTime: DEFAULT_CACHE_TIME,
      /** Number of retries for failed queries */
      retry: DEFAULT_MAX_RETRIES,
      /** Retry delay with exponential backoff */
      retryDelay: (attemptIndex) => {
        return Math.min(
          DEFAULT_RETRY_DELAY * Math.pow(2, attemptIndex),
          30 * 1000 // Max 30 seconds
        );
      },
      /** Refetch on window focus for security-sensitive data */
      refetchOnWindowFocus: true,
      /** Don't refetch on reconnect by default */
      refetchOnReconnect: false,
      /** Don't refetch on mount if data is fresh */
      refetchOnMount: true,
    },
    mutations: {
      /** No retries for mutations by default */
      retry: false,
    },
  },
});

/**
 * Query key factory for consistent query key generation
 * Follows the pattern: [entity, action, ...params]
 */
export const QUERY_KEYS = {
  auth: {
    session: ['auth', 'session'] as const,
    challenge: (id: string) => ['auth', 'challenge', id] as const,
  },
  user: {
    profile: ['user', 'profile'] as const,
  },
  devices: {
    list: ['devices', 'list'] as const,
    detail: (id: string) => ['devices', 'detail', id] as const,
  },
  sessions: {
    list: ['sessions', 'list'] as const,
    detail: (id: string) => ['sessions', 'detail', id] as const,
  },
  security: {
    events: ['security', 'events'] as const,
    eventDetail: (id: string) => ['security', 'events', id] as const,
    overview: ['security', 'overview'] as const,
    riskAssessment: ['security', 'risk-assessment'] as const,
  },
} as const;

/**
 * Default query options for auth-related queries
 * Auth data should be more aggressively refetched
 */
export const AUTH_QUERY_OPTIONS = {
  staleTime: 2 * 60 * 1000, // 2 minutes for auth data
  refetchOnWindowFocus: 'always',
  refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes for session changes
} as const;

export default queryClient;
