export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';
import { decryptSecret, verifyTotpCode } from '@/lib/totp';

/**
 * POST /api/authenticator/verify
 * Body: { userId?, email?, token, isSetup?: boolean }
 *
 * Verifies a 6-digit TOTP code against the user's stored encrypted TOTP secret.
 * If isSetup = true, sets enabled = true upon successful verification.
 */
export async function POST(request: NextRequest) {
  let body: { userId?: string; email?: string; token?: string; isSetup?: boolean };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { userId, email, token, isSetup = false } = body;

  if (!token || !/^\d{6}$/.test(token.trim())) {
    return errorResponse('A valid 6-digit authenticator code is required.', 400, 'INVALID_FORMAT');
  }

  if (!userId && !email) {
    return errorResponse('userId or email is required.', 400);
  }

  const ip = getClientIp(request);
  const rl = rateLimit(`totp:verify:ip:${ip}`, 15, 10 * 60 * 1000);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  try {
    const user = await db.user.findFirst({
      where: userId ? { id: userId } : { email: email?.trim().toLowerCase() },
      include: { authenticator: true },
    });

    if (!user) {
      return errorResponse('User account not found.', 404);
    }

    if (!user.authenticator) {
      return errorResponse('Authenticator App is not configured for this account. Please set it up in Security Policies first.', 400, 'NOT_CONFIGURED');
    }

    // Rate limit per user to prevent brute force on 6-digit codes
    const userRl = rateLimit(`totp:verify:user:${user.id}`, 6, 5 * 60 * 1000);
    if (!userRl.allowed) {
      return errorResponse('Too many failed code verification attempts. Please wait 5 minutes before trying again.', 429, 'RATE_LIMITED');
    }

    if (!isSetup && !user.authenticator.enabled) {
      return errorResponse('Authenticator App setup was not completed.', 400, 'NOT_ENABLED');
    }

    const secret = decryptSecret(user.authenticator.encryptedSecret);
    const valid = verifyTotpCode(secret, token, 1);

    if (!valid) {
      return errorResponse('Invalid 6-digit authenticator code. Please check your authenticator app and enter the current code.', 400, 'INVALID_CODE');
    }

    // Code verified! Mark enabled if setup, and update lastUsedAt
    await db.authenticatorCredential.update({
      where: { userId: user.id },
      data: {
        enabled: true,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return successResponse({
      verified: true,
      userId: user.id,
      email: user.email,
    });
  } catch (err) {
    console.error('Authenticator verify error:', err);
    return errorResponse('Failed to verify Authenticator code.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
