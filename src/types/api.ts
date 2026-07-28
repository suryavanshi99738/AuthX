/**
 * API Type Definitions
 *
 * Defines all API-related types, interfaces, and generics
 * for the BankShield Auth application.
 */

import type { Nullable } from './common';

/**
 * Standard API response wrapper
 * All API responses follow this consistent format
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data payload */
  data: Nullable<T>;
  /** Error information if the request failed */
  error: Nullable<ApiError>;
  /** Response metadata */
  meta: ApiResponseMeta;
}

/**
 * API error structure
 */
export interface ApiError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Detailed error information */
  details?: Record<string, unknown>;
  /** Validation errors for form fields */
  validationErrors?: ValidationError[];
  /** Timestamp when the error occurred */
  timestamp: string;
  /** Request trace ID for debugging */
  traceId?: string;
}

/**
 * Validation error for specific fields
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  /** Validation error message */
  message: string;
  /** Validation rule that failed */
  rule: string;
  /** The value that failed validation */
  value?: unknown;
}

/**
 * API response metadata
 */
export interface ApiResponseMeta {
  /** Request timestamp */
  timestamp: string;
  /** Request ID for tracing */
  requestId: string;
  /** API version */
  version: string;
}

/**
 * Paginated API response
 * Extends ApiResponse with pagination metadata
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  /** Pagination information */
  pagination: PaginationInfo;
}

/**
 * Pagination information in API responses
 */
export interface PaginationInfo {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Search query string */
  search?: string;
}

/**
 * Request configuration for API calls
 */
export interface RequestConfig {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom headers to include */
  headers?: Record<string, string>;
  /** Whether to include authentication headers */
  withAuth?: boolean;
  /** Whether to retry on failure */
  retry?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * HTTP method types
 */
export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
