export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { getChallenge } from '@/lib/challenge-store';
import { getWebAuthnConfig } from '@/lib/webauthn-config';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { uint8ArrayToBase64url, isUint8Array } from '@/lib/utils';
import { getClientIp, errorResponse, successResponse, rateLimitedResponse } from '@/lib/auth-api';

/**
 * POST /api/auth/passkey/verify
 *
 * Body: { userId, credential }
 *
 * Verifies the WebAuthn registration response against the stored challenge.
 * On success, stores ONLY public, non-sensitive data:
 *   - credentialId, publicKey (base64url), counter, deviceType, backedUp, transports
 * Private keys never leave the user's device and are never sent to this server.
 *
 * Challenge is single-use: it is consumed on read regardless of outcome.
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
    credential?: RegistrationResponseJSON;
  };
  if (!userId || typeof userId !== 'string') {
    return errorResponse('User ID is required.', 400);
  }
  if (!credential || typeof credential !== 'object') {
    return errorResponse('Credential data is required.', 400);
  }

  const ip = getClientIp(request);
  const ipRl = rateLimit(`passkey:regverify:ip:${ip}`, 15, 10 * 60 * 1000);
  if (!ipRl.allowed) return rateLimitedResponse(ipRl.resetAt);

  try {
    // Retrieve (and consume) the stored challenge.
    const expectedChallenge = getChallenge(userId);
    if (!expectedChallenge) {
      return errorResponse(
        'Your session has expired or no passkey request was made. Please try again.',
        410,
        'CHALLENGE_EXPIRED'
      );
    }

    const { rpID, origins } = getWebAuthnConfig();

    let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        requireUserVerification: false,
      });
    } catch (err) {
      console.error('Passkey registration verification error:', err);
      const message = err instanceof Error ? err.message : 'Passkey verification failed. Please try again.';
      return errorResponse(message, 400, 'VERIFICATION_FAILED');
    }

    if (!verification.verified || !verification.registrationInfo) {
      return errorResponse(
        'Passkey verification failed. Please try again.',
        400,
        'VERIFICATION_FAILED'
      );
    }

    const { registrationInfo } = verification;

    // Convert Uint8Array fields to base64url strings for SQLite storage.
    const credentialId = isUint8Array(registrationInfo.credentialID)
      ? uint8ArrayToBase64url(registrationInfo.credentialID as Uint8Array)
      : (registrationInfo.credentialID as string);

    const publicKey = isUint8Array(registrationInfo.credentialPublicKey)
      ? uint8ArrayToBase64url(registrationInfo.credentialPublicKey as Uint8Array)
      : (registrationInfo.credentialPublicKey as string);

    // Store the credential. The credentialId is unique; guard against duplicates.
    const existing = await db.passkeyCredential.findUnique({
      where: { credentialId },
      select: { id: true },
    });
    if (existing) {
      return errorResponse('This passkey is already registered.', 409, 'DUPLICATE_CREDENTIAL');
    }

    await db.passkeyCredential.create({
      data: {
        userId,
        credentialId,
        publicKey,
        counter: registrationInfo.counter,
        deviceType: registrationInfo.credentialDeviceType,
        backedUp: registrationInfo.credentialBackedUp,
        transports: JSON.stringify(registrationInfo.credentialTransports ?? ['internal']),
      },
    });

    return successResponse({ verified: true });
  } catch (err) {
    console.error('Passkey verify route error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return errorResponse(message, 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed.', 405);
}
