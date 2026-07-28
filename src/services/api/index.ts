/**
 * API Service - Configured Axios Instance
 *
 * Provides a pre-configured axios instance for making
 * API requests throughout the BankShield Auth application.
 */

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@/constants/api';

/**
 * Configured axios instance for API calls
 *
 * Features:
 * - Base URL configuration from environment variables
 * - Request timeout configuration
 * - Request interceptor for adding auth headers
 * - Response interceptor for error handling
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * Adds authentication headers to outgoing requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token header if available
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add device fingerprint header if available
    const deviceId = typeof window !== 'undefined'
      ? localStorage.getItem('device_id')
      : null;

    if (deviceId && config.headers) {
      config.headers['X-Device-Id'] = deviceId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles common response errors and token refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response?.status;

    // Handle 401 Unauthorized - redirect to login
    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        // Future: redirect to login page
      }
    }

    // Handle 403 Forbidden - insufficient permissions
    if (status === 403) {
      // Future: show access denied message
    }

    // Handle 429 Too Many Requests - rate limited
    if (status === 429) {
      // Future: show rate limit message
    }

    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;
