export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { setChallenge } from '@/lib/challenge-store';
import { getWebAuthnConfig } from '@/lib/webauthn-config';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

/**
 * POST /api/auth/passkey/authenticate
 *
 * Body: { userId }
 *
 * Generates WebAuthn authentication options (challenge) for a user who already
 * has at least one registered passkey. The challenge is stored server-side
 * (single-use, 5-min TTL). Only the public options are returned.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const { userId } = (body ?? {}) as { userId?: string };
  if (!userId || typeof userId !== 'string') {
    return errorResponse('User ID is required.', 400);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`passkey:auth:ip:${ip}`, 10, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Fetch the user's registered passkeys (allowCredentials list).
    const passkeys = await db.passkeyCredential.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });

    if (passkeys.length === 0) {
      return errorResponse(
        'No passkey is registered for this account. Please sign up or use another method.',
        404,
        'NO_PASSKEY'
      );
    }

    const { rpID } = getWebAuthnConfig();

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: passkeys.map((passkey) => ({
        id: passkey.credentialId,
        type: 'public-key' as const,
        transports: passkey.transports
          ? (JSON.parse(passkey.transports) as AuthenticatorTransport[])
          : undefined,
      })),
      userVerification: 'preferred',
    });

    // Store the challenge (single-use) keyed by userId.
    setChallenge(userId, options.challenge);

    return successResponse({ options });
  } catch {
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
