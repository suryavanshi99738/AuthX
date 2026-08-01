export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { getChallenge } from '@/lib/challenge-store';
import { getWebAuthnConfig } from '@/lib/webauthn-config';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { base64urlToUint8Array } from '@/lib/utils';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

/**
 * POST /api/auth/passkey/auth-verify
 *
 * Body: { userId, credential }
 *
 * Verifies a WebAuthn authentication response:
 *   - Challenge matches the stored single-use challenge.
 *   - Origin matches the configured RP origin.
 *   - RP ID matches the configured RP ID.
 *   - Signature is valid for the stored public key.
 *   - Counter is greater than the stored counter (replay protection).
 *
 * On success, updates the stored counter and creates an authenticated session.
 * The challenge is single-use: it is consumed on read regardless of outcome.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request.', 400);
  }

  const { userId, credential } = (body ?? {}) as {
    userId?: string;
    credential?: AuthenticationResponseJSON;
  };
  if (!userId || typeof userId !== 'string') {
    return errorResponse('User ID is required.', 400);
  }
  if (!credential || typeof credential !== 'object') {
    return errorResponse('Credential data is required.', 400);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`passkey:authverify:ip:${ip}`, 15, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Retrieve (and consume) the single-use challenge.
    const expectedChallenge = getChallenge(userId);
    if (!expectedChallenge) {
      return errorResponse(
        'Your session has expired or no passkey request was made. Please try again.',
        410,
        'CHALLENGE_EXPIRED'
      );
    }

    // Look up the credential used.
    const passkey = await db.passkeyCredential.findFirst({
      where: { userId, credentialId: credential.id },
    });
    if (!passkey) {
      return errorResponse(
        'Passkey not recognized. Please try again.',
        404,
        'CREDENTIAL_NOT_FOUND'
      );
    }

    const { rpID, origins } = getWebAuthnConfig();

    // Convert the stored base64url public key back to Uint8Array for verification.
    const publicKeyUint8Array = base64urlToUint8Array(passkey.publicKey);

    let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        credential: {
          id: passkey.credentialId,
          publicKey: publicKeyUint8Array,
          counter: passkey.counter,
        },
        requireUserVerification: false,
      });
    } catch (err) {
      console.error('Passkey authentication verification error:', err);
      const message = err instanceof Error ? err.message : 'Passkey verification failed. Please try again.';
      return errorResponse(message, 400, 'VERIFICATION_FAILED');
    }

    if (!verification.verified) {
      return errorResponse(
        'Passkey verification failed. Please try again.',
        400,
        'VERIFICATION_FAILED'
      );
    }

    // Update the stored counter (replay protection — counter must increase).
    await db.passkeyCredential.update({
      where: { id: passkey.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    // Create an authenticated session (24-hour expiry).
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.session.create({
      data: { userId, token, expiresAt },
    });

    return successResponse({
      verified: true,
      session: { token, expiresAt: expiresAt.toISOString() },
    });
  } catch (err) {
    console.error('Passkey auth-verify route error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return errorResponse(message, 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
