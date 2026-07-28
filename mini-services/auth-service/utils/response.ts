// Standardized API response helper - IMPLEMENTED

import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types/api.types';

export const response = {
  success<T>(data: T, message: string = 'Success', statusCode: number = 200): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  },

  error(message: string, statusCode: number = 500, errors?: any[]): ApiResponse<never> {
    return {
      success: false,
      message,
      errors: errors || [{ code: 'INTERNAL_ERROR', message }],
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  },

  paginated<T>(
    data: T[],
    pagination: { page: number; limit: number; total: number; totalPages: number }
  ): PaginatedResponse<T> {
    return {
      success: true,
      message: 'Success',
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
          hasNext: pagination.page < pagination.totalPages,
          hasPrev: pagination.page > 1,
        },
      },
    };
  },
};
