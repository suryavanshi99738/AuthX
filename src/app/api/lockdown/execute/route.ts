export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';
import { consumeStepUpToken, STEPUP_SCOPE } from '@/lib/stepup-store';
import { sendLockdownAlertEmail } from '@/lib/email-alerts';

/**
 * POST /api/lockdown/execute
 * Body: { sessionToken, stepUpToken }
 *
 * Executes Emergency Lockdown — revokes ALL active sessions EXCEPT the current one.
 *
 * Security requirements (all enforced server-side):
 *  1. sessionToken → derives the authenticated user and current session
 *  2. stepUpToken  → consumed from in-memory store (scoped, 5-min TTL, single-use)
 *  3. stepUpToken userId must match session userId (IDOR protection)
 *  4. Revocation uses individual Session record IDs (NOT device type / OS)
 *  5. Current session identified by actual Session.token — never client-supplied
 *  6. Audit event logged to LoginHistory
 *  7. Security email triggered (non-blocking, non-critical)
 *
 * Rejected methods (backend enforced via stepUpToken scope):
 *  ✗ Email OTP
 *  ✗ QR Login
 *  ✗ Normal session alone (no stepUpToken → rejected)
 *
 * Accepted methods (via step-up verification routes):
 *  ✓ Authenticator App (TOTP)  → /api/lockdown/stepup/totp
 *  ✓ Passkey                   → /api/lockdown/stepup/passkey
 *  ✓ Recovery Code             → /api/lockdown/stepup/recovery
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { sessionToken, stepUpToken } = (body ?? {}) as {
    sessionToken?: string;
    stepUpToken?: string;
  };

  if (!sessionToken || typeof sessionToken !== 'string') {
    return errorResponse('Authenticated session is required.', 401);
  }
  if (!stepUpToken || typeof stepUpToken !== 'string') {
    return errorResponse('Step-up authorization is required. Please verify your identity first.', 401, 'STEPUP_REQUIRED');
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`lockdown:execute:ip:${ip}`, 5, 15 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // 1. Derive authenticated user from session (never trust userId from body)
    const currentSession = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!currentSession || currentSession.status === 'revoked' || new Date() > currentSession.expiresAt) {
      return errorResponse('Invalid or expired session. Please log in again.', 401);
    }

    const userId = currentSession.userId;
    const user = currentSession.user;

    // 2. Per-user rate limit for lockdown execution
    const userRl = rateLimit(`lockdown:execute:user:${userId}`, 3, 15 * 60 * 1000);
    if (!userRl.allowed) return rateLimitedResponse(userRl.resetAt);

    // 3. Consume and validate the step-up token
    //    - verifies it belongs to THIS user (IDOR protection)
    //    - verifies the scope is emergency_lockdown
    //    - verifies it has not expired (5-min TTL)
    //    - marks it consumed (single-use, anti-replay)
    const stepUp = consumeStepUpToken(stepUpToken, userId, STEPUP_SCOPE);

    if (!stepUp) {
      return errorResponse(
        'Step-up authorization is invalid, expired, or already used. Please verify your identity again.',
        401,
        'INVALID_STEPUP'
      );
    }

    // 4. Execute lockdown — revoke ALL sessions except the current one
    //    Uses individual Session.id records (NOT device type / OS / deviceName)
    const revokeResult = await db.session.deleteMany({
      where: {
        userId,
        NOT: { id: currentSession.id }, // protect by actual Session record ID
      },
    });

    const revokedCount = revokeResult.count;

    // 5. Audit: record to LoginHistory
    try {
      await db.loginHistory.create({
        data: {
          userId,
          method: `Emergency Lockdown (${stepUp.method === 'totp' ? 'Authenticator App' : stepUp.method === 'passkey' ? 'Passkey' : 'Recovery Code'})`,
          device: currentSession.deviceName || 'Current Device',
          browser: currentSession.browser || null,
          status: 'success',
          riskLevel: 'High',
          ipAddress: ip,
          location: currentSession.location || null,
          deviceId: currentSession.instanceId || null,
          isDemo: currentSession.isDemo,
        },
      });

      // Risk assessment entry for the lockdown event
      await db.riskAssessment.create({
        data: {
          userId,
          score: 70,
          level: 'High',
          reasons: JSON.stringify([
            'Emergency Lockdown Executed',
            `Step-up: ${stepUp.method}`,
            `${revokedCount} session(s) revoked`,
          ]),
          ipAddress: ip,
        },
      }).catch(() => {});
    } catch (auditErr) {
      console.warn('Non-blocking audit warning in lockdown execute:', auditErr);
    }

    // 6. Security email alert — non-blocking, never breaks lockdown
    const methodLabel =
      stepUp.method === 'totp'
        ? 'Authenticator App (TOTP)'
        : stepUp.method === 'passkey'
        ? 'Passkey'
        : 'Recovery Code';

    sendLockdownAlertEmail({
      userId,
      email: user.email,
      methodLabel,
      deviceName: currentSession.deviceName || 'Your Device',
      os: currentSession.os || undefined,
      browser: currentSession.browser || undefined,
      location: currentSession.location || undefined,
      ipAddress: ip,
      revokedCount,
    }).catch(() => {});

    return successResponse({
      executed: true,
      revokedCount,
      message: `Emergency Lockdown activated. ${revokedCount} other active session${revokedCount !== 1 ? 's' : ''} revoked.`,
      method: methodLabel,
      currentSessionActive: true,
    });
  } catch (err) {
    console.error('Lockdown execute error:', err);
    return errorResponse('Emergency Lockdown failed. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
