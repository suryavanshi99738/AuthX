/**
 * API Client Configuration
 *
 * Provides a configured axios instance for API calls
 * throughout the BankShield Auth application.
 */

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT, HTTP_STATUS_CODES } from '@/constants/api';

/**
 * Storage keys for auth tokens
 */
const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  DEVICE_ID: 'device_id',
} as const;

/**
 * Configured axios instance
 *
 * Features:
 * - Base URL from environment configuration
 * - Request/response interceptors for auth and error handling
 * - Automatic token refresh on 401 responses
 * - Device fingerprint header injection
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request interceptor
 * Injects authentication headers and device information
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      // Add device identification
      const deviceId = localStorage.getItem(AUTH_STORAGE_KEYS.DEVICE_ID);
      if (deviceId && config.headers) {
        config.headers['X-Device-Id'] = deviceId;
      }

      // Add request timestamp for anti-replay protection
      if (config.headers) {
        config.headers['X-Request-Timestamp'] = Date.now().toString();
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles authentication errors and automatic token refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Handle 401 Unauthorized with token refresh
    if (
      status === HTTP_STATUS_CODES.UNAUTHORIZED &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-session`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data?.data ?? {};

          if (accessToken) {
            localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
            if (newRefreshToken) {
              localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            }

            // Retry the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return apiClient(originalRequest);
          }
        } catch {
          // Refresh failed - clear tokens and redirect
          localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
          // Future: redirect to login page
        }
      }
    }

    // Handle 403 Forbidden
    if (status === HTTP_STATUS_CODES.FORBIDDEN) {
      // Future: show access denied notification
    }

    // Handle 429 Rate Limited
    if (status === HTTP_STATUS_CODES.TOO_MANY_REQUESTS) {
      // Future: show rate limit notification with cooldown timer
    }

    // Handle 5xx Server Errors
    if (status >= HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR) {
      // Future: show server error notification
    }

    return Promise.reject(error);
  }
);

export { apiClient, AUTH_STORAGE_KEYS };
export default apiClient;
