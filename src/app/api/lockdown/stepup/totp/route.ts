export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';
import { decryptSecret, verifyTotpCode } from '@/lib/totp';
import { issueStepUpToken, STEPUP_SCOPE } from '@/lib/stepup-store';

/**
 * POST /api/lockdown/stepup/totp
 * Body: { sessionToken, token (6-digit TOTP) }
 *
 * Verifies the user's TOTP code using the EXISTING authenticator infrastructure.
 * On success, issues a short-lived scoped step-up authorization token.
 *
 * Security:
 *  - Derives userId from the authenticated session (NOT from request body)
 *  - Rejects if TOTP is not configured or not enabled
 *  - Rate limited per IP (15/10min) and per user (6/5min) — same as normal TOTP
 *  - Never returns the TOTP secret or the raw token in the response
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { sessionToken, token } = (body ?? {}) as {
    sessionToken?: string;
    token?: string;
  };

  if (!sessionToken || typeof sessionToken !== 'string') {
    return errorResponse('Authenticated session is required.', 401);
  }
  if (!token || !/^\d{6}$/.test(token.trim())) {
    return errorResponse('A valid 6-digit authenticator code is required.', 400, 'INVALID_FORMAT');
  }

  const ip = getClientIp(request);

  // Rate limit per IP
  const ipRl = rateLimit(`lockdown:stepup:totp:ip:${ip}`, 15, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Derive the authenticated user from the session — never trust userId from body
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: { include: { authenticator: true } } },
    });

    if (!session || session.status === 'revoked' || new Date() > session.expiresAt) {
      return errorResponse('Invalid or expired session. Please log in again.', 401);
    }

    const user = session.user;

    // Rate limit per user
    const userRl = rateLimit(`lockdown:stepup:totp:user:${user.id}`, 6, 5 * 60 * 1000);
    if (!userRl.allowed) return rateLimitedResponse(userRl.resetAt);

    if (!user.authenticator) {
      return errorResponse(
        'Authenticator App is not configured for this account.',
        400,
        'NOT_CONFIGURED'
      );
    }

    if (!user.authenticator.enabled) {
      return errorResponse(
        'Authenticator App setup was not completed. Please enable it in Security Policies first.',
        400,
        'NOT_ENABLED'
      );
    }

    const secret = decryptSecret(user.authenticator.encryptedSecret);
    const valid = verifyTotpCode(secret, token.trim(), 1);

    if (!valid) {
      return errorResponse(
        'Invalid authenticator code. Please check your app and enter the current code.',
        401,
        'INVALID_CODE'
      );
    }

    // Update lastUsedAt non-blocking
    db.authenticatorCredential
      .update({
        where: { userId: user.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    // Issue scoped step-up authorization token
    const stepUpToken = issueStepUpToken(user.id, 'totp', STEPUP_SCOPE);

    return successResponse({
      verified: true,
      stepUpToken,
      method: 'Authenticator App (TOTP)',
      expiresInSeconds: 300,
      scope: STEPUP_SCOPE,
    });
  } catch (err) {
    console.error('Lockdown step-up TOTP error:', err);
    return errorResponse('Verification failed. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
