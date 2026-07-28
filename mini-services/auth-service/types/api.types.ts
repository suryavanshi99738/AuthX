// API response/request type definitions

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  detail?: unknown;
}

export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta: ApiMeta & {
    pagination: PaginationMeta;
  };
}

export interface ApiRequest {
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  ip?: string;
  userAgent?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version?: string;
  services?: {
    database: 'connected' | 'disconnected';
  };
}
