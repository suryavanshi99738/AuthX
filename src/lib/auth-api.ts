/**
 * Auth API helpers — server-side only.
 */

import type { NextRequest } from 'next/server';

/**
 * Best-effort client IP extraction. Falls back to 'unknown' when no proxy
 * headers are present (typical for direct local access).
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const real = headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

/** Standard JSON error response that never leaks internal details. */
export function errorResponse(message: string, status = 400, code?: string) {
  return Response.json(
    { success: false, error: message, ...(code ? { code } : {}) },
    { status }
  );
}

/** Standard JSON success response. */
export function successResponse(data: Record<string, unknown>, status = 200) {
  return Response.json({ success: true, ...data }, { status });
}

/** Rate-limited (429) response. */
export function rateLimitedResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return Response.json(
    { success: false, error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}
