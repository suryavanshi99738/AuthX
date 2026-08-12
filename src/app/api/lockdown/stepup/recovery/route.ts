export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';
import { issueStepUpToken, STEPUP_SCOPE } from '@/lib/stepup-store';
import { verifyRecoveryCode, normalizeRecoveryCode } from '@/lib/recovery';

/**
 * POST /api/lockdown/stepup/recovery
 * Body: { sessionToken, recoveryCode }
 *
 * Verifies an unused recovery code for Emergency Lockdown step-up.
 * Uses the EXISTING RecoveryCode table and verifyRecoveryCode utility.
 *
 * Security:
 *  - Derives userId from the authenticated session (NOT from request body)
 *  - Atomic single-use enforcement via updateMany({ where: { id, used: false } })
 *  - Rate limited: 10 attempts per 15 minutes per user+IP
 *  - Never exposes which code matched or internal error details
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { sessionToken, recoveryCode } = (body ?? {}) as {
    sessionToken?: string;
    recoveryCode?: string;
  };

  if (!sessionToken || typeof sessionToken !== 'string') {
    return errorResponse('Authenticated session is required.', 401);
  }
  if (!recoveryCode || typeof recoveryCode !== 'string') {
    return errorResponse('Recovery code is required.', 400);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`lockdown:stepup:recovery:ip:${ip}`, 10, 15 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Derive authenticated user from session
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.status === 'revoked' || new Date() > session.expiresAt) {
      return errorResponse('Invalid or expired session. Please log in again.', 401);
    }

    const userId = session.userId;

    // Per-user rate limit
    const userRl = rateLimit(`lockdown:stepup:recovery:user:${userId}`, 10, 15 * 60 * 1000);
    if (!userRl.allowed) return rateLimitedResponse(userRl.resetAt);

    const normalized = normalizeRecoveryCode(recoveryCode);
    if (normalized.length < 6) {
      return errorResponse('Invalid recovery code format.', 400);
    }

    // Fetch all unused codes for this user
    const unusedCodes = await db.recoveryCode.findMany({
      where: { userId, used: false },
      select: { id: true, codeHash: true },
    });

    if (unusedCodes.length === 0) {
      return errorResponse(
        'No recovery codes remaining. Please regenerate your Recovery Kit.',
        401,
        'NO_CODES_REMAINING'
      );
    }

    // Constant-time scan for matching code
    let matchedId: string | null = null;
    for (const entry of unusedCodes) {
      if (verifyRecoveryCode(normalized, entry.codeHash)) {
        matchedId = entry.id;
        break;
      }
    }

    if (!matchedId) {
      return errorResponse('Invalid recovery code.', 401, 'INVALID_CODE');
    }

    // Atomic single-use mark (race-condition safe)
    const updateResult = await db.recoveryCode.updateMany({
      where: { id: matchedId, used: false },
      data: { used: true, usedAt: new Date() },
    });

    if (updateResult.count === 0) {
      // Another concurrent request already consumed this code
      return errorResponse('Invalid recovery code.', 401, 'INVALID_CODE');
    }

    // Issue scoped step-up token
    const stepUpToken = issueStepUpToken(userId, 'recovery_code', STEPUP_SCOPE);

    return successResponse({
      verified: true,
      stepUpToken,
      method: 'Recovery Code',
      expiresInSeconds: 300,
      scope: STEPUP_SCOPE,
    });
  } catch (err) {
    console.error('Lockdown step-up recovery error:', err);
    return errorResponse('Verification failed. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
