export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';
import { generateTotpSecret, encryptSecret, generateTotpUri } from '@/lib/totp';

/**
 * POST /api/authenticator/setup
 * Body: { userId }
 *
 * Generates a cryptographically secure TOTP secret, encrypts it,
 * stores a pending AuthenticatorCredential record (enabled = false),
 * and returns the setup information (otpauth URI + secret for manual entry).
 */
export async function POST(request: NextRequest) {
  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  const { userId } = body;
  if (!userId || typeof userId !== 'string') {
    return errorResponse('userId is required.', 400);
  }

  const ip = getClientIp(request);
  const rl = rateLimit(`totp:setup:ip:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) return rateLimitedResponse(rl.resetAt);

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, authenticator: true },
    });

    if (!user) {
      return errorResponse('User not found.', 404);
    }

    if (user.authenticator?.enabled) {
      return errorResponse('Authenticator App is already configured and enabled for this account.', 400, 'ALREADY_ENABLED');
    }

    // Generate fresh secret & encrypt it
    const secret = generateTotpSecret(20);
    const encryptedSecret = encryptSecret(secret);
    const otpauthUri = generateTotpUri(secret, user.email, 'AuthX');

    // Store or replace pending credential (enabled = false until verified)
    await db.authenticatorCredential.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        encryptedSecret,
        enabled: false,
      },
      update: {
        encryptedSecret,
        enabled: false,
        updatedAt: new Date(),
      },
    });

    return successResponse({
      secret,
      otpauthUri,
      issuer: 'AuthX',
      accountEmail: user.email,
    });
  } catch (err) {
    console.error('Authenticator setup error:', err);
    return errorResponse('Failed to initiate Authenticator setup.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
