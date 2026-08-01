export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { setChallenge } from '@/lib/challenge-store';
import { getWebAuthnConfig } from '@/lib/webauthn-config';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

/**
 * POST /api/auth/passkey/register
 *
 * Body: { userId, email }
 *
 * Generates WebAuthn registration options (challenge) for an existing user.
 * The challenge is stored server-side (single-use, 5-min TTL) and keyed by
 * userId. The user's existing credentials are excluded so the authenticator
 * does not create a duplicate for the same account.
 *
 * Only the public options are returned — the challenge itself stays server-side.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const { userId, email } = (body ?? {}) as { userId?: string; email?: string };
  if (!userId || typeof userId !== 'string') {
    return errorResponse('User ID is required.', 400);
  }
  if (!email || typeof email !== 'string') {
    return errorResponse('Email is required.', 400);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`passkey:reg:ip:${ip}`, 10, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Confirm the user exists before issuing a challenge.
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      return errorResponse('User not found.', 404, 'USER_NOT_FOUND');
    }

    // Exclude the user's existing credentials so a duplicate is not created.
    const existingPasskeys = await db.passkeyCredential.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });

    const { rpName, rpID } = getWebAuthnConfig();

    // @simplewebauthn/server v13 requires userID as a Uint8Array (not a string).
    const userIDBuffer = new TextEncoder().encode(userId);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userIDBuffer,
      userName: email,
      userDisplayName: user.name ?? email,
      excludeCredentials: existingPasskeys.map((passkey) => ({
        id: passkey.credentialId,
        type: 'public-key' as const,
        transports: passkey.transports
          ? (JSON.parse(passkey.transports) as AuthenticatorTransport[])
          : undefined,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Store the challenge server-side (single-use). Keyed by userId.
    setChallenge(userId, options.challenge);

    return successResponse({ options });
  } catch {
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
